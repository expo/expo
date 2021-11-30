import Constants from 'expo-constants';
import { UnavailabilityError } from 'expo-modules-core';
import invariant from 'invariant';
import ExpoGoogleSignIn from './ExpoGoogleSignIn';
import GoogleUser from './GoogleUser';
export const { 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
ERRORS, 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
SCOPES, 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
TYPES, } = ExpoGoogleSignIn;
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
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export function allowInClient() {
    _isClientUsageEnabled = true;
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export function getCurrentUser() {
    return _currentUser;
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function askForPlayServicesAsync() {
    return await getPlayServiceAvailability(true);
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function getPlayServiceAvailability(shouldAsk = false) {
    validateOwnership();
    if (ExpoGoogleSignIn.arePlayServicesAvailableAsync) {
        return await ExpoGoogleSignIn.arePlayServicesAvailableAsync(shouldAsk);
    }
    else {
        return true;
    }
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
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
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function isSignedInAsync() {
    const user = await getCurrentUserAsync();
    return user != null;
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function isConnectedAsync() {
    return await ExpoGoogleSignIn.isConnectedAsync();
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
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
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
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
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function signOutAsync() {
    await invokeAuthMethod('signOutAsync');
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function disconnectAsync() {
    await invokeAuthMethod('disconnectAsync');
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function getCurrentUserAsync() {
    return await invokeAuthMethod('getCurrentUserAsync');
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export async function getPhotoAsync(size = 128) {
    if (!ExpoGoogleSignIn.getPhotoAsync) {
        throw new UnavailabilityError('GoogleSignIn', 'getPhotoAsync');
    }
    await ensureGoogleIsInitializedAsync();
    return await ExpoGoogleSignIn.getPhotoAsync(size);
}
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleAuthData } from './GoogleAuthData';
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleAuthentication } from './GoogleAuthentication';
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleIdentity } from './GoogleIdentity';
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleUser } from './GoogleUser';
//# sourceMappingURL=GoogleSignIn.js.map