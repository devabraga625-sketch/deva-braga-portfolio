const endpoint = process.env.DOWNLOAD_ENDPOINT ?? "https://devabraga-59enyuvp.manus.space/api/trpc/portfolio.registerDownload";
const projectKey = process.env.PROJECT_KEY ?? "festival-gastronomico-da-feira-de-sao-joaquim";
const concurrency = Number(process.env.CONCURRENCY ?? 40);
const mediaIndex = Number(process.env.MEDIA_INDEX ?? 424);
const started = performance.now();
const results = await Promise.all(Array.from({ length: concurrency }, () => fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ json: { projectKey, mediaIndex } }),
}).then(async response => ({ status: response.status, body: await response.text() })).catch(error => ({ status: 0, body: String(error) }))));
const elapsedMs = Math.round(performance.now() - started);
const ok = results.filter(item => item.status >= 200 && item.status < 300).length;
const failed = results.length - ok;
console.log(JSON.stringify({ concurrency, elapsedMs, ok, failed, statuses: [...new Set(results.map(item => item.status))] }, null, 2));
if (failed) {
  console.error(results.find(item => !(item.status >= 200 && item.status < 300))?.body?.slice(0, 500));
  process.exitCode = 1;
}
