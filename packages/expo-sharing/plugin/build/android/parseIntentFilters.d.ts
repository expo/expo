import { SingleIntentFilter, MultiIntentFilter } from '../sharingPlugin.types';
export declare function parseIntentFilters(filters: string[], type: 'single'): SingleIntentFilter;
export declare function parseIntentFilters(filters: string[], type: 'multiple'): MultiIntentFilter;
