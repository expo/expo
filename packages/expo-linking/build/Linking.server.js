import { UnavailabilityError } from 'expo-modules-core';
export function addEventListener(type, handler) {
    return { remove() { } };
}
export async function parseInitialURLAsync() {
    return {
        scheme: null,
        hostname: null,
        path: null,
        queryParams: null,
    };
}
export async function sendIntent(action, extras) {
    throw new UnavailabilityError('Linking', 'sendIntent');
}
export async function openSettings() {
    throw new UnavailabilityError('Linking', 'openSettings');
}
export async function getInitialURL() {
    return '';
}
export function getLinkingURL() {
    return '';
}
export async function openURL(url) {
    return true;
}
export async function canOpenURL() {
    return true;
}
export function useURL() {
    return null;
}
export function useLinkingURL() {
    return null;
}
export * from './Linking.types';
export function collectManifestSchemes() {
    return [];
}
export function hasConstantsManifest() {
    return false;
}
export function hasCustomScheme() {
    return false;
}
export function resolveScheme() {
    return '';
}
export { parse, createURL } from './createURL';
//# sourceMappingURL=Linking.server.js.map