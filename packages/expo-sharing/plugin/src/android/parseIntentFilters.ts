import { SingleIntentFilter, MultiIntentFilter } from '../sharingPlugin.types';

export function parseIntentFilters(filters: string[], type: 'single'): SingleIntentFilter;

export function parseIntentFilters(filters: string[], type: 'multiple'): MultiIntentFilter;

export function parseIntentFilters(
  filters: string[],
  type: 'single' | 'multiple'
): SingleIntentFilter | MultiIntentFilter {
  const mimeTypeRegex = /^([\w.+-]+|\*)\/([\w.+-]+|\*)$/;

  filters.forEach((filter) => {
    if (!filter.match(mimeTypeRegex)) {
      throw new Error(`Invalid intent filter type: ${filter} is not a valid mime type`);
    }
  });

  return {
    action:
      type === 'single' ? 'android.intent.action.SEND' : 'android.intent.action.SEND_MULTIPLE',
    category: 'android.intent.category.DEFAULT',
    filters,
    data: filters.map((filter) => ({
      mimeType: filter,
    })),
  };
}
