import { ExpoDevMenuItem } from './ExpoDevMenu.types';
/**
 * A method that opens development client menu when called.
 */
export declare function openMenu(): void;
/**
 * A method that hides development client menu when called.
 */
export declare function hideMenu(): void;
/**
 * A method that closes development client menu when called.
 */
export declare function closeMenu(): void;
/**
 * A method that allows to specify custom entries in the development client menu.
 * @param items
 */
export declare function registerDevMenuItems(items: ExpoDevMenuItem[]): Promise<void>;
//# sourceMappingURL=DevMenu.d.ts.map