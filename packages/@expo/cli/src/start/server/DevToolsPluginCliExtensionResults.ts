import z from 'zod';

import { DevToolsPluginOutput, DevToolsPluginOutputSchema } from './DevToolsPlugin.schema';

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

  public append(output: string, level: 'info' | 'warning' | 'error' = 'info') {
    const results = this.parseOutputText(output, level);
    this._output.push(...results);
    this.onOutput?.(results);
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
