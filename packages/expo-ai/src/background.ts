import type { EventSubscription } from 'expo';

import ExpoAI from './ExpoAI';
import { LanguageModelError } from './LanguageModelError';
import type { Operation } from './Operation';

/** Interrupts JS approval/handler work even between native model calls. */
export function observeBackground(operation: Operation): EventSubscription | undefined {
  if (!ExpoAI?.supportsBackgroundEvents) return undefined;
  return ExpoAI.addListener('onBackground', () => {
    operation.abort(
      new LanguageModelError(
        'ERR_APP_BACKGROUND',
        'The language model operation stopped because the app entered the background.'
      )
    );
  });
}
