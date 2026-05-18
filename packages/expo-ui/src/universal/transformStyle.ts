import type { ModifierConfig } from '../types';
import type { UniversalBaseProps, UniversalStyle } from './types';

/**
 * Web fallback — no native modifiers needed.
 */
export function transformToModifiers(
  _style: UniversalStyle | undefined,
  _props: Pick<
    UniversalBaseProps,
    'onPress' | 'onAppear' | 'onDisappear' | 'disabled' | 'hidden' | 'testID'
  >,
  _extraModifiers?: ModifierConfig[],
  _options?: Record<string, unknown>
): ModifierConfig[] {
  return [];
}
