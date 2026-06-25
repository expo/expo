import { styleText } from 'node:util';
import terminalLink from 'terminal-link';

/**
 * When linking isn't available, format the learn more link better.
 *
 * @example Learn more: https://expo.io
 * @example [Learn more](https://expo.io)
 * @param url
 */
export function learnMore(url: string): string {
  return terminalLink(styleText('underline', 'Learn more.'), url, {
    fallback: (text, url) => `Learn more: ${styleText('underline', url)}`,
  });
}
