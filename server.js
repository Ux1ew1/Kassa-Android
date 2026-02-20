/**
 * HTTP сервер для приложения кассы (API + статические файлы)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import qrcode from "qrcode-terminal";

// Константы
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_MENU = [];
const PREFERRED_INTERFACE = process.env.PREFERRED_INTERFACE || "rmnet_data2";
const PREFERRED_INTERFACES = (process.env.PREFERRED_INTERFACES || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const DEFAULT_INTERFACE_HINTS = [
  "tailscale",
  "zerotier",
  "wireguard",
  "openvpn",
  "vpn",
  "wg",
  "tun",
  "tap",
  "utun",
  "ppp",
  "l2tp",
  "pptp",
  "rmnet",
  "wlan",
  "wi-fi",
  "wifi",
  "ethernet",
  "en",
  "eth",
];

// Пути
const __filename = fileURLToPath(import.meta.url);
const baseDir = path.dirname(__filename);
const dataDir = path.join(baseDir, "data");
const menuFile = path.join(dataDir, "menu.json");
const distDir = path.join(baseDir, "dist");
const publicDir = path.join(baseDir, "public");

/**
 * Возвращает IPv4-адрес: сначала rmnet_data2 (как на телефоне), затем типичные Wi‑Fi интерфейсы,
 * затем первый внешний адрес. Нужен для вывода ссылки и QR-кода.
 */
const getLanIp = () => {
  const networks = os.networkInterfaces();
  if (!networks) return null;

  const pickAddress = (ifaceName) => {
    const entries = networks[ifaceName];
    if (!entries) return null;
    const target = entries.find(
      (item) =>
        item &&
        item.family === "IPv4" &&
        !item.internal &&
        item.address &&
        !item.address.startsWith("169.254."),
    );
    return target?.address || null;
  };

  const normalize = (value) => value.toLowerCase();
  const interfaceNames = Object.keys(networks);
  const preferredHints = [
    ...PREFERRED_INTERFACES,
    PREFERRED_INTERFACE,
    ...DEFAULT_INTERFACE_HINTS,
  ].filter(Boolean);

  for (const hint of preferredHints) {
    const hintLower = normalize(hint);
    const match = interfaceNames.find((name) => {
      const nameLower = normalize(name);
      return nameLower === hintLower || nameLower.includes(hintLower);
    });
    if (!match) continue;
    const address = pickAddress(match);
    if (address) return address;
  }

  for (const entries of Object.values(networks)) {
    if (!entries) continue;
    const target = entries.find(
      (item) =>
        item &&
        item.family === "IPv4" &&
        !item.internal &&
        item.address &&
        !item.address.startsWith("169.254."),
    );
    if (target?.address) return target.address;
  }

  return null;
};

const getAllLanIps = () => {
  const networks = os.networkInterfaces();
  if (!networks) return [];
  const results = [];

  for (const entries of Object.values(networks)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (
        entry &&
        entry.family === "IPv4" &&
        !entry.internal &&
        entry.address &&
        !entry.address.startsWith("169.254.")
      ) {
        results.push(entry.address);
      }
    }
  }

  return [...new Set(results)];
};

// Утилиты для работы с файлами
const { readFile, writeFile } = fs.promises;

/**
 * Определяет MIME-тип файла по расширению
 * @param {string} filePath - Путь к файлу
 * @returns {string} - MIME-тип
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".jsx": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
  };
  return types[ext] || "application/octet-stream";
};

/**
 * Записывает данные в JSON файл
 * @param {string} filePath - Путь к файлу
 * @param {any} data - Данные для записи
 */
const writeJsonFile = async (filePath, data) => {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const content = JSON.stringify(data, null, 2);
    await writeFile(filePath, content, "utf-8");
  } catch (error) {
    console.error(`Ошибка записи файла ${filePath}:`, error);
    throw error;
  }
};

/**
 * Обеспечивает существование файла данных
 * @param {string} filePath - Путь к файлу
 * @param {any} fallback - Значение по умолчанию
 */
const ensureDataFile = async (filePath, fallback) => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch {
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await writeJsonFile(filePath, fallback);
    } catch (error) {
      console.error(`Ошибка создания файла ${filePath}:`, error);
      throw error;
    }
  }
};

