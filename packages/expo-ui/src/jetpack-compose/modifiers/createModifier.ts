/**
 * Base interface for all view modifiers.
 * All modifiers must have a type field and can include arbitrary parameters.
 */
export interface ModifierConfig {
  $type: string;
  [key: string]: any;
  eventListener?: (args: any) => void;
}

/**
 * Factory function to create modifier configuration objects.
 */
export function createModifier(type: string, params: Record<string, any> = {}): ModifierConfig {
  return { $type: type, ...params };
}

/**
 * Creates a modifier with an event listener.
 */
export function createModifierWithEventListener(
  type: string,
  eventListener: (args: any) => void,
  params: Record<string, any> = {}
): ModifierConfig {
  return { $type: type, ...params, eventListener };
}
