import chalk from 'chalk';
import terminalLink from 'terminal-link';

/**
 * When linking isn't available, format the learn more link better.
 *
 * @example Learn more: https://expo.io
 * @example [Learn more](https://expo.io)
 * @param url
 */
export function learnMore(url: string): string {
  return terminalLink(chalk.underline('Learn more.'), url, {
    fallback: (text, url) => `Learn more: ${chalk.underline(url)}`,
  });
}
