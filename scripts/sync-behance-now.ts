import { ensureBehanceSyncJob } from "../server/db";
import { fetchPublicBehanceProjects } from "../server/behance-sync";
import { upsertBehanceProjects, updateBehanceSyncJob } from "../server/db";

const jobName = "behance-public-sync";
await ensureBehanceSyncJob(jobName);
const projects = await fetchPublicBehanceProjects();
await upsertBehanceProjects(projects);
await updateBehanceSyncJob(jobName, { lastSyncedAt: new Date(), lastStatus: "success", lastError: null });
console.log(JSON.stringify({ count: projects.length, first: projects[0], last: projects.at(-1) }, null, 2));
