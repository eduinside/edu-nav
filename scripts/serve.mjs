// 로컬 정적 프리뷰 서버 (개발용). 배포는 Cloudflare Pages 정적 호스팅 사용.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = process.env.PORT || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

http
  .createServer(async (req, res) => {
    let path = decodeURIComponent(req.url.split("?")[0]);
    if (path === "/") path = "/index.html";
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("403"); }
    try {
      const data = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(data);
    } catch {
      // /tutor 같은 분야 경로는 index.html로 폴백한다 (Cloudflare Pages의 _redirects와 동일 동작)
      if (!extname(file)) {
        try {
          const html = await readFile(join(ROOT, "index.html"));
          res.writeHead(200, { "content-type": TYPES[".html"], "cache-control": "no-store" });
          return res.end(html);
        } catch { /* fall through */ }
      }
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
    }
  })
  .listen(PORT, () => console.log(`serving ${ROOT} → http://localhost:${PORT}`));
