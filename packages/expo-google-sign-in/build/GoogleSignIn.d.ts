import { GoogleSignInOptions, GoogleSignInAuthResult } from './GoogleSignIn.types';
import GoogleUser from './GoogleUser';
export declare const 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
ERRORS: any, 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
SCOPES: any, 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
TYPES: any;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function allowInClient(): void;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function getCurrentUser(): GoogleUser | null;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function askForPlayServicesAsync(): Promise<boolean>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function getPlayServiceAvailability(shouldAsk?: boolean): Promise<boolean>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function initAsync(options?: GoogleSignInOptions): Promise<void>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function isSignedInAsync(): Promise<boolean>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function isConnectedAsync(): Promise<boolean>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function signInSilentlyAsync(): Promise<GoogleUser | null>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function signInAsync(): Promise<GoogleSignInAuthResult>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function signOutAsync(): Promise<void>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function disconnectAsync(): Promise<void>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function getCurrentUserAsync(): Promise<GoogleUser | null>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export declare function getPhotoAsync(size?: number): Promise<string | null>;
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleAuthData } from './GoogleAuthData';
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleAuthentication } from './GoogleAuthentication';
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleIdentity } from './GoogleIdentity';
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
export { default as GoogleUser } from './GoogleUser';
export { 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
GoogleSignInType, 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
GoogleSignInOptions, 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
GoogleSignInAuthResultType, 
/** @deprecated `expo-google-sign-in` has been deprecated in favor of `expo-auth-session` and `@react-native-google-signin/google-signin` (development clients). */
GoogleSignInAuthResult, } from './GoogleSignIn.types';
