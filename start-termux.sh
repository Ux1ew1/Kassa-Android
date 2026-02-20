#!/bin/bash
# Script for launching the app in Termux.

set -euo pipefail

echo "Starting Kassa in Termux..."
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed."
  echo "Install it with: pkg install nodejs"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

get_ip_address() {
  local ip
  ip="$(ip addr show wlan0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)"
  if [ -z "$ip" ]; then
    ip="$(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -n1)"
  fi
  echo "$ip"
}

IP="$(get_ip_address)"
echo "Device IP: ${IP:-not found}"
echo ""
echo "Choose run mode:"
echo "1) Development mode (dev + backend manually)"
echo "2) Production mode (build + server)"
echo "3) Backend server only"
read -r -p "Enter choice (1-3): " choice

case "$choice" in
1)
  echo ""
  echo "Development mode uses two terminals:"
  echo "Terminal 1: npm run server"
  echo "Terminal 2: npm run dev"
  echo ""
  read -r -p "Start backend now? (y/n): " start_backend
  if [ "$start_backend" = "y" ]; then
    echo "Backend starting on http://localhost:3000"
    npm run server
  fi
  ;;
2)
  if [ ! -d "dist" ]; then
    echo "Building app..."
    npm run build
    echo ""
  fi
  echo "Starting server..."
  echo "Local: http://localhost:3000"
  if [ -n "$IP" ]; then
    echo "LAN: http://$IP:3000"
  fi
  npm start
  ;;
3)
  echo "Starting backend server..."
  echo "API: http://localhost:3000/api/menu"
  if [ -n "$IP" ]; then
    echo "LAN API: http://$IP:3000/api/menu"
  fi
  npm run server
  ;;
*)
  echo "Invalid choice"
  exit 1
  ;;
esac
