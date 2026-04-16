/**
 * Resolves style objects that may contain non-enumerable properties
 * (e.g. from react-native-unistyles v3) into plain objects with
 * enumerable properties compatible with react-native-web's style pipeline.
 *
 * Some third-party style systems use Object.defineProperties with
 * enumerable: false, which causes Object.assign, spread, and for...in
 * (used internally by react-native-web) to silently drop all properties.
 */
export function resolveStyle(style: any): any {
  if (!style || typeof style !== 'object') {
    return style;
  }
  if (Array.isArray(style)) {
    return style.map(resolveStyle);
  }

  const ownProps = Object.getOwnPropertyNames(style);
  const enumKeys = Object.keys(style);

  // Fast path: all properties already enumerable, nothing to resolve
  if (ownProps.length === enumKeys.length) {
    return style;
  }

  // Re-create object with enumerable properties, filtering out
  // internal marker keys from third-party style systems
  const resolved: Record<string, any> = {};
  for (const key of ownProps) {
    if (!key.startsWith('unistyles_')) {
      resolved[key] = style[key];
    }
  }
  return resolved;
}