/**
 * Читает JSON файл
 * @param {string} filePath - Путь к файлу
 * @param {any} fallback - Значение по умолчанию
 * @returns {Promise<any>} - Прочитанные данные
 */
const readJsonFile = async (filePath, fallback = null) => {
  if (fallback !== null) {
    await ensureDataFile(filePath, fallback);
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Ошибка чтения файла ${filePath}:`, error);
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
};

/**
 * Нормализует данные меню
 * @param {any} data - Входные данные
 * @returns {Object} - Нормализованные данные {items, activeOrder}
 */
const normalizeMenuData = (data) => {
  let items = [];
  let activeOrder = [];

  // Извлекаем items
  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === "object") {
    if (Array.isArray(data.items)) {
      items = data.items;
    }
    if (Array.isArray(data.activeOrder)) {
      activeOrder = data.activeOrder;
    }
  }

  // Валидация и очистка items
  items = items.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.id !== "undefined" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      item.price >= 0,
  );

  // Создаем множество валидных ID
  const validIds = new Set(items.map((item) => item.id));

  // Очищаем activeOrder от невалидных ID
  const seen = new Set();
  const sanitizedOrder = [];

  activeOrder.forEach((id) => {
    if (validIds.has(id) && !seen.has(id)) {
      sanitizedOrder.push(id);
      seen.add(id);
    }
  });

  // Добавляем видимые элементы, которых нет в activeOrder
  items.forEach((item) => {
    if (item?.show && !seen.has(item.id) && validIds.has(item.id)) {
      sanitizedOrder.push(item.id);
      seen.add(item.id);
    }
  });

  return { items, activeOrder: sanitizedOrder };
};

/**
 * Читает данные меню из файла
 * @returns {Promise<Object>} - Нормализованные данные меню
 */
const readMenuData = async () => {
  const raw = await readJsonFile(menuFile, DEFAULT_MENU);
  return normalizeMenuData(raw);
};

/**
 * Записывает данные меню в файл
 * @param {any} data - Данные для записи
 * @returns {Promise<Object>} - Нормализованные данные
 */
const writeMenuData = async (data) => {
  const normalized = normalizeMenuData(data);
  await writeJsonFile(menuFile, normalized);
  return normalized;
};

/**
 * Отправляет JSON ответ
 * @param {http.ServerResponse} res - Объект ответа
 * @param {number} statusCode - HTTP статус код
 * @param {any} payload - Данные для отправки
 */
const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
};

/**
 * Парсит тело запроса как JSON
 * @param {http.IncomingMessage} req - Объект запроса
 * @returns {Promise<Object>} - Распарсенные данные
 */
const parseRequestBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw || raw.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid JSON");
  }
};

/**
 * Обрабатывает GET запрос к /api/menu
 * @param {http.ServerResponse} res - Объект ответа
 */
const handleGetMenu = async (res) => {
  try {
    const { items, activeOrder } = await readMenuData();
    sendJson(res, 200, {
      menu: items,
      activeOrder,
    });
  } catch (error) {
    console.error("Ошибка чтения меню:", error);
    sendJson(res, 500, { message: "Не удалось загрузить меню" });
  }
};

/**
 * Обрабатывает PUT запрос к /api/menu
 * @param {http.IncomingMessage} req - Объект запроса
 * @param {http.ServerResponse} res - Объект ответа
 */
const handleUpdateMenu = async (req, res) => {
  try {
    const payload = await parseRequestBody(req);

    const items = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.menu)
        ? payload.menu
        : null;

    if (!Array.isArray(items)) {
      return sendJson(res, 400, { message: "Меню должно быть массивом" });
    }

    const activeOrder = Array.isArray(payload?.activeOrder)
      ? payload.activeOrder
      : [];

    const normalized = await writeMenuData({ items, activeOrder });

    sendJson(res, 200, {
      message: "Меню обновлено",
      menu: normalized.items,
      activeOrder: normalized.activeOrder,
    });
  } catch (error) {
    console.error("Ошибка обновления меню:", error);
    if (error.message === "Invalid JSON") {
      return sendJson(res, 400, { message: "Некорректный JSON" });
    }
    sendJson(res, 500, { message: "Не удалось обновить меню" });
  }
};

/**
 * Проверяет существование директории
 */
const dirExists = async (dirPath) => {
  try {
    const stat = await fs.promises.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

/**
 * Отдает статические файлы (сначала из dist, затем из public)
 * @param {http.IncomingMessage} req - Объект запроса
 * @param {http.ServerResponse} res - Объект ответа
 */
const serveStatic = async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");

    // Определяем корневую директорию для статических файлов
    let staticDir = null;
    let indexPath = null;

    // Проверяем наличие dist (продакшен сборка)
    if (await dirExists(distDir)) {
      staticDir = distDir;
      indexPath = path.join(distDir, "index.html");
    } else if (await dirExists(publicDir)) {
      // Fallback на public для разработки
      staticDir = publicDir;
      indexPath = path.join(baseDir, "index.html");
    }

    // Если нет статической директории, отдаем 404
    if (!staticDir) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found - Build the project first: npm run build");
      return;
    }

    // Для корневого пути отдаем index.html
    const filePath =
      safePath === "/" || safePath === "/index.html"
        ? indexPath
        : path.join(staticDir, safePath);

    const stat = await fs.promises.stat(filePath);

    if (stat.isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }

    const content = await readFile(filePath);
    res.writeHead(200, { "Content-Type": getMimeType(filePath) });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      // Для SPA - отдаем index.html для всех маршрутов
      try {
        const indexPath = (await dirExists(distDir))
          ? path.join(distDir, "index.html")
          : path.join(baseDir, "index.html");
        const content = await readFile(indexPath);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
      }
    } else {
      console.error("Ошибка отдачи статического файла:", error);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("500 Internal Server Error");
    }
  }
};

/**
 * Обработчик всех запросов
 * @param {http.IncomingMessage} req - Объект запроса
 * @param {http.ServerResponse} res - Объект ответа
 */
const requestHandler = async (req, res) => {
  try {
    // Обработка CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    // Игнорируем favicon
    if (req.url === "/favicon.ico") {
      res.writeHead(204);
      return res.end();
    }

    // API маршруты
    if (req.url.startsWith("/api/")) {
      if (req.method === "GET" && req.url === "/api/menu") {
        return handleGetMenu(res);
      }
      if (req.method === "PUT" && req.url === "/api/menu") {
        return handleUpdateMenu(req, res);
      }
      return sendJson(res, 404, { message: "Неизвестный API маршрут" });
    }

    // Статические файлы
    await serveStatic(req, res);
  } catch (error) {
    console.error("Необработанная ошибка:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    }
    res.end(JSON.stringify({ message: "Внутренняя ошибка сервера" }));
  }
};

// Создание и запуск сервера
const server = http.createServer(requestHandler);

server.listen(PORT, HOST, async () => {
  const hasDist = await dirExists(distDir);
  console.log(`🚀 Сервер запущен: http://${HOST}:${PORT}`);
  console.log(`📁 Данные меню: ${menuFile}`);
  console.log(
    `📦 Статические файлы: ${hasDist ? distDir : "используйте 'npm run build' для создания"}`,
  );
  const publicUrl = (process.env.PUBLIC_URL || "").trim();
  const lanIp = getLanIp();
  const allIps = getAllLanIps();
  const resolvedUrl = publicUrl || (lanIp ? `http://${lanIp}:${PORT}` : null);

  if (resolvedUrl) {
    console.log(`???? ???????????? ???? ????????: ${resolvedUrl}`);
    console.log("???? QR-?????? ?????? ???????????????? ????????????????:");
    qrcode.generate(resolvedUrl, { small: true });
  } else {
    console.log(
      "?????? IP ???? ????????????. ???????????????????? ifconfig (rmnet_data2) ?? ?????????????? ???? http://<IP>:3000",
    );
  }

  if (allIps.length > 1) {
    console.log("Available IPv4 addresses:");
    allIps.forEach((ip) => console.log(` - http://${ip}:${PORT}`));
  }

  console.log(`\n💡 Для разработки используйте: npm run dev`);
  console.log(
    `💡 Для продакшена соберите проект: npm run build, затем: npm start\n`,
  );
});

// Обработка ошибок сервера
server.on("error", (error) => {
  console.error("Ошибка сервера:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Порт ${PORT} уже занят. Попробуйте другой порт.`);
  }
});
