import { Action, Category } from './Notifications.types';
export declare function getCategoriesAsync(): Promise<Category[]>;
export declare function createCategoryAsync(name: string, actions: Action[], previewPlaceholder?: string): Promise<void>;
export declare function deleteCategoryAsync(name: string): Promise<void>;
