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
/**
 * A method that returns a boolean to indicate if the current application is a development build.
 */
export declare function isDevelopmentBuild(): boolean;
export { ExpoDevMenuItem } from './ExpoDevMenu.types';
//# sourceMappingURL=DevMenu.d.ts.map