/**
 * @flow
 */
import type User from './User';

export type ActionCodeInfo = {
  data: {
    email?: string,
    fromEmail?: string,
  },
  operation: 'PASSWORD_RESET' | 'VERIFY_EMAIL' | 'RECOVER_EMAIL',
};

export type ActionCodeSettings = {
  android: {
    installApp?: boolean,
    minimumVersion?: string,
    packageName: string,
  },
  handleCodeInApp?: boolean,
  iOS: {
    bundleId?: string,
  },
  url: string,
};

export type AdditionalUserInfo = {
  isNewUser: boolean,
  profile?: Object,
  providerId: string,
  username?: string,
};

export type AuthCredential = {
  providerId: string,
  token: string,
  secret: string,
};

export type UserCredential = {|
  additionalUserInfo?: AdditionalUserInfo,
  user: User,
|};

export type UserInfo = {
  displayName?: string,
  email?: string,
  phoneNumber?: string,
  photoURL?: string,
  providerId: string,
  uid: string,
};

export type UserMetadata = {
  creationTime?: string,
  lastSignInTime?: string,
};

export type NativeUser = {
  displayName?: string,
  email?: string,
  emailVerified?: boolean,
  isAnonymous?: boolean,
  metadata: UserMetadata,
  phoneNumber?: string,
  photoURL?: string,
  providerData: UserInfo[],
  providerId: string,
  uid: string,
};

export type NativeUserCredential = {|
  additionalUserInfo?: AdditionalUserInfo,
  user: NativeUser,
|};
