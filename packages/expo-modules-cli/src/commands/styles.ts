import { styleText } from 'node:util';

/**
 * The few text styles the CLI uses, so each kind of token looks the same wherever it appears.
 * Every helper takes the stream the text is written to: `styleText` checks whether that stream is
 * a terminal, and stdout and stderr may differ when one of them is redirected.
 */

/** A path, cyan so it reads as a location wherever it appears. */
export function styleFileName(name: string, stream: NodeJS.WriteStream = process.stdout): string {
  return styleText('cyan', name, { stream });
}

/** A type or member name, bold as the subject of its line. */
export function styleTypeName(name: string, stream: NodeJS.WriteStream = process.stdout): string {
  return styleText('bold', name, { stream });
}

/** A declaration kind such as `enum` or `module`: a category label, magenta like a keyword. */
export function styleKind(kind: string, stream: NodeJS.WriteStream = process.stdout): string {
  return styleText('magenta', kind, { stream });
}

/** The heading of the warnings block. */
export function styleWarningHeading(
  text: string,
  stream: NodeJS.WriteStream = process.stdout
): string {
  return styleText('yellow', text, { stream });
}
