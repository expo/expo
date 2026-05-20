import { constants as bufferConstants } from 'node:buffer';

import type { DevToolsPluginOutput } from './DevToolsPlugin.schema';
import { DevToolsPluginOutputSchema } from './DevToolsPlugin.schema';

// Cap accumulated output at V8's max single-string length to bound heap growth.
const MAX_OUTPUT_LENGTH = bufferConstants.MAX_STRING_LENGTH;

/**
 * Class that collects and manages output from executed plugin commands
 *
 * Responsibilities:
 * - Collects output data from executed commands
 * - Parses and validates output data against expected schema
 * - Provides methods to append new output entries
 * - Handles exit codes and appends relevant messages
 * - Handles streaming of output via optional callback
 */
export class DevToolsPluginCliExtensionResults {
  constructor(private onOutput?: (output: DevToolsPluginOutput) => void) {}

  private _output: DevToolsPluginOutput = [];
  private _totalLength = 0;
  private _truncated = false;

  public append(output: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (this._truncated) return;
    if (this._totalLength + output.length > MAX_OUTPUT_LENGTH) {
      this._truncated = true;
      const message = {
        type: 'text' as const,
        text: `Output truncated: plugin exceeded V8's max string length (${MAX_OUTPUT_LENGTH} chars). Reduce output, paginate, or write to a file.`,
        level: 'error' as const,
      };
      this._output.push(message);
      this.onOutput?.([message]);
      return;
    }
    this._totalLength += output.length;
    const results = this.parseOutputText(output, level);
    this._output.push(...results);
    this.onOutput?.(results);
  }

  public isTruncated(): boolean {
    return this._truncated;
  }

  public exit(code: number) {
    if (code === 0) return;
    this.append(`Process exited with code ${code}`, 'error');
  }

  public getOutput(): DevToolsPluginOutput {
    return this._output;
  }

  private parseOutputText(
    txt: string,
    level: 'info' | 'warning' | 'error' = 'info'
  ): DevToolsPluginOutput {
    // Validate against schema
    try {
      const result = DevToolsPluginOutputSchema.safeParse(JSON.parse(txt));
      if (!result.success) {
        return [
          {
            type: 'text',
            text: `Invalid JSON: ${result.error.issues.map((issue) => issue.message).join(', ')}`,
            level: 'error',
          },
        ];
      }
      return result.data;
    } catch {
      // Not JSON, treat as plain text
      const lines = txt.split('\n');
      const results: DevToolsPluginOutput = [];
      for (const line of lines) {
        if (line) {
          results.push({ type: 'text', text: line, level });
        }
      }
      return results;
    }
  }
}
