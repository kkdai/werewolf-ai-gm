#!/bin/bash

# Test Docker build locally before deploying to Cloud Run
# This helps catch build issues early

echo "🚀 Starting local Docker build test..."
echo "======================================"

# Build the Docker image
docker build -t werewolf-ai-gm-test:latest .

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker build succeeded!"
    echo ""
    echo "To test the image locally, run:"
    echo "  docker run -p 8080:8080 -e GEMINI_API_KEY=your_key_here werewolf-ai-gm-test:latest"
    echo ""
    echo "Then visit: http://localhost:8080"
else
    echo ""
    echo "❌ Docker build failed!"
    echo "Please fix the errors above before deploying to Cloud Run."
    exit 1
fi
