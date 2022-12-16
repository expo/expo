/**
 * This file was generated using GraphQL Codegen
 * Command: yarn generate-graphql-code
 * Run this during development for automatic type generation when editing GraphQL documents
 * For more info and docs, visit https://graphql-code-generator.com/
 */

type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Date custom scalar type */
  DateTime: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

type Update = ActivityTimelineProjectActivity & {
  __typename?: 'Update';
  id: Scalars['ID'];
  actor?: Maybe<Actor>;
  activityTimestamp: Scalars['DateTime'];
  branchId: Scalars['ID'];
  platform: Scalars['String'];
  manifestFragment: Scalars['String'];
  runtimeVersion: Scalars['String'];
  group: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  createdAt: Scalars['DateTime'];
  message?: Maybe<Scalars['String']>;
  branch: UpdateBranch;
  manifestPermalink: Scalars['String'];
};

type ActivityTimelineProjectActivity = {
  id: Scalars['ID'];
  actor?: Maybe<Actor>;
  activityTimestamp: Scalars['DateTime'];
};

/** A user or robot that can authenticate with Expo services and be a member of accounts. */
type Actor = {
  id: Scalars['ID'];
  firstName?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  isExpoAdmin: Scalars['Boolean'];
  /**
   * Best-effort human readable name for this actor for use in user interfaces during action attribution.
   * For example, when displaying a sentence indicating that actor X created a build or published an update.
   */
  displayName: Scalars['String'];
  /** Associated accounts */
  accounts: Array<Account>;
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
};

