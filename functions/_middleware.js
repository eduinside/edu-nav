// edu-nav.pages.dev 접속을 정본 도메인(nav.dgedu.link)으로 301 리다이렉트한다.
// _redirects는 호스트 단위 조건을 지원하지 않아 Pages Functions로 처리한다.
const LEGACY_HOST = "edu-nav.pages.dev";
const CANONICAL_HOST = "nav.dgedu.link";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === LEGACY_HOST) {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
