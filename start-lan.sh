#!/bin/bash
# Запуск сайта в локальной сети (macOS/Linux)

set -euo pipefail

echo "🚀 Запуск сайта в локальной сети..."
echo ""

# Проверка наличия Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js не установлен!"
  echo "Установите Node.js и повторите попытку."
  exit 1
fi

# Установка зависимостей при необходимости
if [ ! -d "node_modules" ]; then
  echo "📦 Установка зависимостей..."
  npm install
  echo ""
fi

# Сборка, если нет dist
if [ ! -d "dist" ]; then
  echo "📦 Сборка проекта..."
  npm run build
  echo ""
fi

# Получение IP адреса (macOS и Linux)
IP=""
if command -v ipconfig >/dev/null 2>&1; then
  IP="$(ipconfig getifaddr en0 || true)"
  if [ -z "$IP" ]; then
    IP="$(ipconfig getifaddr en1 || true)"
  fi
elif command -v hostname >/dev/null 2>&1; then
  IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi

echo "🌐 Сервер будет доступен по адресу:"
echo "   http://localhost:3000"
if [ -n "$IP" ]; then
  echo "   http://$IP:3000"
else
  echo "   (IP не найден автоматически, проверьте адрес в настройках сети)"
fi
echo ""

npm start
