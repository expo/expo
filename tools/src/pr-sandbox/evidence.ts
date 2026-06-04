import { PrSandboxClient } from './client';
import { createDeepCodeReviewSandboxContext } from './context';
import { fetchPublicPullRequestRefAsync } from './github';
import { capSandboxLogs } from './logs';
import { getSandboxSnapshotPaths, selectSandboxPresets } from './presets';
import type {
  PrSandboxEvidenceReport,
  ProjectSnapshot,
  SandboxPreset,
  SandboxPresetResult,
} from './types';

export type CollectSandboxEvidenceOptions = {
  prUrl: string;
  client: PrSandboxClient;
  logLimit?: number;
  destroyJob?: boolean;
};

async function readProjectSnapshotAsync(
  client: PrSandboxClient,
  jobId: string
): Promise<ProjectSnapshot> {
  const files: ProjectSnapshot['files'] = {};

  await Promise.all(
    getSandboxSnapshotPaths().map(async (path) => {
      try {
        files[path] = (await client.readFileAsync(jobId, path)).content;
      } catch {
        files[path] = null;
      }
    })
  );

  return { files };
}

async function runPresetCapturingAsync(
  client: PrSandboxClient,
  jobId: string,
  preset: SandboxPreset
): Promise<SandboxPresetResult> {
  try {
    return await client.runPresetAsync(jobId, preset);
  } catch (caught) {
    return {
      preset,
      success: false,
      error: caught instanceof Error ? caught.message : String(caught),
    };
  }
}

export async function collectSandboxEvidenceAsync(
  options: CollectSandboxEvidenceOptions
): Promise<PrSandboxEvidenceReport> {
  const pullRequest = await fetchPublicPullRequestRefAsync(options.prUrl);
  const job = await options.client.createPrJobAsync(pullRequest);
  const presetResults: SandboxPresetResult[] = [];

  try {
    presetResults.push(await runPresetCapturingAsync(options.client, job.jobId, 'checkout'));
    const snapshot = await readProjectSnapshotAsync(options.client, job.jobId);
    const presets = selectSandboxPresets(snapshot).filter((preset) => preset !== 'checkout');

    for (const preset of presets) {
      presetResults.push(await runPresetCapturingAsync(options.client, job.jobId, preset));
    }

    const logs = capSandboxLogs(
      (await options.client.getLogsAsync(job.jobId)).logs,
      options.logLimit
    );
    const reportWithoutContext: PrSandboxEvidenceReport = {
      generatedAt: new Date().toISOString(),
      pullRequest,
      jobId: job.jobId,
      presets: presetResults,
      logs,
      context: '',
    };

    return {
      ...reportWithoutContext,
      context: createDeepCodeReviewSandboxContext(reportWithoutContext),
    };
  } finally {
    if (options.destroyJob) {
      await options.client.destroyJobAsync(job.jobId);
    }
  }
}
