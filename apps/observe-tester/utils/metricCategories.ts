// Categories rendered in this order; anything else falls in alphabetically afterward.
export const CATEGORY_ORDER = ['appStartup', 'frameRate', 'memory', 'updates', 'session'];

export function categoryRank(category: string) {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
