import { Action } from './Notifications.types';
export declare function createCategoryAsync(name: string, actions: Action[], previewPlaceholder?: string): Promise<void>;
export declare function deleteCategoryAsync(name: string): Promise<void>;