/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
type Account = {
  __typename?: 'Account';
  id: Scalars['ID'];
  name: Scalars['String'];
  isCurrent: Scalars['Boolean'];
  pushSecurityEnabled: Scalars['Boolean'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  /** Offers set on this account */
  offers?: Maybe<Array<Offer>>;
  /** Apps associated with this account */
  apps: Array<App>;
  appCount: Scalars['Int'];
  /** Build Jobs associated with this account */
  buildJobs: Array<BuildJob>;
  /**
   * Coalesced Build (EAS) or BuildJob (Classic) for all apps belonging to this account.
   * @deprecated Use activityTimelineProjectActivities with filterTypes instead
   */
  buildOrBuildJobs: Array<BuildOrBuildJob>;
  /** Coalesced project activity for all apps belonging to this account. */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  /** Owning User of this account if personal account */
  owner?: Maybe<User>;
  /** Actors associated with this account and permissions they hold */
  users: Array<UserPermission>;
  /** Pending user invitations for this account */
  userInvitations: Array<UserInvitation>;
  /** iOS credentials for account */
  appleTeams: Array<AppleTeam>;
  appleAppIdentifiers: Array<AppleAppIdentifier>;
  appleDistributionCertificates: Array<AppleDistributionCertificate>;
  applePushKeys: Array<ApplePushKey>;
  appleProvisioningProfiles: Array<AppleProvisioningProfile>;
  appleDevices: Array<AppleDevice>;
  appStoreConnectApiKeys: Array<AppStoreConnectApiKey>;
  /** Android credentials for account */
  googleServiceAccountKeys: Array<GoogleServiceAccountKey>;
  /** Environment secrets for an account */
  environmentSecrets: Array<EnvironmentSecret>;
  /** @deprecated Legacy access tokens are deprecated */
  accessTokens: Array<Maybe<AccessToken>>;
  /** @deprecated Legacy access tokens are deprecated */
  requiresAccessTokenForPushSecurity: Scalars['Boolean'];
  /** @deprecated See isCurrent */
  unlimitedBuilds: Scalars['Boolean'];
  /** @deprecated Build packs are no longer supported */
  availableBuilds?: Maybe<Scalars['Int']>;
  /** @deprecated No longer needed */
  subscriptionChangesPending?: Maybe<Scalars['Boolean']>;
  /** @deprecated Build packs are no longer supported */
  willAutoRenewBuilds?: Maybe<Scalars['Boolean']>;
};

type Offer = {
  __typename?: 'Offer';
  id: Scalars['ID'];
  stripeId: Scalars['ID'];
  price: Scalars['Int'];
  quantity?: Maybe<Scalars['Int']>;
  trialLength?: Maybe<Scalars['Int']>;
  type: OfferType;
  features?: Maybe<Array<Maybe<Feature>>>;
  prerequisite?: Maybe<OfferPrerequisite>;
};

enum OfferType {
  /** Term subscription */
  Subscription = 'SUBSCRIPTION',
  /** Advanced Purchase of Paid Resource */
  Prepaid = 'PREPAID',
  /** Addon, or supplementary subscription */
  Addon = 'ADDON',
}

enum Feature {
  /** Top Tier Support */
  Support = 'SUPPORT',
  /** Share access to projects */
  Teams = 'TEAMS',
  /** Priority Builds */
  Builds = 'BUILDS',
  /** Funds support for open source development */
  OpenSource = 'OPEN_SOURCE',
}

type OfferPrerequisite = {
  __typename?: 'OfferPrerequisite';
  type: Scalars['String'];
  stripeIds: Array<Scalars['String']>;
};

type Project = {
  id: Scalars['ID'];
  name: Scalars['String'];
  fullName: Scalars['String'];
  description: Scalars['String'];
  slug: Scalars['String'];
  updated: Scalars['DateTime'];
  published: Scalars['Boolean'];
  username: Scalars['String'];
  /** @deprecated Field no longer supported */
  iconUrl?: Maybe<Scalars['String']>;
};

/** Represents an Exponent App (or Experience in legacy terms) */
type App = Project & {
  __typename?: 'App';
  id: Scalars['ID'];
  name: Scalars['String'];
  fullName: Scalars['String'];
  description: Scalars['String'];
  slug: Scalars['String'];
  ownerAccount: Account;
  privacySetting: AppPrivacy;
  pushSecurityEnabled: Scalars['Boolean'];
  /** Whether there have been any classic update publishes */
  published: Scalars['Boolean'];
  /** Time of last classic update publish */
  updated: Scalars['DateTime'];
  /** ID of latest classic update release */
  latestReleaseId: Scalars['ID'];
  /** Whether the latest classic update publish is using a deprecated SDK version */
  isDeprecated: Scalars['Boolean'];
  /** SDK version of the latest classic update publish, 0.0.0 otherwise */
  sdkVersion: Scalars['String'];
  /** Classic update release channel names (to be removed) */
  releaseChannels: Array<Scalars['String']>;
  /** Classic update release channel names that have at least one build */
  buildsReleaseChannels: Array<Scalars['String']>;
  /** githubUrl field from most recent classic update manifest */
  githubUrl?: Maybe<Scalars['String']>;
  /** android.playStoreUrl field from most recent classic update manifest */
  playStoreUrl?: Maybe<Scalars['String']>;
  /** ios.appStoreUrl field from most recent classic update manifest */
  appStoreUrl?: Maybe<Scalars['String']>;
  /** Info about the icon specified in the most recent classic update manifest */
  icon?: Maybe<AppIcon>;
  /** iOS app credentials for the project */
  iosAppCredentials: Array<IosAppCredentials>;
  /** Android app credentials for the project */
  androidAppCredentials: Array<AndroidAppCredentials>;
  /** Coalesced project activity for an app */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  /** Environment secrets for an app */
  environmentSecrets: Array<EnvironmentSecret>;
  /** Webhooks for an app */
  webhooks: Array<Webhook>;
  /** @deprecated Use ownerAccount.name instead */
  username: Scalars['String'];
  /** @deprecated Field no longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  /** @deprecated Use 'privacySetting' instead. */
  privacy: Scalars['String'];
  /** @deprecated Field no longer supported */
  lastPublishedTime: Scalars['DateTime'];
  /** @deprecated Field no longer supported */
  packageUsername: Scalars['String'];
  /** @deprecated Field no longer supported */
  packageName: Scalars['String'];
  /** @deprecated Legacy access tokens are deprecated */
  accessTokens: Array<Maybe<AccessToken>>;
  /** @deprecated Legacy access tokens are deprecated */
  requiresAccessTokenForPushSecurity: Scalars['Boolean'];
  /** @deprecated 'likes' have been deprecated. */
  isLikedByMe: Scalars['Boolean'];
  /** @deprecated 'likes' have been deprecated. */
  likeCount: Scalars['Int'];
  /** @deprecated 'likes' have been deprecated. */
  trendScore: Scalars['Float'];
  /** @deprecated 'likes' have been deprecated. */
  likedBy: Array<Maybe<User>>;
  /** @deprecated Field no longer supported */
  users?: Maybe<Array<Maybe<User>>>;
  /** @deprecated Field no longer supported */
  releases: Array<Maybe<AppRelease>>;
  latestReleaseForReleaseChannel?: Maybe<AppRelease>;
};

enum AppPrivacy {
  Public = 'PUBLIC',
  Unlisted = 'UNLISTED',
  Hidden = 'HIDDEN',
}

type AppIcon = {
  __typename?: 'AppIcon';
  url: Scalars['String'];
  primaryColor?: Maybe<Scalars['String']>;
  originalUrl: Scalars['String'];
  /** Nullable color palette of the app icon. If null, color palette couldn't be retrieved from external service (imgix) */
  colorPalette?: Maybe<Scalars['JSON']>;
};

enum AppPlatform {
  Ios = 'IOS',
  Android = 'ANDROID',
}

type BuildOrBuildJob = {
  id: Scalars['ID'];
};

/** Represents a human (not robot) actor. */
type User = Actor & {
  __typename?: 'User';
  id: Scalars['ID'];
  username: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  profilePhoto: Scalars['String'];
  created: Scalars['DateTime'];
  industry?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  appCount: Scalars['Int'];
  githubUsername?: Maybe<Scalars['String']>;
  twitterUsername?: Maybe<Scalars['String']>;
  appetizeCode?: Maybe<Scalars['String']>;
  emailVerified: Scalars['Boolean'];
  isExpoAdmin: Scalars['Boolean'];
  displayName: Scalars['String'];
  isSecondFactorAuthenticationEnabled: Scalars['Boolean'];
  /** Get all certified second factor authentication methods */
  secondFactorDevices: Array<UserSecondFactorDevice>;
  /** Associated accounts */
  primaryAccount: Account;
  accounts: Array<Account>;
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  /** Apps this user has published */
  apps: Array<App>;
  /** Whether this user has any pending user invitations. Only resolves for the viewer. */
  hasPendingUserInvitations: Scalars['Boolean'];
  /** Pending UserInvitations for this user. Only resolves for the viewer. */
  pendingUserInvitations: Array<UserInvitation>;
  /** Coalesced project activity for all apps belonging to all accounts this user belongs to. Only resolves for the viewer. */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  /** @deprecated Field no longer supported */
  isEmailUnsubscribed: Scalars['Boolean'];
  /** @deprecated Field no longer supported */
  lastPasswordReset?: Maybe<Scalars['DateTime']>;
  /** @deprecated Field no longer supported */
  lastLogin?: Maybe<Scalars['DateTime']>;
  /** @deprecated Field no longer supported */
  isOnboarded?: Maybe<Scalars['Boolean']>;
  /** @deprecated Field no longer supported */
  isLegacy?: Maybe<Scalars['Boolean']>;
  /** @deprecated Field no longer supported */
  wasLegacy?: Maybe<Scalars['Boolean']>;
  /** @deprecated 'likes' have been deprecated. */
  likes?: Maybe<Array<Maybe<App>>>;
};

/** A second factor device belonging to a User */
type UserSecondFactorDevice = {
  __typename?: 'UserSecondFactorDevice';
  id: Scalars['ID'];
  user: User;
  name: Scalars['String'];
  isCertified: Scalars['Boolean'];
  isPrimary: Scalars['Boolean'];
  smsPhoneNumber?: Maybe<Scalars['String']>;
  method: SecondFactorMethod;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

enum SecondFactorMethod {
  /** Google Authenticator (TOTP) */
  Authenticator = 'AUTHENTICATOR',
  /** SMS */
  Sms = 'SMS',
}

/** A method of authentication for an Actor */
type AccessToken = {
  __typename?: 'AccessToken';
  id: Scalars['ID'];
  visibleTokenPrefix: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  revokedAt?: Maybe<Scalars['DateTime']>;
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  owner: Actor;
  note?: Maybe<Scalars['String']>;
};

/** An pending invitation sent to an email granting membership on an Account. */
type UserInvitation = {
  __typename?: 'UserInvitation';
  id: Scalars['ID'];
  /** Email to which this invitation was sent */
  email: Scalars['String'];
  created: Scalars['DateTime'];
  accountName: Scalars['String'];
  /** Account permissions to be granted upon acceptance of this invitation */
  permissions: Array<Permission>;
  /** Role to be granted upon acceptance of this invitation */
  role: Role;
};

enum Permission {
  Own = 'OWN',
  Admin = 'ADMIN',
  Publish = 'PUBLISH',
  View = 'VIEW',
}

enum Role {
  Owner = 'OWNER',
  Admin = 'ADMIN',
  Developer = 'DEVELOPER',
  ViewOnly = 'VIEW_ONLY',
  Custom = 'CUSTOM',
  HasAdmin = 'HAS_ADMIN',
  NotAdmin = 'NOT_ADMIN',
}

/** Represents an Standalone App build job */
type BuildJob = ActivityTimelineProjectActivity &
  BuildOrBuildJob & {
    __typename?: 'BuildJob';
    id: Scalars['ID'];
    actor?: Maybe<Actor>;
    activityTimestamp: Scalars['DateTime'];
    app?: Maybe<App>;
    user?: Maybe<User>;
    release?: Maybe<AppRelease>;
    config?: Maybe<Scalars['JSON']>;
    artifacts?: Maybe<BuildArtifact>;
    logs?: Maybe<BuildLogs>;
    created?: Maybe<Scalars['DateTime']>;
    updated?: Maybe<Scalars['DateTime']>;
    fullExperienceName?: Maybe<Scalars['String']>;
    status?: Maybe<BuildJobStatus>;
    expirationDate?: Maybe<Scalars['DateTime']>;
    platform: AppPlatform;
    sdkVersion?: Maybe<Scalars['String']>;
    releaseChannel?: Maybe<Scalars['String']>;
  };

type AppRelease = {
  __typename?: 'AppRelease';
  id: Scalars['ID'];
  hash: Scalars['String'];
  publishedTime: Scalars['DateTime'];
  publishingUsername: Scalars['String'];
  sdkVersion: Scalars['String'];
  runtimeVersion?: Maybe<Scalars['String']>;
  version: Scalars['String'];
  s3Key: Scalars['String'];
  s3Url: Scalars['String'];
  manifest: Scalars['JSON'];
};

type BuildArtifact = {
  __typename?: 'BuildArtifact';
  url: Scalars['String'];
  manifestPlistUrl?: Maybe<Scalars['String']>;
};

type BuildLogs = {
  __typename?: 'BuildLogs';
  url?: Maybe<Scalars['String']>;
  format?: Maybe<BuildJobLogsFormat>;
};

enum BuildJobLogsFormat {
  Raw = 'RAW',
  Json = 'JSON',
}

enum BuildJobStatus {
  Pending = 'PENDING',
  Started = 'STARTED',
  InProgress = 'IN_PROGRESS',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  SentToQueue = 'SENT_TO_QUEUE',
}

type UpdateBranch = {
  __typename?: 'UpdateBranch';
  id: Scalars['ID'];
  appId: Scalars['ID'];
  name: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  updates: Array<Update>;
};

type IosAppCredentials = {
  __typename?: 'IosAppCredentials';
  id: Scalars['ID'];
  app: App;
  appleTeam?: Maybe<AppleTeam>;
  appleAppIdentifier: AppleAppIdentifier;
  iosAppBuildCredentialsList: Array<IosAppBuildCredentials>;
  pushKey?: Maybe<ApplePushKey>;
  appStoreConnectApiKeyForSubmissions?: Maybe<AppStoreConnectApiKey>;
  /** @deprecated use iosAppBuildCredentialsList instead */
  iosAppBuildCredentialsArray: Array<IosAppBuildCredentials>;
};

type AppleTeam = {
  __typename?: 'AppleTeam';
  id: Scalars['ID'];
  account: Account;
  appleTeamIdentifier: Scalars['String'];
  appleTeamName?: Maybe<Scalars['String']>;
  appleAppIdentifiers: Array<AppleAppIdentifier>;
  appleDistributionCertificates: Array<AppleDistributionCertificate>;
  applePushKeys: Array<ApplePushKey>;
  appleProvisioningProfiles: Array<AppleProvisioningProfile>;
  appleDevices: Array<AppleDevice>;
};

type AppleAppIdentifier = {
  __typename?: 'AppleAppIdentifier';
  id: Scalars['ID'];
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  bundleIdentifier: Scalars['String'];
  parentAppleAppIdentifier?: Maybe<AppleAppIdentifier>;
};

type AppleDistributionCertificate = {
  __typename?: 'AppleDistributionCertificate';
  id: Scalars['ID'];
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  serialNumber: Scalars['String'];
  validityNotBefore: Scalars['DateTime'];
  validityNotAfter: Scalars['DateTime'];
  developerPortalIdentifier?: Maybe<Scalars['String']>;
  certificateP12?: Maybe<Scalars['String']>;
  certificatePassword?: Maybe<Scalars['String']>;
  certificatePrivateSigningKey?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  iosAppBuildCredentialsList: Array<IosAppBuildCredentials>;
};

type IosAppBuildCredentials = {
  __typename?: 'IosAppBuildCredentials';
  id: Scalars['ID'];
  distributionCertificate?: Maybe<AppleDistributionCertificate>;
  provisioningProfile?: Maybe<AppleProvisioningProfile>;
  iosDistributionType: IosDistributionType;
  iosAppCredentials: IosAppCredentials;
  /** @deprecated Get Apple Devices from AppleProvisioningProfile instead */
  appleDevices?: Maybe<Array<Maybe<AppleDevice>>>;
};

type AppleProvisioningProfile = {
  __typename?: 'AppleProvisioningProfile';
  id: Scalars['ID'];
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  expiration: Scalars['DateTime'];
  appleAppIdentifier: AppleAppIdentifier;
  developerPortalIdentifier?: Maybe<Scalars['String']>;
  provisioningProfile?: Maybe<Scalars['String']>;
  appleUUID: Scalars['String'];
  status: Scalars['String'];
  appleDevices: Array<AppleDevice>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

type AppleDevice = {
  __typename?: 'AppleDevice';
  id: Scalars['ID'];
  account: Account;
  appleTeam: AppleTeam;
  identifier: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  model?: Maybe<Scalars['String']>;
  deviceClass?: Maybe<AppleDeviceClass>;
  softwareVersion?: Maybe<Scalars['String']>;
  enabled?: Maybe<Scalars['Boolean']>;
};

enum AppleDeviceClass {
  Ipad = 'IPAD',
  Iphone = 'IPHONE',
}

enum IosDistributionType {
  AppStore = 'APP_STORE',
  Enterprise = 'ENTERPRISE',
  AdHoc = 'AD_HOC',
  Development = 'DEVELOPMENT',
}

type ApplePushKey = {
  __typename?: 'ApplePushKey';
  id: Scalars['ID'];
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  keyIdentifier: Scalars['String'];
  keyP8: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  iosAppCredentialsList: Array<IosAppCredentials>;
};

type AppStoreConnectApiKey = {
  __typename?: 'AppStoreConnectApiKey';
  id: Scalars['ID'];
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  issuerIdentifier: Scalars['String'];
  keyIdentifier: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  roles?: Maybe<Array<AppStoreConnectUserRole>>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

enum AppStoreConnectUserRole {
  Admin = 'ADMIN',
  Finance = 'FINANCE',
  Technical = 'TECHNICAL',
  AccountHolder = 'ACCOUNT_HOLDER',
  ReadOnly = 'READ_ONLY',
  Sales = 'SALES',
  Marketing = 'MARKETING',
  AppManager = 'APP_MANAGER',
  Developer = 'DEVELOPER',
  AccessToReports = 'ACCESS_TO_REPORTS',
  CustomerSupport = 'CUSTOMER_SUPPORT',
  CreateApps = 'CREATE_APPS',
  CloudManagedDeveloperId = 'CLOUD_MANAGED_DEVELOPER_ID',
  CloudManagedAppDistribution = 'CLOUD_MANAGED_APP_DISTRIBUTION',
  ImageManager = 'IMAGE_MANAGER',
  Unknown = 'UNKNOWN',
}

type AndroidAppCredentials = {
  __typename?: 'AndroidAppCredentials';
  id: Scalars['ID'];
  app: App;
  applicationIdentifier?: Maybe<Scalars['String']>;
  androidFcm?: Maybe<AndroidFcm>;
  googleServiceAccountKeyForSubmissions?: Maybe<GoogleServiceAccountKey>;
  androidAppBuildCredentialsList: Array<AndroidAppBuildCredentials>;
  isLegacy: Scalars['Boolean'];
  /** @deprecated use androidAppBuildCredentialsList instead */
  androidAppBuildCredentialsArray: Array<AndroidAppBuildCredentials>;
};

type AndroidFcm = {
  __typename?: 'AndroidFcm';
  id: Scalars['ID'];
  account: Account;
  snippet: FcmSnippet;
  /**
   * Legacy FCM: returns the Cloud Messaging token, parses to a String
   * FCM v1: returns the Service Account Key file, parses to an Object
   */
  credential: Scalars['JSON'];
  version: AndroidFcmVersion;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

type FcmSnippet = FcmSnippetLegacy | FcmSnippetV1;

type FcmSnippetLegacy = {
  __typename?: 'FcmSnippetLegacy';
  firstFourCharacters: Scalars['String'];
  lastFourCharacters: Scalars['String'];
};

type FcmSnippetV1 = {
  __typename?: 'FcmSnippetV1';
  projectId: Scalars['String'];
  keyId: Scalars['String'];
  serviceAccountEmail: Scalars['String'];
  clientId?: Maybe<Scalars['String']>;
};

enum AndroidFcmVersion {
  Legacy = 'LEGACY',
  V1 = 'V1',
}

type GoogleServiceAccountKey = {
  __typename?: 'GoogleServiceAccountKey';
  id: Scalars['ID'];
  account: Account;
  projectIdentifier: Scalars['String'];
  privateKeyIdentifier: Scalars['String'];
  clientEmail: Scalars['String'];
  clientIdentifier: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

type AndroidAppBuildCredentials = {
  __typename?: 'AndroidAppBuildCredentials';
  id: Scalars['ID'];
  name: Scalars['String'];
  androidKeystore?: Maybe<AndroidKeystore>;
  isDefault: Scalars['Boolean'];
  isLegacy: Scalars['Boolean'];
};

type AndroidKeystore = {
  __typename?: 'AndroidKeystore';
  id: Scalars['ID'];
  account: Account;
  type: AndroidKeystoreType;
  keystore: Scalars['String'];
  keystorePassword: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: Maybe<Scalars['String']>;
  md5CertificateFingerprint?: Maybe<Scalars['String']>;
  sha1CertificateFingerprint?: Maybe<Scalars['String']>;
  sha256CertificateFingerprint?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

enum AndroidKeystoreType {
  Jks = 'JKS',
  Pkcs12 = 'PKCS12',
  Unknown = 'UNKNOWN',
}

type EnvironmentSecret = {
  __typename?: 'EnvironmentSecret';
  id: Scalars['ID'];
  name: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

enum WebhookType {
  Build = 'BUILD',
  Submit = 'SUBMIT',
}

type Webhook = {
  __typename?: 'Webhook';
  id: Scalars['ID'];
  appId: Scalars['ID'];
  event: WebhookType;
  url: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

type UserPermission = {
  __typename?: 'UserPermission';
  permissions: Array<Permission>;
  role?: Maybe<Role>;
  /** @deprecated User type is deprecated */
  user?: Maybe<User>;
  actor: Actor;
};

/** Represents a robot (not human) actor. */
type Robot = Actor & {
  __typename?: 'Robot';
  id: Scalars['ID'];
  firstName?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  isExpoAdmin: Scalars['Boolean'];
  displayName: Scalars['String'];
  /** Associated accounts */
  accounts: Array<Account>;
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
};

export type CurrentUserQuery = { __typename?: 'RootQuery' } & {
  meActor?: Maybe<
    | ({ __typename: 'User' } & Pick<User, 'username' | 'id' | 'isExpoAdmin'> & {
          accounts: Array<{ __typename?: 'Account' } & Pick<Account, 'id' | 'name'>>;
        })
    | ({ __typename: 'Robot' } & Pick<Robot, 'firstName' | 'id' | 'isExpoAdmin'> & {
          accounts: Array<{ __typename?: 'Account' } & Pick<Account, 'id' | 'name'>>;
        })
  >;
};
