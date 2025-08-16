import { SupportedPlatform } from '../types';
interface PlatformImplementations {
    ios: typeof import('../platforms/apple');
    macos: typeof import('../platforms/apple');
    tvos: typeof import('../platforms/apple');
    apple: typeof import('../platforms/apple');
    android: typeof import('../platforms/android');
    devtools: typeof import('../platforms/devtools');
}
declare function getLinkingImplementationForPlatform<Platform extends keyof PlatformImplementations>(platform: Platform): PlatformImplementations[Platform];
declare function getLinkingImplementationForPlatform(platform: 'ios' | 'macos' | 'tvos' | 'apple'): PlatformImplementations['apple'];
declare function getLinkingImplementationForPlatform(platform: 'android'): PlatformImplementations['android'];
declare function getLinkingImplementationForPlatform(platform: 'devtools'): PlatformImplementations['devtools'];
declare function getLinkingImplementationForPlatform(platform: SupportedPlatform): PlatformImplementations[keyof PlatformImplementations];
export { getLinkingImplementationForPlatform };
