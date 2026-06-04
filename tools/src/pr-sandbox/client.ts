import type {
  PrSandboxJob,
  PrSandboxJobRequest,
  SandboxLogResponse,
  SandboxPresetResult,
  SandboxReadFileResponse,
} from './types';
import { normalizeSandboxPath, validateSandboxPreset } from './validation';

export type PrSandboxClientOptions = {
  workerUrl: string;
  authToken?: string;
};

export class PrSandboxClient {
  private readonly workerUrl: URL;
  private readonly authToken?: string;

  constructor(options: PrSandboxClientOptions) {
    this.workerUrl = new URL(options.workerUrl);
    this.authToken = options.authToken;
  }

  async createPrJobAsync(request: PrSandboxJobRequest): Promise<PrSandboxJob> {
    return await this.requestAsync('/jobs', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runPresetAsync(jobId: string, presetInput: string): Promise<SandboxPresetResult> {
    const preset = validateSandboxPreset(presetInput);
    return await this.requestAsync(`/jobs/${encodeURIComponent(jobId)}/presets/${preset}`, {
      method: 'POST',
    });
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

    const response = await fetch(url, {
      ...init,
      headers,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data?.error ?? `Sandbox service request failed: ${response.status}`);
    }
    return data as T;
  }
}
