import ExpoAI from './ExpoAI';
import { LanguageModelError } from './LanguageModelError';
import type { Operation } from './Operation';

/** Interrupts JS approval/handler work even between native model calls. */
export function observeBackground(operation: Operation) {
  if (!ExpoAI?.supportsBackgroundEvents) return undefined;
  if (!ExpoAI.addListener) {
    throw new LanguageModelError(
      'ERR_PROVIDER_RESPONSE_INVALID',
      'The native background interruption bridge is incomplete.'
    );
  }
  return ExpoAI.addListener('onBackground', () => {
    operation.abort(
      new LanguageModelError(
        'ERR_APP_BACKGROUND',
        'The language model operation stopped because the app entered the background.'
      )
    );
  });
}
