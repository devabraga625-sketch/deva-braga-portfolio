import { upsertBehanceProjects, updateBehanceSyncJob } from "./db";

const PROFILE_URL = "https://www.behance.net/deva_braga";
const JOB_NAME = "behance-public-sync";

type PublicProject = {
  projectKey: string;
  title: string;
  sourceUrl: string;
  cover?: string;
  publishedAt?: Date;
};

function decode(value: string) {
  return value.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\\u002F/g, "/").replace(/\\\//g, "/");
}

export async function fetchPublicBehanceProjects(): Promise<PublicProject[]> {
  let response: Response | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch(PROFILE_URL, {
        headers: { "user-agent": "Mozilla/5.0 (portfolio sync)" },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) break;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 2_000));
    }
  }
  if (!response && lastError) throw lastError;
  if (!response) throw new Error("Behance profile did not return a response");
  if (!response.ok) throw new Error(`Behance profile returned ${response.status}`);
  const html = await response.text();
  const projects: PublicProject[] = [];
  const seen = new Set<string>();
  for (const match of Array.from(html.matchAll(/<article>([\s\S]*?)<\/article>/gi))) {
    const block = match[1];
    const href = block.match(/href="\/gallery\/(\d+)\/([^"?]+)"/i);
    if (!href) continue;
    const projectKey = href[1];
    if (seen.has(projectKey)) continue;
    seen.add(projectKey);
    const titleMatch = block.match(/aria-label="([^"]+)"/i) || block.match(/alt="([^"]+)"/i);
    const coverMatch = block.match(/https:\/\/mir-s3-cdn-cf\.behance\.net\/projects\/(?:max_808|808|404)\/[^\"\s]+/i);
    const slug = decode(href[2]);
    projects.push({
      projectKey,
      title: decode(titleMatch?.[1] ?? slug.replace(/-/g, " ")),
      sourceUrl: `https://www.behance.net/gallery/${projectKey}/${slug}`,
      cover: coverMatch?.[0]?.replace(/\\u0026/g, "&"),
    });
  }
  return projects.map((project, index) => ({ ...project, publishedAt: new Date(Date.now() - index * 1000) }));
}

export async function syncPublicBehanceProjects() {
  const startedAt = new Date();
  try {
    const projects = await fetchPublicBehanceProjects();
    await upsertBehanceProjects(projects);
    await updateBehanceSyncJob(JOB_NAME, { lastSyncedAt: startedAt, lastStatus: "success", lastError: null });
    return { count: projects.length, syncedAt: startedAt.toISOString() };
  } catch (error) {
    await updateBehanceSyncJob(JOB_NAME, { lastSyncedAt: startedAt, lastStatus: "error", lastError: String(error) }).catch(() => undefined);
    throw error;
  }
}

export { JOB_NAME };
