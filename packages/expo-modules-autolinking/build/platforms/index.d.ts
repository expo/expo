import { SupportedPlatform } from '../types';
interface PlatformImplementations {
    ios: typeof import('./apple/apple');
    macos: typeof import('./apple/apple');
    tvos: typeof import('./apple/apple');
    apple: typeof import('./apple/apple');
    android: typeof import('./android/android');
    devtools: typeof import('./devtools');
    web: typeof import('./web');
}
declare function getLinkingImplementationForPlatform<Platform extends keyof PlatformImplementations>(platform: Platform): PlatformImplementations[Platform];
declare function getLinkingImplementationForPlatform(platform: 'ios' | 'macos' | 'tvos' | 'apple'): PlatformImplementations['apple'];
declare function getLinkingImplementationForPlatform(platform: 'android'): PlatformImplementations['android'];
declare function getLinkingImplementationForPlatform(platform: 'devtools'): PlatformImplementations['devtools'];
declare function getLinkingImplementationForPlatform(platform: 'web'): PlatformImplementations['web'];
declare function getLinkingImplementationForPlatform(platform: SupportedPlatform): PlatformImplementations[keyof PlatformImplementations];
export { getLinkingImplementationForPlatform };
