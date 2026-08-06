#!/bin/bash
# Start SunnahPath preview server (persistent)
# Kills any existing server, then starts a new one

cd /home/z/my-project

# Kill existing servers
pkill -f "node scripts/serve.mjs" 2>/dev/null
sleep 1

# Start server (runs for 10 hours)
nohup timeout 36000 node scripts/serve.mjs > /tmp/sunnahpath-serve.log 2>&1 &

# Wait and verify
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ | grep -q "200"; then
  echo "✅ SunnahPath is LIVE at http://localhost:3000"
  echo "   Preview: https://preview-3822770c.space-z.ai/"
else
  echo "❌ Server failed to start"
  cat /tmp/sunnahpath-serve.log
fi
