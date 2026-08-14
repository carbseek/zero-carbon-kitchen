/**
 * 零碳厨房共创征集 · 一体化服务器（零依赖 Node）
 * - 静态托管 dist/
 * - POST /api/submissions        征集提交 → server/data/submissions.jsonl
 * - GET  /api/admin/submissions  管理端读取（需 key）
 * - GET  /api/admin/stats        管理端统计（需 key）
 * - GET  /api/admin/export       导出 CSV（需 key）
 * - 页面访问自动记录来源参数 from → server/data/visits.jsonl
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const SUB_FILE = path.join(DATA_DIR, "submissions.jsonl");
const VISIT_FILE = path.join(DATA_DIR, "visits.jsonl");

const PORT = Number(process.env.PORT || 8787);
const KEY_FILE = path.join(__dirname, "admin-key.txt");
let ADMIN_KEY = process.env.ADMIN_KEY || "";
if (!ADMIN_KEY) {
  if (fs.existsSync(KEY_FILE)) ADMIN_KEY = fs.readFileSync(KEY_FILE, "utf8").trim();
  else {
    ADMIN_KEY = crypto.randomBytes(12).toString("hex");
    fs.writeFileSync(KEY_FILE, ADMIN_KEY, { mode: 0o600 });
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".webp": "image/webp", ".txt": "text/plain; charset=utf-8",
};

const readJsonl = (f) => {
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, "utf8").split("\n").filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
};

const send = (res, code, body, type = "application/json; charset=utf-8") => {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
};

const authed = (url) => url.searchParams.get("key") === ADMIN_KEY;

function computeStats() {
  const subs = readJsonl(SUB_FILE);
  const visits = readJsonl(VISIT_FILE);
  const cities = ["上海奉贤", "佛山", "山东济南", "均可，服从安排"];
  const byCity = Object.fromEntries(cities.map((c) => [c, { total: 0, l45: 0 }]));
  let valid = 0, l45 = 0;
  for (const s of subs) {
    if (s.org?.trim() && s.role?.trim()) valid++;
    const hi = s.level === "L4" || s.level === "L5";
    if (hi) l45++;
    if (byCity[s.city]) {
      byCity[s.city].total++;
      if (hi) byCity[s.city].l45++;
    }
  }
  const visitCount = (src) => visits.filter((v) => (v.from || "").includes(src)).length;
  const trainingVisits = visitCount("training");
  return {
    submissions: { total: subs.length, valid, l45 },
    cities: byCity,
    traffic: {
      total: visits.length,
      fromArticle: visitCount("wechat-carbon-ruler-2") - trainingVisits,
      fromTrainingEntry: trainingVisits,
    },
    updatedAt: new Date().toISOString(),
  };
}

function toCsv(rows) {
  const head = ["提交时间", "编号", "单位名称", "单位类型", "职务", "联系方式", "优先地点", "参与意向", "希望带来", "问题或方案", "来源"];
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""').replaceAll("\n", " ")}"`;
  const lines = [head.map(esc).join(",")];
  for (const s of rows) {
    lines.push([s.submittedAt, s.id, s.org, s.orgType, s.role, s.contact, s.city, s.level,
      (s.brings || []).join("/"), s.message, s.from].map(esc).join(","));
  }
  return "﻿" + lines.join("\r\n"); // BOM for Excel
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // ---- CORS（允许 GitHub Pages 等静态托管跨域调用）----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  // ---- 访问来源追踪 beacon（静态托管下由前端触发；同源页面加载亦记录）----
  if (url.pathname === "/api/track" && req.method === "GET") {
    fs.appendFileSync(VISIT_FILE, JSON.stringify({
      at: new Date().toISOString(), from: (url.searchParams.get("from") || "direct").slice(0, 60),
    }) + "\n");
    return send(res, 200, { ok: true });
  }
  if ((url.pathname === "/" || url.pathname === "/index.html") && url.searchParams.get("from")) {
    fs.appendFileSync(VISIT_FILE, JSON.stringify({
      at: new Date().toISOString(), from: url.searchParams.get("from"),
    }) + "\n");
  }

  // ---- API ----
  if (url.pathname === "/api/submissions" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 64 * 1024) req.destroy(); });
    req.on("end", () => {
      try {
        const d = JSON.parse(body || "{}");
        if (!d.orgType || !d.contact || !d.city || !d.level || d.agree !== true) {
          return send(res, 400, { ok: false, error: "missing required fields" });
        }
        const rec = {
          id: "ZC-" + Date.now().toString(36).toUpperCase() + "-" +
              crypto.randomBytes(2).toString("hex").toUpperCase(),
          org: String(d.org || "").slice(0, 100),
          orgType: String(d.orgType).slice(0, 60),
          role: String(d.role || "").slice(0, 60),
          contact: String(d.contact).slice(0, 100),
          city: String(d.city).slice(0, 30),
          level: String(d.level).slice(0, 4),
          brings: Array.isArray(d.brings) ? d.brings.map((b) => String(b).slice(0, 30)) : [],
          message: String(d.message || "").slice(0, 2000),
          from: String(d.from || "direct").slice(0, 60),
          submittedAt: new Date().toISOString(),
        };
        fs.appendFileSync(SUB_FILE, JSON.stringify(rec) + "\n");
        send(res, 200, { ok: true, id: rec.id });
      } catch {
        send(res, 400, { ok: false, error: "bad request" });
      }
    });
    return;
  }

  if (url.pathname === "/api/admin/submissions" && req.method === "GET") {
    if (!authed(url)) return send(res, 401, { ok: false, error: "unauthorized" });
    return send(res, 200, { ok: true, rows: readJsonl(SUB_FILE).reverse() });
  }
  if (url.pathname === "/api/admin/stats" && req.method === "GET") {
    if (!authed(url)) return send(res, 401, { ok: false, error: "unauthorized" });
    return send(res, 200, { ok: true, stats: computeStats() });
  }
  if (url.pathname === "/api/admin/export" && req.method === "GET") {
    if (!authed(url)) return send(res, 401, { ok: false, error: "unauthorized" });
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=cocreate-submissions.csv",
    });
    return res.end(toCsv(readJsonl(SUB_FILE)));
  }

  // ---- 静态资源 + SPA fallback ----
  let fp = path.normalize(path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname));
  if (!fp.startsWith(DIST)) return send(res, 403, { ok: false });
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(DIST, "index.html");
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[zc-kitchen] serving dist/ at http://localhost:${PORT}`);
  console.log(`[zc-kitchen] admin key: ${ADMIN_KEY}`);
});
