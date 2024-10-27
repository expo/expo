/**
 * Joins strings with commas and 'and', based on English rules, limiting the number of items enumerated to keep from filling the console.
 * @param items strings to join
 * @param limit max number of strings to enumerate before using 'others'
 * @returns joined string
 */
export function joinWithCommasAnd(items: string[], limit: number | undefined = 10): string {
  if (!items.length) {
    return '';
  }

  const uniqueItems = items.filter((value, index, array) => array.indexOf(value) === index);

  if (uniqueItems.length === 1) {
    return uniqueItems[0];
  }

  if (limit && uniqueItems.length > limit) {
    const first = uniqueItems.slice(0, limit);
    const remaining = uniqueItems.length - limit;
    return `${first.join(', ')}, and ${remaining} ${remaining > 1 ? 'others' : 'other'}`;
  }

  const last = uniqueItems.pop();
  return `${uniqueItems.join(', ')}${uniqueItems.length >= 2 ? ',' : ''} and ${last}`;
}
