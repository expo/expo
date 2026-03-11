import { ZodError, ZodIssue } from 'zod';

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
            text: `Invalid JSON: ${DevToolsPluginCliExtensionResults.formatZodError(result.error)}`,
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

  /**
   * Formats a Zod path array into a human-readable string.
   * Example: [0, "level"] → "[0].level"
   */
  private static formatPath(path: (string | number)[]): string {
    if (path.length === 0) return 'value';
    return path
      .map((segment, i) =>
        typeof segment === 'number' ? `[${segment}]` : i === 0 ? segment : `.${segment}`
      )
      .join('');
  }

  /**
   * Formats a single Zod issue into a human-readable message.
   */
  private static formatIssue(issue: ZodIssue): string {
    const path = this.formatPath(issue.path);

    switch (issue.code) {
      case 'invalid_type':
        if (issue.received === 'undefined') {
          return `"${path}" is required`;
        }
        return `"${path}" expected ${issue.expected}, got ${issue.received}`;

      case 'invalid_enum_value':
        return `"${path}" must be one of: ${(issue as any).options.join(', ')} (got "${(issue as any).received}")`;

      case 'invalid_literal':
        return `"${path}" must be "${(issue as any).expected}" (got "${(issue as any).received}")`;

      case 'invalid_union': {
        // Pick the branch with fewest errors
        const unionErrors = (issue as any).unionErrors as ZodError[];
        const bestBranch = unionErrors.reduce((best, current) =>
          current.issues.length < best.issues.length ? current : best
        );
        return bestBranch.issues.map(this.formatIssue.bind(this)).join('; ');
      }

      case 'too_small':
        if ((issue as any).type === 'string' && (issue as any).minimum === 1) {
          return `"${path}" must not be empty`;
        }
        return `"${path}" is too small`;

      case 'unrecognized_keys':
        return `Unknown field(s): ${(issue as any).keys.join(', ')}`;

      default:
        return issue.message;
    }
  }

  /**
   * Formats a ZodError into a human-readable error message.
   * Shows at most 3 errors with a count of remaining errors.
   */
  public static formatZodError(error: ZodError): string {
    const MAX_ERRORS = 3;
    const messages = error.issues.map(this.formatIssue.bind(this));
    const shown = messages.slice(0, MAX_ERRORS);
    const remaining = messages.length - MAX_ERRORS;

    if (remaining > 0) {
      return `${shown.join('; ')} ...and ${remaining} more error${remaining > 1 ? 's' : ''}`;
    }
    return shown.join('; ');
  }
}
