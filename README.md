# Kassa React

Веб-приложение кассы на React с админ‑панелью и локальным API сервером для хранения меню.

## Возможности

- Просмотр меню и добавление товаров в чек
- Несколько чеков, подсчет суммы и сдачи
- Поиск по меню и фильтрация по категориям
- Админ‑панель для управления позициями
- Сохранение чеков в localStorage
- Меню хранится в `data/menu.json`

## Стек

- React 18
- React Router
- Vite
- Node.js сервер (`server.js`)

## Быстрый старт (разработка)

1. Установите зависимости:
```bash
npm install
```

2. Запустите API сервер:
```bash
npm run server
```

3. Запустите frontend dev‑сервер:
```bash
npm run dev
```

Frontend доступен на `http://localhost:5173`, API — на `http://localhost:3000`.
Vite автоматически проксирует `/api` запросы на backend.

## Продакшен

1. Соберите проект:
```bash
npm run build
```

2. Запустите сервер (он обслуживает и API, и статику):
```bash
npm start
```

Приложение будет доступно по адресу `http://localhost:3000`.

## Android / Termux

Подробные инструкции:
- `TERMUX.md`
- `quick-start-termux.md`

## API

- `GET /api/menu` — получить меню
- `PUT /api/menu` — сохранить меню

Ожидаемый формат:
```json
{
  "items": [{"id": 1, "name": "...", "price": 0, "show": true, "category": "напитки"}],
  "activeOrder": [1, 2, 3]
}
```

## Переменные окружения сервера

- `HOST` — хост сервера (по умолчанию `0.0.0.0`)
- `PORT` — порт сервера (по умолчанию `3000`)
- `PUBLIC_URL` — внешний URL, который выводится в логах
- `PREFERRED_INTERFACE` — предпочтительный сетевой интерфейс
- `PREFERRED_INTERFACES` — список интерфейсов через запятую

## Структура проекта

```
Kassa/
├── data/            # данные меню
├── dist/            # production сборка
├── public/          # статические файлы
├── src/             # исходники React
├── server.js        # backend сервер
├── vite.config.js   # конфигурация Vite
└── package.json
```
"# Kassa-Android" 
