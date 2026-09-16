import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicBehanceProjects } from "./behance-sync";

describe("fetchPublicBehanceProjects", () => {
  afterEach(() => vi.restoreAllMocks());

  it("extracts gallery ids, titles, canonical links, and original covers", async () => {
    const html = `
      <article>
        <div aria-label="Projeto de Teste, estudo visual">
          <picture><img src="https://mir-s3-cdn-cf.behance.net/projects/404/abc.jpg" /></picture>
          <a href="/gallery/123456/Projeto-de-Teste"></a>
        </div>
      </article>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(html, { status: 200 })));

    const projects = await fetchPublicBehanceProjects();

    expect(projects).toEqual([{
      projectKey: "123456",
      title: "Projeto de Teste, estudo visual",
      sourceUrl: "https://www.behance.net/gallery/123456/Projeto-de-Teste",
      cover: "https://mir-s3-cdn-cf.behance.net/projects/404/abc.jpg",
    }]);
  });
});
