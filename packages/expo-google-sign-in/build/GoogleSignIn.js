import { UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';
import invariant from 'invariant';
import ExpoGoogleSignIn from './ExpoGoogleSignIn';
import GoogleUser from './GoogleUser';
export const { ERRORS, SCOPES, TYPES } = ExpoGoogleSignIn;
const DEFAULT_SCOPES = [SCOPES.PROFILE, SCOPES.EMAIL];
let _initialization;
let _options;
let _currentUser = null;
let _isClientUsageEnabled = false;
function setCurrentUser(currentUser) {
    _currentUser = currentUser;
    return _currentUser;
}
function validateOptions(options) {
    if (!options) {
        return {
            scopes: DEFAULT_SCOPES,
        };
    }
    if (options.isOfflineEnabled) {
        invariant(typeof options.webClientId === 'string' && options.webClientId !== '', 'GoogleSignIn: Offline access (isOfflineEnabled: true) requires a valid google server id `webClientId`');
    }
    return {
        ...options,
        scopes: options.scopes || DEFAULT_SCOPES,
    };
}
function validateOwnership() {
    invariant(_isClientUsageEnabled || Constants.appOwnership !== 'expo', 'expo-google-sign-in is not supported in the Expo Client because a custom URL scheme is required at build time. Please refer to the docs for usage outside of Expo www.npmjs.com/package/expo-google-sign-in');
}
async function ensureGoogleIsInitializedAsync(options) {
    if (_initialization == null) {
        return initAsync(options);
    }
    return _initialization;
}
async function invokeAuthMethod(method) {
    if (!ExpoGoogleSignIn[method]) {
        throw new UnavailabilityError('GoogleSignIn', method);
    }
    await ensureGoogleIsInitializedAsync();
    const payload = await ExpoGoogleSignIn[method]();
    const account = payload != null ? new GoogleUser(payload) : null;
    return setCurrentUser(account);
}
export function allowInClient() {
    _isClientUsageEnabled = true;
}
export function getCurrentUser() {
    return _currentUser;
}
export async function askForPlayServicesAsync() {
    return await getPlayServiceAvailability(true);
}
export async function getPlayServiceAvailability(shouldAsk = false) {
    validateOwnership();
    if (ExpoGoogleSignIn.arePlayServicesAvailableAsync) {
        return await ExpoGoogleSignIn.arePlayServicesAvailableAsync(shouldAsk);
    }
    else {
        return true;
    }
}
export async function initAsync(options) {
    if (!ExpoGoogleSignIn.initAsync) {
        throw new UnavailabilityError('GoogleSignIn', 'initAsync');
    }
    _options = validateOptions(options || _options || {});
    const hasPlayServices = await getPlayServiceAvailability();
    if (!hasPlayServices) {
        return;
    }
    _initialization = ExpoGoogleSignIn.initAsync(_options || {});
    return _initialization;
}
export async function isSignedInAsync() {
    const user = await getCurrentUserAsync();
    return user != null;
}
export async function isConnectedAsync() {
    return await ExpoGoogleSignIn.isConnectedAsync();
}
export async function signInSilentlyAsync() {
    const isConnected = await isConnectedAsync();
    if (isConnected) {
        try {
            const auth = await invokeAuthMethod('signInSilentlyAsync');
            return auth;
        }
        catch (error) {
            /* Return null to create parity with Android */
            if (error.code === ERRORS.SIGN_IN_REQUIRED) {
                return null;
            }
            throw error;
        }
    }
    return null;
}
export async function signInAsync() {
    try {
        const user = await invokeAuthMethod('signInAsync');
        return { type: 'success', user };
    }
    catch (error) {
        if (error.code === ERRORS.SIGN_IN_CANCELLED) {
            return { type: 'cancel', user: null };
        }
        throw error;
    }
}
export async function signOutAsync() {
    await invokeAuthMethod('signOutAsync');
}
export async function disconnectAsync() {
    await invokeAuthMethod('disconnectAsync');
}
export async function getCurrentUserAsync() {
    return await invokeAuthMethod('getCurrentUserAsync');
}
export async function getPhotoAsync(size = 128) {
    if (!ExpoGoogleSignIn.getPhotoAsync) {
        throw new UnavailabilityError('GoogleSignIn', 'getPhotoAsync');
    }
    await ensureGoogleIsInitializedAsync();
    return await ExpoGoogleSignIn.getPhotoAsync(size);
}
export { default as GoogleAuthData } from './GoogleAuthData';
export { default as GoogleAuthentication } from './GoogleAuthentication';
export { default as GoogleIdentity } from './GoogleIdentity';
export { default as GoogleUser } from './GoogleUser';
//# sourceMappingURL=GoogleSignIn.js.map