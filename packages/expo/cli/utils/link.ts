import chalk from 'chalk';
import terminalLink from 'terminal-link';

/**
 * Prints a link for given URL, using text if provided, otherwise text is just the URL.
 * Format links as dim (unless disabled) and with an underline.
 *
 * @example https://expo.dev
 */
export function link(
  url: string,
  { text = url, dim = true }: { text?: string; dim?: boolean } = {}
): string {
  let output: string;
  // Links can be disabled via env variables https://github.com/jamestalmage/supports-hyperlinks/blob/master/index.js
  if (terminalLink.isSupported) {
    output = terminalLink(text, url);
  } else {
    output = `${text === url ? '' : text + ': '}${chalk.underline(url)}`;
  }
  return dim ? chalk.dim(output) : output;
}

/**
 * Provide a consistent "Learn more" link experience.
 * Format links as dim (unless disabled) with an underline.
 *
 * @example [Learn more](https://expo.dev)
 * @example Learn more: https://expo.dev
 */
export function learnMore(
  url: string,
  {
    learnMoreMessage: maybeLearnMoreMessage,
    dim = true,
  }: { learnMoreMessage?: string; dim?: boolean } = {}
): string {
  return link(url, { text: maybeLearnMoreMessage ?? 'Learn more', dim });
}
