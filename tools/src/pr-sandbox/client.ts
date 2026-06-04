import type {
  SandboxCommandRequest,
  SandboxCommandResult,
  PrSandboxJob,
  PrSandboxJobRequest,
  SandboxLogResponse,
  SandboxPresetResult,
  SandboxReadFileResponse,
  SandboxTaskStatus,
} from './types';
import {
  normalizeSandboxCommandRequest,
  normalizeSandboxPath,
  validateSandboxPreset,
} from './validation';

export type PrSandboxClientOptions = {
  workerUrl: string;
  authToken?: string;
  pollIntervalMs?: number;
};

const DEFAULT_POLL_INTERVAL_MS = 2_000;
const TASK_TIMEOUT_GRACE_MS = 60_000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getFetchErrorMessage(url: URL, error: unknown): string {
  const cause =
    error instanceof Error && error.cause instanceof Error ? `: ${error.cause.message}` : '';
  return `Sandbox service request failed before receiving a response from ${url.toString()}: ${getErrorMessage(
    error
  )}${cause}. Check PR_SANDBOX_WORKER_URL and that the Worker is deployed/reachable. If this was a long-running action, check get_logs because it may still be running.`;
}

function delayAsync(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTaskStatus<T>(value: unknown): value is SandboxTaskStatus<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { taskId?: unknown }).taskId === 'string' &&
    typeof (value as { status?: unknown }).status === 'string'
  );
}

export class PrSandboxClient {
  private readonly workerUrl: URL;
  private readonly authToken?: string;
  private readonly pollIntervalMs: number;

  constructor(options: PrSandboxClientOptions) {
    this.workerUrl = new URL(options.workerUrl);
    this.authToken = options.authToken;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  }

  async createPrJobAsync(request: PrSandboxJobRequest): Promise<PrSandboxJob> {
    return await this.requestAsync('/jobs', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runPresetAsync(jobId: string, presetInput: string): Promise<SandboxPresetResult> {
    const preset = validateSandboxPreset(presetInput);
    const result = await this.requestAsync<
      SandboxPresetResult | SandboxTaskStatus<SandboxPresetResult>
    >(`/jobs/${encodeURIComponent(jobId)}/presets/${preset}?async=1`, {
      method: 'POST',
    });
    return await this.resolveTaskAsync(jobId, result);
  }

  async runCommandAsync(
    jobId: string,
    request: SandboxCommandRequest
  ): Promise<SandboxCommandResult> {
    const result = await this.requestAsync<
      SandboxCommandResult | SandboxTaskStatus<SandboxCommandResult>
    >(`/jobs/${encodeURIComponent(jobId)}/commands?async=1`, {
      method: 'POST',
      body: JSON.stringify(normalizeSandboxCommandRequest(request)),
    });
    return await this.resolveTaskAsync(jobId, result);
  }

  async getTaskAsync<T>(jobId: string, taskId: string): Promise<SandboxTaskStatus<T>> {
    return await this.requestAsync(
      `/jobs/${encodeURIComponent(jobId)}/tasks/${encodeURIComponent(taskId)}`
    );
  }

  async getLogsAsync(jobId: string): Promise<SandboxLogResponse> {
    return await this.requestAsync(`/jobs/${encodeURIComponent(jobId)}/logs`);
  }

  async readFileAsync(jobId: string, path: string): Promise<SandboxReadFileResponse> {
    const normalizedPath = normalizeSandboxPath(path);
    return await this.requestAsync(
      `/jobs/${encodeURIComponent(jobId)}/files?path=${encodeURIComponent(normalizedPath)}`
    );
  }

  async destroyJobAsync(jobId: string): Promise<{ jobId: string; destroyed: true }> {
    return await this.requestAsync(`/jobs/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
    });
  }

  private async resolveTaskAsync<T>(jobId: string, result: T | SandboxTaskStatus<T>): Promise<T> {
    if (!isTaskStatus<T>(result)) {
      return result;
    }

    let status = result;
    const deadline = Date.now() + status.timeout + TASK_TIMEOUT_GRACE_MS;

    while (status.status === 'running') {
      if (Date.now() > deadline) {
        throw new Error(
          `Sandbox task ${status.taskId} did not finish within ${status.timeout}ms. Check get_logs for progress.`
        );
      }
      await delayAsync(this.pollIntervalMs);
      status = await this.getTaskAsync<T>(jobId, status.taskId);
    }

    if (status.status === 'failed') {
      throw new Error(status.error);
    }

    return status.result;
  }

  private async requestAsync<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.workerUrl);
    const headers = new Headers(init.headers);
    headers.set('accept', 'application/json');
    if (init.body != null) {
      headers.set('content-type', 'application/json');
    }
    if (this.authToken) {
      headers.set('authorization', `Bearer ${this.authToken}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers,
      });
    } catch (caught) {
      throw new Error(getFetchErrorMessage(url, caught));
    }

    const text = await response.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text.trim().slice(0, 1_000) };
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.error ??
          `Sandbox service request failed: ${response.status} ${response.statusText} at ${url.toString()}`
      );
    }
    return data as T;
  }
}
