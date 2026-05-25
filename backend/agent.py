import os
import json
from datetime import date
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import services.tasks as svc
from mcp_client import call_tool, get_tools

router = APIRouter()

USE_OLLAMA = os.environ.get("USE_OLLAMA", "true").lower() == "true"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")

if USE_OLLAMA:
    from openai import AsyncOpenAI
    ollama_client = AsyncOpenAI(api_key="ollama", base_url=f"{OLLAMA_URL}/v1")
else:
    import anthropic
    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def build_system_prompt(tools: list[dict]) -> str:
    today = date.today().strftime("%B %d, %Y")
    tool_lines = "\n".join(
        f"  {t['function']['name']}: {t['function']['description']}"
        for t in tools
    )
    return (
        f"You are a task management assistant. Today is {today}.\n\n"
        f"Available tools:\n{tool_lines}\n\n"
        f"Rules:\n"
        f"- ALWAYS call a tool before answering any question about tasks.\n"
        f"- ALWAYS use the right tool for every operation — never fake an action.\n"
        f"- NEVER invent task data; use tool results as the source of truth.\n"
        f"- Be concise.\n\n"
        f"Critical distinctions — do NOT confuse these:\n"
        f"- delete/remove a task → call delete_task (works on both done and pending tasks)\n"
        f"- mark a task done/finished/completed → call complete_task\n"
        f"- uncheck/reopen/undo a task → call reopen_task\n"
        f"Never call complete_task or reopen_task when the user wants to DELETE a task."
    )


async def stream_response_ollama(websocket: WebSocket, history: list):
    tools = await get_tools()
    messages = [{"role": "system", "content": build_system_prompt(tools)}] + history.copy()
    full_text = ""

    while True:
        try:
            response = await ollama_client.chat.completions.create(
                model=OLLAMA_MODEL,
                messages=messages,
                tools=tools,
                temperature=0.3,
                stream=False,
            )
        except Exception as e:
            error_msg = f"Error calling Ollama: {str(e)}"
            await websocket.send_json({"type": "text_delta", "content": error_msg})
            full_text = error_msg
            break

        choice = response.choices[0]

        if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
            messages.append({
                "role": "assistant",
                "content": choice.message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in choice.message.tool_calls
                ],
            })

            for tc in choice.message.tool_calls:
                tool_args = json.loads(tc.function.arguments)

                if tc.function.name == "delete_task":
                    task_id = tool_args.get("task_id")
                    await websocket.send_json({
                        "type": "confirmation_required",
                        "tool_use_id": tc.id,
                        "task_id": task_id,
                        "summary": f"Delete task #{task_id}?",
                    })
                    raw = await websocket.receive_text()
                    confirm_msg = json.loads(raw)
                    if confirm_msg.get("type") == "user_confirmation" and confirm_msg.get("confirmed"):
                        tool_result = await call_tool(tc.function.name, tool_args)
                    else:
                        tool_result = json.dumps({"cancelled": True, "message": "User cancelled deletion"})
                else:
                    tool_result = await call_tool(tc.function.name, tool_args)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": tool_result,
                })
            continue

        full_text = choice.message.content or ""
        if full_text:
            await websocket.send_json({"type": "text_delta", "content": full_text})
        break

    tasks = svc.list_all()
    await websocket.send_json({"type": "tasks_updated", "tasks": tasks})
    await websocket.send_json({"type": "message_complete"})
    history.append({"role": "assistant", "content": full_text})


async def stream_response_anthropic(websocket: WebSocket, history: list):
    tools = await get_tools()
    anthropic_tools = [
        {
            "name": t["function"]["name"],
            "description": t["function"]["description"],
            "input_schema": t["function"]["parameters"],
        }
        for t in tools
    ]

    messages = history.copy()
    full_text = ""

    while True:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=(
                f"You are a task management assistant. Today is {date.today().strftime('%B %d, %Y')}. "
                f"Use your tools for every task operation. Be concise."
            ),
            messages=messages,
            tools=anthropic_tools,
        )

        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

        for block in response.content:
            if block.type == "text" and block.text:
                full_text += block.text
                await websocket.send_json({"type": "text_delta", "content": block.text})

        if not tool_use_blocks:
            break

        messages.append({
            "role": "assistant",
            "content": [b.model_dump() for b in response.content],
        })

        tool_results = []
        for block in tool_use_blocks:
            tool_result = await call_tool(block.name, block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": tool_result,
            })

        messages.append({"role": "user", "content": tool_results})

    tasks = svc.list_all()
    await websocket.send_json({"type": "tasks_updated", "tasks": tasks})
    await websocket.send_json({"type": "message_complete"})

    history.append({"role": "assistant", "content": full_text or ""})


@router.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    await websocket.accept()
    history: list = []

    initial_tasks = svc.list_all()
    await websocket.send_json({"type": "tasks_updated", "tasks": initial_tasks})

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("type") != "user_message":
                continue

            user_text = msg.get("content", "").strip()
            if not user_text:
                continue

            history.append({"role": "user", "content": user_text})

            try:
                if USE_OLLAMA:
                    await stream_response_ollama(websocket, history)
                else:
                    await stream_response_anthropic(websocket, history)
            except Exception as e:
                await websocket.send_json({"type": "text_delta", "content": f"Error: {str(e)}"})
                await websocket.send_json({"type": "message_complete"})

    except WebSocketDisconnect:
        pass
