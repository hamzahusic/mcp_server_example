#!/bin/bash
# Quick start script for running with Ollama

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🦙 Starting Task Manager with Ollama..."
echo ""

# Check if Ollama is running
echo "🔍 Checking Ollama connection..."
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama not running. Start it with: ollama serve"
    exit 1
fi
echo "✅ Ollama is running"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ℹ️  Open 3 separate terminals and run:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Terminal 1 (MCP Server):"
echo "  cd mcp_server"
echo "  source ../backend/venv/bin/activate"
echo "  python3 main.py"
echo ""
echo "Terminal 2 (Backend - wait 2 seconds before running):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  export USE_OLLAMA=true"
echo "  export OLLAMA_URL=http://localhost:11434"
echo "  export OLLAMA_MODEL=qwen2.5:7b"
echo "  uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "Terminal 3 (Frontend - wait 3 seconds before running):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Once all are running:"
echo "  📱 Open: http://localhost:5173"
echo "  📚 Docs: http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
