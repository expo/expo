import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
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

export type AcceptUserInvitationResult = {
  __typename?: 'AcceptUserInvitationResult';
  success?: Maybe<Scalars['Boolean']>;
};

/** A method of authentication for an Actor */
export type AccessToken = {
  __typename?: 'AccessToken';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  note?: Maybe<Scalars['String']>;
  owner: Actor;
  revokedAt?: Maybe<Scalars['DateTime']>;
  updatedAt: Scalars['DateTime'];
  visibleTokenPrefix: Scalars['String'];
};

export type AccessTokenMutation = {
  __typename?: 'AccessTokenMutation';
  /** Create an AccessToken for an Actor */
  createAccessToken: CreateAccessTokenResponse;
  /** Delete an AccessToken */
  deleteAccessToken: DeleteAccessTokenResult;
  /** Revoke an AccessToken */
  setAccessTokenRevoked: AccessToken;
};


export type AccessTokenMutationCreateAccessTokenArgs = {
  createAccessTokenData: CreateAccessTokenInput;
};


export type AccessTokenMutationDeleteAccessTokenArgs = {
  id: Scalars['ID'];
};


export type AccessTokenMutationSetAccessTokenRevokedArgs = {
  id: Scalars['ID'];
  revoked?: Maybe<Scalars['Boolean']>;
};

/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type Account = {
  __typename?: 'Account';
  /** @deprecated Legacy access tokens are deprecated */
  accessTokens: Array<Maybe<AccessToken>>;
  /** Coalesced project activity for all apps belonging to this account. */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  appCount: Scalars['Int'];
  appleAppIdentifiers: Array<AppleAppIdentifier>;
  appleAppSpecificPasswords: Array<AppleAppSpecificPassword>;
  appleDevices: Array<AppleDevice>;
  appleDistributionCertificates: Array<AppleDistributionCertificate>;
  appleProvisioningProfiles: Array<AppleProvisioningProfile>;
  applePushKeys: Array<ApplePushKey>;
  /** iOS credentials for account */
  appleTeams: Array<AppleTeam>;
  /** Apps associated with this account */
  apps: Array<App>;
  /** @deprecated Build packs are no longer supported */
  availableBuilds?: Maybe<Scalars['Int']>;
  /** Billing information */
  billing?: Maybe<Billing>;
  /** Build Jobs associated with this account */
  buildJobs: Array<BuildJob>;
  /**
   * Coalesced Build (EAS) or BuildJob (Classic) for all apps belonging to this account.
   * @deprecated Use activityTimelineProjectActivities with filterTypes instead
   */
  buildOrBuildJobs: Array<BuildOrBuildJob>;
  /** (EAS Build) Builds associated with this account */
  builds: Array<Build>;
  createdAt: Scalars['DateTime'];
  /** Environment secrets for an account */
  environmentSecrets: Array<EnvironmentSecret>;
  id: Scalars['ID'];
  isCurrent: Scalars['Boolean'];
  name: Scalars['String'];
  /** Offers set on this account */
  offers?: Maybe<Array<Offer>>;
  /** Owning User of this account if personal account */
  owner?: Maybe<User>;
  pushSecurityEnabled: Scalars['Boolean'];
  /** @deprecated Legacy access tokens are deprecated */
  requiresAccessTokenForPushSecurity: Scalars['Boolean'];
  /** Snacks associated with this account */
  snacks: Array<Snack>;
  /** Subscription info visible to members that have VIEWER role */
  subscription?: Maybe<SubscriptionDetails>;
  /** @deprecated No longer needed */
  subscriptionChangesPending?: Maybe<Scalars['Boolean']>;
  /** @deprecated See isCurrent */
  unlimitedBuilds: Scalars['Boolean'];
  updatedAt: Scalars['DateTime'];
  /** Pending user invitations for this account */
  userInvitations: Array<UserInvitation>;
  /** Actors associated with this account and permissions they hold */
  users: Array<UserPermission>;
  /** @deprecated Build packs are no longer supported */
  willAutoRenewBuilds?: Maybe<Scalars['Boolean']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountActivityTimelineProjectActivitiesArgs = {
  createdBefore?: Maybe<Scalars['DateTime']>;
  filterTypes?: Maybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleAppIdentifiersArgs = {
  bundleIdentifier?: Maybe<Scalars['String']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleDevicesArgs = {
  identifier?: Maybe<Scalars['String']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleProvisioningProfilesArgs = {
  appleAppIdentifierId?: Maybe<Scalars['ID']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleTeamsArgs = {
  appleTeamIdentifier?: Maybe<Scalars['String']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppsArgs = {
  includeUnpublished?: Maybe<Scalars['Boolean']>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildJobsArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  status?: Maybe<BuildJobStatus>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildOrBuildJobsArgs = {
  createdBefore?: Maybe<Scalars['DateTime']>;
  limit: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildsArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  platform?: Maybe<AppPlatform>;
  status?: Maybe<BuildStatus>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountEnvironmentSecretsArgs = {
  filterNames?: Maybe<Array<Scalars['String']>>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountSnacksArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type AccountDataInput = {
  name: Scalars['String'];
};

export type AccountMutation = {
  __typename?: 'AccountMutation';
  /**
   * Makes a one time purchase
   * @deprecated Build packs are no longer supported
   */
  buyProduct?: Maybe<Account>;
  /** Cancels the active subscription */
  cancelSubscription?: Maybe<Account>;
  /** Extend offer to account */
  extendOffer?: Maybe<Account>;
  /** Add specified account Permissions for Actor. Actor must already have at least one permission on the account. */
  grantActorPermissions?: Maybe<Account>;
  /** Rename this account and the primary user's username if this account is a personal account */
  rename: Account;
  /** Revoke specified Permissions for Actor. Actor must already have at least one permission on the account. */
  revokeActorPermissions?: Maybe<Account>;
  /** Send an email to primary account email */
  sendEmail?: Maybe<Account>;
  /**
   * Update setting to purchase new build packs when the current one is consumed
   * @deprecated Build packs are no longer supported
   */
  setBuildAutoRenew?: Maybe<Account>;
  /** Set payment details */
  setPaymentSource?: Maybe<Account>;
  /** Require authorization to send push notifications for experiences owned by this account */
  setPushSecurityEnabled?: Maybe<Account>;
  /** Add a subscription */
  subscribeToProduct?: Maybe<Account>;
};


export type AccountMutationBuyProductArgs = {
  accountName: Scalars['ID'];
  autoRenew?: Maybe<Scalars['Boolean']>;
  paymentSource?: Maybe<Scalars['ID']>;
  productId: Scalars['ID'];
};


export type AccountMutationCancelSubscriptionArgs = {
  accountName: Scalars['ID'];
};


export type AccountMutationExtendOfferArgs = {
  accountName: Scalars['ID'];
  offer: StandardOffer;
  suppressMessage?: Maybe<Scalars['Boolean']>;
};


export type AccountMutationGrantActorPermissionsArgs = {
  accountID: Scalars['ID'];
  actorID: Scalars['ID'];
  permissions?: Maybe<Array<Maybe<Permission>>>;
};


export type AccountMutationRenameArgs = {
  accountID: Scalars['ID'];
  newName: Scalars['String'];
};


export type AccountMutationRevokeActorPermissionsArgs = {
  accountID: Scalars['ID'];
  actorID: Scalars['ID'];
  permissions?: Maybe<Array<Maybe<Permission>>>;
};


export type AccountMutationSendEmailArgs = {
  accountName: Scalars['ID'];
  emailTemplate: EmailTemplate;
};


export type AccountMutationSetBuildAutoRenewArgs = {
  accountName: Scalars['ID'];
  autoRenew?: Maybe<Scalars['Boolean']>;
};


export type AccountMutationSetPaymentSourceArgs = {
  accountName: Scalars['ID'];
  paymentSource: Scalars['ID'];
};


export type AccountMutationSetPushSecurityEnabledArgs = {
  accountID: Scalars['ID'];
  pushSecurityEnabled: Scalars['Boolean'];
};


export type AccountMutationSubscribeToProductArgs = {
  accountName: Scalars['ID'];
  paymentSource: Scalars['ID'];
  productId: Scalars['ID'];
};

export type AccountQuery = {
  __typename?: 'AccountQuery';
  /** Query an Account by ID */
  byId: Account;
  /** Query an Account by name */
  byName: Account;
};


export type AccountQueryByIdArgs = {
  accountId: Scalars['String'];
};


export type AccountQueryByNameArgs = {
  accountName: Scalars['String'];
};

export type ActivityTimelineProjectActivity = {
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  id: Scalars['ID'];
};

export enum ActivityTimelineProjectActivityType {
  Build = 'BUILD',
  BuildJob = 'BUILD_JOB',
  Submission = 'SUBMISSION',
  Update = 'UPDATE'
}

/** A user or robot that can authenticate with Expo services and be a member of accounts. */
export type Actor = {
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  /** Associated accounts */
  accounts: Array<Account>;
  created: Scalars['DateTime'];
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isExpoAdmin: Scalars['Boolean'];
};


/** A user or robot that can authenticate with Expo services and be a member of accounts. */
export type ActorFeatureGatesArgs = {
  filter?: Maybe<Array<Scalars['String']>>;
};

export type ActorQuery = {
  __typename?: 'ActorQuery';
  /** Query an Actor by ID */
  byId: Actor;
};


export type ActorQueryByIdArgs = {
  id: Scalars['ID'];
};

export type AddUserInput = {
  audience?: Maybe<MailchimpAudience>;
  email: Scalars['String'];
  tags?: Maybe<Array<MailchimpTag>>;
};

export type AddUserPayload = {
  __typename?: 'AddUserPayload';
  email_address?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  list_id?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<MailchimpTagPayload>>;
  timestamp_signup?: Maybe<Scalars['String']>;
};

export type Address = {
  __typename?: 'Address';
  city?: Maybe<Scalars['String']>;
  country?: Maybe<Scalars['String']>;
  line1?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
  zip?: Maybe<Scalars['String']>;
};

export type AndroidAppBuildCredentials = {
  __typename?: 'AndroidAppBuildCredentials';
  androidKeystore?: Maybe<AndroidKeystore>;
  id: Scalars['ID'];
  isDefault: Scalars['Boolean'];
  isLegacy: Scalars['Boolean'];
  name: Scalars['String'];
};

/** @isDefault: if set, these build credentials will become the default for the Android app. All other build credentials will have their default status set to false. */
export type AndroidAppBuildCredentialsInput = {
  isDefault: Scalars['Boolean'];
  keystoreId: Scalars['ID'];
  name: Scalars['String'];
};

export type AndroidAppBuildCredentialsMutation = {
  __typename?: 'AndroidAppBuildCredentialsMutation';
  /** Create a set of build credentials for an Android app */
  createAndroidAppBuildCredentials?: Maybe<AndroidAppBuildCredentials>;
  /** delete a set of build credentials for an Android app */
  deleteAndroidAppBuildCredentials?: Maybe<DeleteAndroidAppBuildCredentialsResult>;
  /** Set the build credentials to be the default for the Android app */
  setDefault?: Maybe<AndroidAppBuildCredentials>;
  /** Set the keystore to be used for an Android app */
  setKeystore?: Maybe<AndroidAppBuildCredentials>;
  /** Set the name of a set of build credentials to be used for an Android app */
  setName?: Maybe<AndroidAppBuildCredentials>;
};


export type AndroidAppBuildCredentialsMutationCreateAndroidAppBuildCredentialsArgs = {
  androidAppBuildCredentialsInput: AndroidAppBuildCredentialsInput;
  androidAppCredentialsId: Scalars['ID'];
};


export type AndroidAppBuildCredentialsMutationDeleteAndroidAppBuildCredentialsArgs = {
  id: Scalars['ID'];
};


export type AndroidAppBuildCredentialsMutationSetDefaultArgs = {
  id: Scalars['ID'];
  isDefault: Scalars['Boolean'];
};


export type AndroidAppBuildCredentialsMutationSetKeystoreArgs = {
  id: Scalars['ID'];
  keystoreId: Scalars['ID'];
};


export type AndroidAppBuildCredentialsMutationSetNameArgs = {
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type AndroidAppCredentials = {
  __typename?: 'AndroidAppCredentials';
  /** @deprecated use androidAppBuildCredentialsList instead */
  androidAppBuildCredentialsArray: Array<AndroidAppBuildCredentials>;
  androidAppBuildCredentialsList: Array<AndroidAppBuildCredentials>;
  androidFcm?: Maybe<AndroidFcm>;
  app: App;
  applicationIdentifier?: Maybe<Scalars['String']>;
  googleServiceAccountKeyForSubmissions?: Maybe<GoogleServiceAccountKey>;
  id: Scalars['ID'];
  isLegacy: Scalars['Boolean'];
};

export type AndroidAppCredentialsFilter = {
  applicationIdentifier?: Maybe<Scalars['String']>;
  legacyOnly?: Maybe<Scalars['Boolean']>;
};

export type AndroidAppCredentialsInput = {
  fcmId?: Maybe<Scalars['ID']>;
};

export type AndroidAppCredentialsMutation = {
  __typename?: 'AndroidAppCredentialsMutation';
  /** Create a set of credentials for an Android app */
  createAndroidAppCredentials?: Maybe<AndroidAppCredentials>;
  /** Set the FCM push key to be used in an Android app */
  setFcm?: Maybe<AndroidAppCredentials>;
};


export type AndroidAppCredentialsMutationCreateAndroidAppCredentialsArgs = {
  androidAppCredentialsInput: AndroidAppCredentialsInput;
  appId: Scalars['ID'];
  applicationIdentifier: Scalars['String'];
};


export type AndroidAppCredentialsMutationSetFcmArgs = {
  fcmId: Scalars['ID'];
  id: Scalars['ID'];
};

export enum AndroidBuildType {
  Apk = 'APK',
  AppBundle = 'APP_BUNDLE',
  DevelopmentClient = 'DEVELOPMENT_CLIENT'
}

export type AndroidBuilderEnvironmentInput = {
  env?: Maybe<Scalars['JSONObject']>;
  expoCli?: Maybe<Scalars['String']>;
  image?: Maybe<Scalars['String']>;
  ndk?: Maybe<Scalars['String']>;
  node?: Maybe<Scalars['String']>;
  yarn?: Maybe<Scalars['String']>;
};

export type AndroidFcm = {
  __typename?: 'AndroidFcm';
  account: Account;
  createdAt: Scalars['DateTime'];
  /**
   * Legacy FCM: returns the Cloud Messaging token, parses to a String
   * FCM v1: returns the Service Account Key file, parses to an Object
   */
  credential: Scalars['JSON'];
  id: Scalars['ID'];
  snippet: FcmSnippet;
  updatedAt: Scalars['DateTime'];
  version: AndroidFcmVersion;
};

export type AndroidFcmInput = {
  credential: Scalars['String'];
  version: AndroidFcmVersion;
};

export type AndroidFcmMutation = {
  __typename?: 'AndroidFcmMutation';
  /** Create an FCM credential */
  createAndroidFcm: AndroidFcm;
  /** Delete an FCM credential */
  deleteAndroidFcm: DeleteAndroidFcmResult;
};


export type AndroidFcmMutationCreateAndroidFcmArgs = {
  accountId: Scalars['ID'];
  androidFcmInput: AndroidFcmInput;
};


export type AndroidFcmMutationDeleteAndroidFcmArgs = {
  id: Scalars['ID'];
};

export enum AndroidFcmVersion {
  Legacy = 'LEGACY',
  V1 = 'V1'
}

export type AndroidGenericJobInput = {
  artifactPath?: Maybe<Scalars['String']>;
  builderEnvironment?: Maybe<AndroidBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  gradleCommand?: Maybe<Scalars['String']>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  secrets?: Maybe<AndroidJobSecretsInput>;
  updates?: Maybe<BuildUpdatesInput>;
};

export type AndroidJobBuildCredentialsInput = {
  keystore: AndroidJobKeystoreInput;
};

export type AndroidJobInput = {
  artifactPath?: Maybe<Scalars['String']>;
  buildType?: Maybe<AndroidBuildType>;
  builderEnvironment?: Maybe<AndroidBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  gradleCommand?: Maybe<Scalars['String']>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  secrets?: Maybe<AndroidJobSecretsInput>;
  type: BuildWorkflow;
  updates?: Maybe<BuildUpdatesInput>;
  username?: Maybe<Scalars['String']>;
};

export type AndroidJobKeystoreInput = {
  dataBase64: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: Maybe<Scalars['String']>;
  keystorePassword: Scalars['String'];
};

export type AndroidJobSecretsInput = {
  buildCredentials?: Maybe<AndroidJobBuildCredentialsInput>;
  environmentSecrets?: Maybe<Scalars['JSONObject']>;
};

export type AndroidKeystore = {
  __typename?: 'AndroidKeystore';
  account: Account;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  keyAlias: Scalars['String'];
  keyPassword?: Maybe<Scalars['String']>;
  keystore: Scalars['String'];
  keystorePassword: Scalars['String'];
  md5CertificateFingerprint?: Maybe<Scalars['String']>;
  sha1CertificateFingerprint?: Maybe<Scalars['String']>;
  sha256CertificateFingerprint?: Maybe<Scalars['String']>;
  type: AndroidKeystoreType;
  updatedAt: Scalars['DateTime'];
};

export type AndroidKeystoreInput = {
  base64EncodedKeystore: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: Maybe<Scalars['String']>;
  keystorePassword: Scalars['String'];
  type: AndroidKeystoreType;
};

export type AndroidKeystoreMutation = {
  __typename?: 'AndroidKeystoreMutation';
  /** Create a Keystore */
  createAndroidKeystore?: Maybe<AndroidKeystore>;
  /** Delete a Keystore */
  deleteAndroidKeystore: DeleteAndroidKeystoreResult;
};


export type AndroidKeystoreMutationCreateAndroidKeystoreArgs = {
  accountId: Scalars['ID'];
  androidKeystoreInput: AndroidKeystoreInput;
};


export type AndroidKeystoreMutationDeleteAndroidKeystoreArgs = {
  id: Scalars['ID'];
};

export enum AndroidKeystoreType {
  Jks = 'JKS',
  Pkcs12 = 'PKCS12',
  Unknown = 'UNKNOWN'
}

export enum AndroidManagedBuildType {
  Apk = 'APK',
  AppBundle = 'APP_BUNDLE',
  DevelopmentClient = 'DEVELOPMENT_CLIENT'
}

export type AndroidManagedJobInput = {
  buildType?: Maybe<AndroidManagedBuildType>;
  builderEnvironment?: Maybe<AndroidBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  secrets?: Maybe<AndroidJobSecretsInput>;
  updates?: Maybe<BuildUpdatesInput>;
  username?: Maybe<Scalars['String']>;
};

export type AndroidSubmissionConfig = {
  __typename?: 'AndroidSubmissionConfig';
  applicationIdentifier: Scalars['String'];
  /** @deprecated archiveType is deprecated and will be null */
  archiveType?: Maybe<SubmissionAndroidArchiveType>;
  releaseStatus?: Maybe<SubmissionAndroidReleaseStatus>;
  track: SubmissionAndroidTrack;
};

export type AndroidSubmissionConfigInput = {
  applicationIdentifier: Scalars['String'];
  archiveUrl?: Maybe<Scalars['String']>;
  changesNotSentForReview?: Maybe<Scalars['Boolean']>;
  googleServiceAccountKeyId?: Maybe<Scalars['String']>;
  googleServiceAccountKeyJson?: Maybe<Scalars['String']>;
  releaseStatus?: Maybe<SubmissionAndroidReleaseStatus>;
  track: SubmissionAndroidTrack;
};

/** Represents an Exponent App (or Experience in legacy terms) */
export type App = Project & {
  __typename?: 'App';
  /** @deprecated Legacy access tokens are deprecated */
  accessTokens: Array<Maybe<AccessToken>>;
  /** Coalesced project activity for an app */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  /** Android app credentials for the project */
  androidAppCredentials: Array<AndroidAppCredentials>;
  appStoreUrl?: Maybe<Scalars['String']>;
  buildJobs: Array<BuildJob>;
  /**
   * Coalesced Build (EAS) or BuildJob (Classic) items for this app.
   * @deprecated Use activityTimelineProjectActivities with filterTypes instead
   */
  buildOrBuildJobs: Array<BuildOrBuildJob>;
  /** (EAS Build) Builds associated with this app */
  builds: Array<Build>;
  deployment?: Maybe<Deployment>;
  /** Deployments associated with this app */
  deployments: Array<Deployment>;
  description: Scalars['String'];
  /** Environment secrets for an app */
  environmentSecrets: Array<EnvironmentSecret>;
  fullName: Scalars['String'];
  githubUrl?: Maybe<Scalars['String']>;
  icon?: Maybe<AppIcon>;
  /** @deprecated No longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** iOS app credentials for the project */
  iosAppCredentials: Array<IosAppCredentials>;
  isDeprecated: Scalars['Boolean'];
  /** @deprecated 'likes' have been deprecated. */
  isLikedByMe: Scalars['Boolean'];
  /** @deprecated No longer supported */
  lastPublishedTime: Scalars['DateTime'];
  latestReleaseForReleaseChannel?: Maybe<AppRelease>;
  latestReleaseId: Scalars['ID'];
  /** @deprecated 'likes' have been deprecated. */
  likeCount: Scalars['Int'];
  /** @deprecated 'likes' have been deprecated. */
  likedBy: Array<Maybe<User>>;
  name: Scalars['String'];
  ownerAccount: Account;
  /** @deprecated No longer supported */
  packageName: Scalars['String'];
  /** @deprecated No longer supported */
  packageUsername: Scalars['String'];
  playStoreUrl?: Maybe<Scalars['String']>;
  /** @deprecated Use 'privacySetting' instead. */
  privacy: Scalars['String'];
  privacySetting: AppPrivacy;
  published: Scalars['Boolean'];
  pushSecurityEnabled: Scalars['Boolean'];
  /** @deprecated No longer supported */
  releases: Array<Maybe<AppRelease>>;
  /** @deprecated Legacy access tokens are deprecated */
  requiresAccessTokenForPushSecurity: Scalars['Boolean'];
  sdkVersion: Scalars['String'];
  slug: Scalars['String'];
  /** EAS Submissions associated with this app */
  submissions: Array<Submission>;
  /** @deprecated 'likes' have been deprecated. */
  trendScore: Scalars['Float'];
  /** get an EAS branch owned by the app by name */
  updateBranchByName?: Maybe<UpdateBranch>;
  /** EAS branches owned by an app */
  updateBranches: Array<UpdateBranch>;
  /** get an EAS channel owned by the app by name */
  updateChannelByName?: Maybe<UpdateChannel>;
  /** EAS channels owned by an app */
  updateChannels: Array<UpdateChannel>;
  updated: Scalars['DateTime'];
  /** @deprecated Use ownerAccount.name instead */
  username: Scalars['String'];
  /** @deprecated No longer supported */
  users?: Maybe<Array<Maybe<User>>>;
  /** Webhooks for an app */
  webhooks: Array<Webhook>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppActivityTimelineProjectActivitiesArgs = {
  createdBefore?: Maybe<Scalars['DateTime']>;
  filterTypes?: Maybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppAndroidAppCredentialsArgs = {
  filter?: Maybe<AndroidAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildJobsArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  status?: Maybe<BuildStatus>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildOrBuildJobsArgs = {
  createdBefore?: Maybe<Scalars['DateTime']>;
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildsArgs = {
  filter?: Maybe<BuildFilter>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  platform?: Maybe<AppPlatform>;
  status?: Maybe<BuildStatus>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentArgs = {
  channel: Scalars['String'];
  options?: Maybe<DeploymentOptions>;
  runtimeVersion: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentsArgs = {
  limit: Scalars['Int'];
  mostRecentlyUpdatedAt?: Maybe<Scalars['DateTime']>;
  options?: Maybe<DeploymentOptions>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppEnvironmentSecretsArgs = {
  filterNames?: Maybe<Array<Scalars['String']>>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppIosAppCredentialsArgs = {
  filter?: Maybe<IosAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppLatestReleaseForReleaseChannelArgs = {
  platform: AppPlatform;
  releaseChannel: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppLikedByArgs = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppReleasesArgs = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  platform: AppPlatform;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppSubmissionsArgs = {
  filter: SubmissionFilter;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateBranchByNameArgs = {
  name: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateBranchesArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateChannelByNameArgs = {
  name: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateChannelsArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWebhooksArgs = {
  filter?: Maybe<WebhookFilter>;
};

export type AppDataInput = {
  id: Scalars['ID'];
  privacy?: Maybe<Scalars['String']>;
};

export type AppIcon = {
  __typename?: 'AppIcon';
  /** Nullable color palette of the app icon. If null, color palette couldn't be retrieved from external service (imgix) */
  colorPalette?: Maybe<Scalars['JSON']>;
  originalUrl: Scalars['String'];
  primaryColor?: Maybe<Scalars['String']>;
  url: Scalars['String'];
};

export type AppInput = {
  accountId: Scalars['ID'];
  privacy: AppPrivacy;
  projectName: Scalars['String'];
};

export type AppMutation = {
  __typename?: 'AppMutation';
  /** Create an unpublished app */
  createApp: App;
  /** @deprecated No longer supported */
  grantAccess?: Maybe<App>;
  /** Require api token to send push notifs for experience */
  setPushSecurityEnabled?: Maybe<App>;
};


export type AppMutationCreateAppArgs = {
  appInput: AppInput;
};


export type AppMutationGrantAccessArgs = {
  accessLevel?: Maybe<Scalars['String']>;
  toUser: Scalars['ID'];
};


export type AppMutationSetPushSecurityEnabledArgs = {
  appId: Scalars['ID'];
  pushSecurityEnabled: Scalars['Boolean'];
};

export enum AppPlatform {
  Android = 'ANDROID',
  Ios = 'IOS'
}

export enum AppPrivacy {
  Hidden = 'HIDDEN',
  Public = 'PUBLIC',
  Unlisted = 'UNLISTED'
}

export type AppQuery = {
  __typename?: 'AppQuery';
  /** Public apps in the app directory */
  all: Array<App>;
  byFullName: App;
  /** Look up app by app id */
  byId: App;
};


export type AppQueryAllArgs = {
  filter: AppsFilter;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  sort: AppSort;
};


export type AppQueryByFullNameArgs = {
  fullName: Scalars['String'];
};


export type AppQueryByIdArgs = {
  appId: Scalars['String'];
};

export type AppRelease = {
  __typename?: 'AppRelease';
  hash: Scalars['String'];
  id: Scalars['ID'];
  manifest: Scalars['JSON'];
  publishedTime: Scalars['DateTime'];
  publishingUsername: Scalars['String'];
  runtimeVersion?: Maybe<Scalars['String']>;
  s3Key: Scalars['String'];
  s3Url: Scalars['String'];
  sdkVersion: Scalars['String'];
  version: Scalars['String'];
};

export enum AppSort {
  /** Sort by recently published */
  RecentlyPublished = 'RECENTLY_PUBLISHED',
  /** Sort by highest trendScore */
  Viewed = 'VIEWED'
}

export type AppleAppIdentifier = {
  __typename?: 'AppleAppIdentifier';
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  bundleIdentifier: Scalars['String'];
  id: Scalars['ID'];
  parentAppleAppIdentifier?: Maybe<AppleAppIdentifier>;
};

export type AppleAppIdentifierInput = {
  appleTeamId?: Maybe<Scalars['ID']>;
  bundleIdentifier: Scalars['String'];
  parentAppleAppId?: Maybe<Scalars['ID']>;
};

export type AppleAppIdentifierMutation = {
  __typename?: 'AppleAppIdentifierMutation';
  /** Create an Identifier for an iOS App */
  createAppleAppIdentifier?: Maybe<AppleAppIdentifier>;
};


export type AppleAppIdentifierMutationCreateAppleAppIdentifierArgs = {
  accountId: Scalars['ID'];
  appleAppIdentifierInput: AppleAppIdentifierInput;
};

export type AppleAppSpecificPassword = {
  __typename?: 'AppleAppSpecificPassword';
  account: Account;
  appleIdUsername: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  passwordLabel?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
};

export type AppleAppSpecificPasswordInput = {
  appSpecificPassword: Scalars['String'];
  appleIdUsername: Scalars['String'];
  passwordLabel?: Maybe<Scalars['String']>;
};

export type AppleAppSpecificPasswordMutation = {
  __typename?: 'AppleAppSpecificPasswordMutation';
  /** Create an App Specific Password for an Apple User Account */
  createAppleAppSpecificPassword: AppleAppSpecificPassword;
};


export type AppleAppSpecificPasswordMutationCreateAppleAppSpecificPasswordArgs = {
  accountId: Scalars['ID'];
  appleAppSpecificPasswordInput: AppleAppSpecificPasswordInput;
};

export type AppleDevice = {
  __typename?: 'AppleDevice';
  account: Account;
  appleTeam: AppleTeam;
  deviceClass?: Maybe<AppleDeviceClass>;
  enabled?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  identifier: Scalars['String'];
  model?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  softwareVersion?: Maybe<Scalars['String']>;
};

export enum AppleDeviceClass {
  Ipad = 'IPAD',
  Iphone = 'IPHONE'
}

export type AppleDeviceInput = {
  appleTeamId: Scalars['ID'];
  deviceClass?: Maybe<AppleDeviceClass>;
  enabled?: Maybe<Scalars['Boolean']>;
  identifier: Scalars['String'];
  model?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  softwareVersion?: Maybe<Scalars['String']>;
};

export type AppleDeviceMutation = {
  __typename?: 'AppleDeviceMutation';
  /** Create an Apple Device */
  createAppleDevice: AppleDevice;
  /** Delete an Apple Device */
  deleteAppleDevice: DeleteAppleDeviceResult;
};


export type AppleDeviceMutationCreateAppleDeviceArgs = {
  accountId: Scalars['ID'];
  appleDeviceInput: AppleDeviceInput;
};


export type AppleDeviceMutationDeleteAppleDeviceArgs = {
  id: Scalars['ID'];
};

export type AppleDeviceRegistrationRequest = {
  __typename?: 'AppleDeviceRegistrationRequest';
  account: Account;
  appleTeam: AppleTeam;
  id: Scalars['ID'];
};

export type AppleDeviceRegistrationRequestMutation = {
  __typename?: 'AppleDeviceRegistrationRequestMutation';
  /** Create an Apple Device registration request */
  createAppleDeviceRegistrationRequest: AppleDeviceRegistrationRequest;
};


export type AppleDeviceRegistrationRequestMutationCreateAppleDeviceRegistrationRequestArgs = {
  accountId: Scalars['ID'];
  appleTeamId: Scalars['ID'];
};

export type AppleDeviceRegistrationRequestQuery = {
  __typename?: 'AppleDeviceRegistrationRequestQuery';
  byId: AppleDeviceRegistrationRequest;
};


export type AppleDeviceRegistrationRequestQueryByIdArgs = {
  id: Scalars['ID'];
};

export type AppleDistributionCertificate = {
  __typename?: 'AppleDistributionCertificate';
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  certificateP12?: Maybe<Scalars['String']>;
  certificatePassword?: Maybe<Scalars['String']>;
  certificatePrivateSigningKey?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  developerPortalIdentifier?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  iosAppBuildCredentialsList: Array<IosAppBuildCredentials>;
  serialNumber: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  validityNotAfter: Scalars['DateTime'];
  validityNotBefore: Scalars['DateTime'];
};

export type AppleDistributionCertificateInput = {
  appleTeamId?: Maybe<Scalars['ID']>;
  certP12: Scalars['String'];
  certPassword: Scalars['String'];
  certPrivateSigningKey?: Maybe<Scalars['String']>;
  developerPortalIdentifier?: Maybe<Scalars['String']>;
};

export type AppleDistributionCertificateMutation = {
  __typename?: 'AppleDistributionCertificateMutation';
  /** Create a Distribution Certificate */
  createAppleDistributionCertificate?: Maybe<AppleDistributionCertificate>;
  /** Delete a Distribution Certificate */
  deleteAppleDistributionCertificate: DeleteAppleDistributionCertificateResult;
};


export type AppleDistributionCertificateMutationCreateAppleDistributionCertificateArgs = {
  accountId: Scalars['ID'];
  appleDistributionCertificateInput: AppleDistributionCertificateInput;
};


export type AppleDistributionCertificateMutationDeleteAppleDistributionCertificateArgs = {
  id: Scalars['ID'];
};

export type AppleProvisioningProfile = {
  __typename?: 'AppleProvisioningProfile';
  account: Account;
  appleAppIdentifier: AppleAppIdentifier;
  appleDevices: Array<AppleDevice>;
  appleTeam?: Maybe<AppleTeam>;
  appleUUID: Scalars['String'];
  createdAt: Scalars['DateTime'];
  developerPortalIdentifier?: Maybe<Scalars['String']>;
  expiration: Scalars['DateTime'];
  id: Scalars['ID'];
  provisioningProfile?: Maybe<Scalars['String']>;
  status: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type AppleProvisioningProfileInput = {
  appleProvisioningProfile: Scalars['String'];
  developerPortalIdentifier?: Maybe<Scalars['String']>;
};

export type AppleProvisioningProfileMutation = {
  __typename?: 'AppleProvisioningProfileMutation';
  /** Create a Provisioning Profile */
  createAppleProvisioningProfile: AppleProvisioningProfile;
  /** Delete a Provisioning Profile */
  deleteAppleProvisioningProfile: DeleteAppleProvisioningProfileResult;
  /** Delete Provisioning Profiles */
  deleteAppleProvisioningProfiles: Array<DeleteAppleProvisioningProfileResult>;
  /** Update a Provisioning Profile */
  updateAppleProvisioningProfile: AppleProvisioningProfile;
};


export type AppleProvisioningProfileMutationCreateAppleProvisioningProfileArgs = {
  accountId: Scalars['ID'];
  appleAppIdentifierId: Scalars['ID'];
  appleProvisioningProfileInput: AppleProvisioningProfileInput;
};


export type AppleProvisioningProfileMutationDeleteAppleProvisioningProfileArgs = {
  id: Scalars['ID'];
};


export type AppleProvisioningProfileMutationDeleteAppleProvisioningProfilesArgs = {
  ids: Array<Scalars['ID']>;
};


export type AppleProvisioningProfileMutationUpdateAppleProvisioningProfileArgs = {
  appleProvisioningProfileInput: AppleProvisioningProfileInput;
  id: Scalars['ID'];
};

export type ApplePushKey = {
  __typename?: 'ApplePushKey';
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  iosAppCredentialsList: Array<IosAppCredentials>;
  keyIdentifier: Scalars['String'];
  keyP8: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type ApplePushKeyInput = {
  appleTeamId?: Maybe<Scalars['ID']>;
  keyIdentifier: Scalars['String'];
  keyP8: Scalars['String'];
};

export type ApplePushKeyMutation = {
  __typename?: 'ApplePushKeyMutation';
  /** Create an Apple Push Notification key */
  createApplePushKey: ApplePushKey;
  /** Delete an Apple Push Notification key */
  deleteApplePushKey: DeleteApplePushKeyResult;
};


export type ApplePushKeyMutationCreateApplePushKeyArgs = {
  accountId: Scalars['ID'];
  applePushKeyInput: ApplePushKeyInput;
};


export type ApplePushKeyMutationDeleteApplePushKeyArgs = {
  id: Scalars['ID'];
};

export type AppleTeam = {
  __typename?: 'AppleTeam';
  account: Account;
  appleAppIdentifiers: Array<AppleAppIdentifier>;
  appleDevices: Array<AppleDevice>;
  appleDistributionCertificates: Array<AppleDistributionCertificate>;
  appleProvisioningProfiles: Array<AppleProvisioningProfile>;
  applePushKeys: Array<ApplePushKey>;
  appleTeamIdentifier: Scalars['String'];
  appleTeamName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
};


export type AppleTeamAppleAppIdentifiersArgs = {
  bundleIdentifier?: Maybe<Scalars['String']>;
};


export type AppleTeamAppleProvisioningProfilesArgs = {
  appleAppIdentifierId?: Maybe<Scalars['ID']>;
};

export type AppleTeamInput = {
  appleTeamIdentifier: Scalars['String'];
  appleTeamName?: Maybe<Scalars['String']>;
};

export type AppleTeamMutation = {
  __typename?: 'AppleTeamMutation';
  /** Create an Apple Team */
  createAppleTeam: AppleTeam;
};


export type AppleTeamMutationCreateAppleTeamArgs = {
  accountId: Scalars['ID'];
  appleTeamInput: AppleTeamInput;
};

export type AppleTeamQuery = {
  __typename?: 'AppleTeamQuery';
  byAppleTeamIdentifier?: Maybe<AppleTeam>;
};


export type AppleTeamQueryByAppleTeamIdentifierArgs = {
  accountId: Scalars['ID'];
  identifier: Scalars['String'];
};

export enum AppsFilter {
  /** Featured Projects */
  Featured = 'FEATURED',
  /** New Projects */
  New = 'NEW'
}

export type AssetMetadataResult = {
  __typename?: 'AssetMetadataResult';
  status: AssetMetadataStatus;
  storageKey: Scalars['String'];
};

export enum AssetMetadataStatus {
  DoesNotExist = 'DOES_NOT_EXIST',
  Exists = 'EXISTS'
}

export type AssetMutation = {
  __typename?: 'AssetMutation';
  /**
   * Returns an array of specifications for upload. Each URL is valid for an hour.
   * The content type of the asset you wish to upload must be specified.
   */
  getSignedAssetUploadSpecifications?: Maybe<GetSignedAssetUploadSpecificationsResult>;
};


export type AssetMutationGetSignedAssetUploadSpecificationsArgs = {
  assetContentTypes: Array<Maybe<Scalars['String']>>;
};

/** Check to see if assets with given storageKeys exist */
export type AssetQuery = {
  __typename?: 'AssetQuery';
  metadata: Array<AssetMetadataResult>;
};


/** Check to see if assets with given storageKeys exist */
export type AssetQueryMetadataArgs = {
  storageKeys: Array<Scalars['String']>;
};

export type Billing = {
  __typename?: 'Billing';
  /** History of invoices */
  charges?: Maybe<Array<Maybe<Charge>>>;
  payment?: Maybe<PaymentDetails>;
  subscription?: Maybe<SubscriptionDetails>;
};

/** Represents an EAS Build */
export type Build = ActivityTimelineProjectActivity & BuildOrBuildJob & {
  __typename?: 'Build';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  appBuildVersion?: Maybe<Scalars['String']>;
  appVersion?: Maybe<Scalars['String']>;
  artifacts?: Maybe<BuildArtifacts>;
  buildProfile?: Maybe<Scalars['String']>;
  cancelingActor?: Maybe<Actor>;
  channel?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  distribution?: Maybe<DistributionType>;
  error?: Maybe<BuildError>;
  expirationDate?: Maybe<Scalars['DateTime']>;
  gitCommitHash?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  initiatingActor?: Maybe<Actor>;
  /** @deprecated User type is deprecated */
  initiatingUser?: Maybe<User>;
  iosEnterpriseProvisioning?: Maybe<BuildIosEnterpriseProvisioning>;
  logFiles: Array<Scalars['String']>;
  metrics?: Maybe<BuildMetrics>;
  platform: AppPlatform;
  project: Project;
  releaseChannel?: Maybe<Scalars['String']>;
  runtimeVersion?: Maybe<Scalars['String']>;
  sdkVersion?: Maybe<Scalars['String']>;
  status: BuildStatus;
  submissions: Array<Submission>;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

export type BuildArtifact = {
  __typename?: 'BuildArtifact';
  manifestPlistUrl?: Maybe<Scalars['String']>;
  url: Scalars['String'];
};

export type BuildArtifacts = {
  __typename?: 'BuildArtifacts';
  buildUrl?: Maybe<Scalars['String']>;
  xcodeBuildLogsUrl?: Maybe<Scalars['String']>;
};

export type BuildCacheInput = {
  cacheDefaultPaths?: Maybe<Scalars['Boolean']>;
  clear?: Maybe<Scalars['Boolean']>;
  customPaths?: Maybe<Array<Maybe<Scalars['String']>>>;
  disabled?: Maybe<Scalars['Boolean']>;
  key?: Maybe<Scalars['String']>;
};

export enum BuildCredentialsSource {
  Local = 'LOCAL',
  Remote = 'REMOTE'
}

export type BuildError = {
  __typename?: 'BuildError';
  docsUrl?: Maybe<Scalars['String']>;
  errorCode: Scalars['String'];
  message: Scalars['String'];
};

export type BuildFilter = {
  appBuildVersion?: Maybe<Scalars['String']>;
  appIdentifier?: Maybe<Scalars['String']>;
  appVersion?: Maybe<Scalars['String']>;
  buildProfile?: Maybe<Scalars['String']>;
  channel?: Maybe<Scalars['String']>;
  distribution?: Maybe<DistributionType>;
  gitCommitHash?: Maybe<Scalars['String']>;
  platform?: Maybe<AppPlatform>;
  runtimeVersion?: Maybe<Scalars['String']>;
  sdkVersion?: Maybe<Scalars['String']>;
  status?: Maybe<BuildStatus>;
};

export enum BuildIosEnterpriseProvisioning {
  Adhoc = 'ADHOC',
  Universal = 'UNIVERSAL'
}

/** Represents an Standalone App build job */
export type BuildJob = ActivityTimelineProjectActivity & BuildOrBuildJob & {
  __typename?: 'BuildJob';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  app?: Maybe<App>;
  artifacts?: Maybe<BuildArtifact>;
  config?: Maybe<Scalars['JSON']>;
  created?: Maybe<Scalars['DateTime']>;
  expirationDate?: Maybe<Scalars['DateTime']>;
  fullExperienceName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  logs?: Maybe<BuildLogs>;
  platform: AppPlatform;
  release?: Maybe<AppRelease>;
  releaseChannel?: Maybe<Scalars['String']>;
  sdkVersion?: Maybe<Scalars['String']>;
  status?: Maybe<BuildJobStatus>;
  updated?: Maybe<Scalars['DateTime']>;
  user?: Maybe<User>;
};

export enum BuildJobLogsFormat {
  Json = 'JSON',
  Raw = 'RAW'
}

export type BuildJobMutation = {
  __typename?: 'BuildJobMutation';
  cancel?: Maybe<BuildJob>;
  del?: Maybe<BuildJob>;
  restart?: Maybe<BuildJob>;
};

export type BuildJobQuery = {
  __typename?: 'BuildJobQuery';
  /**
   * get all build jobs by an optional filter
   * @deprecated Prefer Account.buildJobs or App.buildJobs
   */
  all: Array<Maybe<BuildJob>>;
  byId: BuildJob;
};


export type BuildJobQueryAllArgs = {
  experienceSlug?: Maybe<Scalars['String']>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  showAdminView?: Maybe<Scalars['Boolean']>;
  status?: Maybe<BuildJobStatus>;
  username?: Maybe<Scalars['String']>;
};


export type BuildJobQueryByIdArgs = {
  buildId: Scalars['ID'];
};

export enum BuildJobStatus {
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  Pending = 'PENDING',
  SentToQueue = 'SENT_TO_QUEUE',
  Started = 'STARTED'
}

export type BuildLogs = {
  __typename?: 'BuildLogs';
  format?: Maybe<BuildJobLogsFormat>;
  url?: Maybe<Scalars['String']>;
};

export type BuildMetadataInput = {
  appBuildVersion?: Maybe<Scalars['String']>;
  appIdentifier?: Maybe<Scalars['String']>;
  appName?: Maybe<Scalars['String']>;
  appVersion?: Maybe<Scalars['String']>;
  buildProfile?: Maybe<Scalars['String']>;
  channel?: Maybe<Scalars['String']>;
  cliVersion?: Maybe<Scalars['String']>;
  credentialsSource?: Maybe<BuildCredentialsSource>;
  distribution?: Maybe<DistributionType>;
  gitCommitHash?: Maybe<Scalars['String']>;
  iosEnterpriseProvisioning?: Maybe<BuildIosEnterpriseProvisioning>;
  releaseChannel?: Maybe<Scalars['String']>;
  runtimeVersion?: Maybe<Scalars['String']>;
  sdkVersion?: Maybe<Scalars['String']>;
  trackingContext?: Maybe<Scalars['JSONObject']>;
  username?: Maybe<Scalars['String']>;
  workflow?: Maybe<BuildWorkflow>;
};

export type BuildMetrics = {
  __typename?: 'BuildMetrics';
  buildDuration?: Maybe<Scalars['Int']>;
  buildQueueTime?: Maybe<Scalars['Int']>;
};

export type BuildMutation = {
  __typename?: 'BuildMutation';
  /**
   * Cancel an EAS Build build
   * @deprecated Use cancelBuild instead
   */
  cancel: Build;
  /** Cancel an EAS Build build */
  cancelBuild: Build;
  /** Create an Android build */
  createAndroidBuild: CreateBuildResult;
  /**
   * Create an Android generic build
   * @deprecated Use createAndroidBuild instead
   */
  createAndroidGenericBuild: CreateBuildResult;
  /**
   * Create an Android managed build
   * @deprecated Use createAndroidBuild instead
   */
  createAndroidManagedBuild: CreateBuildResult;
  /** Create an iOS build */
  createIosBuild: CreateBuildResult;
  /** Create an iOS generic build */
  createIosGenericBuild: CreateBuildResult;
  /** Create an iOS managed build */
  createIosManagedBuild: CreateBuildResult;
  /** Delete an EAS Build build */
  deleteBuild: Build;
};


export type BuildMutationCancelBuildArgs = {
  buildId: Scalars['ID'];
};


export type BuildMutationCreateAndroidBuildArgs = {
  appId: Scalars['ID'];
  job: AndroidJobInput;
  metadata?: Maybe<BuildMetadataInput>;
};


export type BuildMutationCreateAndroidGenericBuildArgs = {
  appId: Scalars['ID'];
  job: AndroidGenericJobInput;
  metadata?: Maybe<BuildMetadataInput>;
};


export type BuildMutationCreateAndroidManagedBuildArgs = {
  appId: Scalars['ID'];
  job: AndroidManagedJobInput;
  metadata?: Maybe<BuildMetadataInput>;
};


export type BuildMutationCreateIosBuildArgs = {
  appId: Scalars['ID'];
  job: IosJobInput;
  metadata?: Maybe<BuildMetadataInput>;
};


export type BuildMutationCreateIosGenericBuildArgs = {
  appId: Scalars['ID'];
  job: IosGenericJobInput;
  metadata?: Maybe<BuildMetadataInput>;
};


export type BuildMutationCreateIosManagedBuildArgs = {
  appId: Scalars['ID'];
  job: IosManagedJobInput;
  metadata?: Maybe<BuildMetadataInput>;
};


export type BuildMutationDeleteBuildArgs = {
  buildId: Scalars['ID'];
};

export type BuildOrBuildJob = {
  id: Scalars['ID'];
};

/** Publicly visible data for a Build. */
export type BuildPublicData = {
  __typename?: 'BuildPublicData';
  artifacts: PublicArtifacts;
  distribution?: Maybe<DistributionType>;
  id: Scalars['ID'];
  platform: AppPlatform;
  project: ProjectPublicData;
  status: BuildStatus;
};

export type BuildPublicDataQuery = {
  __typename?: 'BuildPublicDataQuery';
  /** Get BuildPublicData by ID */
  byId?: Maybe<BuildPublicData>;
};


export type BuildPublicDataQueryByIdArgs = {
  id: Scalars['ID'];
};

export type BuildQuery = {
  __typename?: 'BuildQuery';
  /**
   * Get all builds.
   * By default, they are sorted from latest to oldest.
   * Available only for admin users.
   */
  all: Array<Build>;
  /**
   * Get all builds for a specific app.
   * They are sorted from latest to oldest.
   * @deprecated Use App.builds instead
   */
  allForApp: Array<Maybe<Build>>;
  /** Look up EAS Build by build ID */
  byId: Build;
};


export type BuildQueryAllArgs = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order?: Maybe<Order>;
  statuses?: Maybe<Array<BuildStatus>>;
};


export type BuildQueryAllForAppArgs = {
  appId: Scalars['String'];
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  platform?: Maybe<AppPlatform>;
  status?: Maybe<BuildStatus>;
};


export type BuildQueryByIdArgs = {
  buildId: Scalars['ID'];
};

export enum BuildStatus {
  Canceled = 'CANCELED',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  InQueue = 'IN_QUEUE',
  New = 'NEW'
}

export type BuildUpdatesInput = {
  channel?: Maybe<Scalars['String']>;
};

export enum BuildWorkflow {
  Generic = 'GENERIC',
  Managed = 'MANAGED'
}

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Card = {
  __typename?: 'Card';
  brand?: Maybe<Scalars['String']>;
  cardHolder?: Maybe<Scalars['String']>;
  expMonth?: Maybe<Scalars['Int']>;
  expYear?: Maybe<Scalars['Int']>;
  last4?: Maybe<Scalars['String']>;
};

export type Charge = {
  __typename?: 'Charge';
  amount?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  invoiceId?: Maybe<Scalars['String']>;
  paid?: Maybe<Scalars['Boolean']>;
  receiptUrl?: Maybe<Scalars['String']>;
  wasRefunded?: Maybe<Scalars['Boolean']>;
};

/** Represents a client build request */
export type ClientBuild = {
  __typename?: 'ClientBuild';
  buildJobId?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  manifestPlistUrl?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  userFacingErrorMessage?: Maybe<Scalars['String']>;
  userId?: Maybe<Scalars['String']>;
};

export type ClientBuildQuery = {
  __typename?: 'ClientBuildQuery';
  byId: ClientBuild;
};


export type ClientBuildQueryByIdArgs = {
  requestId: Scalars['ID'];
};

export type CreateAccessTokenInput = {
  actorID: Scalars['ID'];
  note?: Maybe<Scalars['String']>;
};

export type CreateAccessTokenResponse = {
  __typename?: 'CreateAccessTokenResponse';
  /** AccessToken created */
  accessToken?: Maybe<AccessToken>;
  /** Full token string to be used for authentication */
  token?: Maybe<Scalars['String']>;
};

export type CreateAndroidSubmissionInput = {
  appId: Scalars['ID'];
  config: AndroidSubmissionConfigInput;
  submittedBuildId?: Maybe<Scalars['ID']>;
};

export type CreateBuildResult = {
  __typename?: 'CreateBuildResult';
  build: Build;
  deprecationInfo?: Maybe<EasBuildDeprecationInfo>;
};

export type CreateEnvironmentSecretInput = {
  name: Scalars['String'];
  value: Scalars['String'];
};

export type CreateIosSubmissionInput = {
  appId: Scalars['ID'];
  config: IosSubmissionConfigInput;
  submittedBuildId?: Maybe<Scalars['ID']>;
};

export type CreateSubmissionInput = {
  appId: Scalars['ID'];
  config: Scalars['JSONObject'];
  platform: AppPlatform;
  submittedBuildId?: Maybe<Scalars['ID']>;
};

export type CreateSubmissionResult = {
  __typename?: 'CreateSubmissionResult';
  /** Created submission */
  submission: Submission;
};

export type DeleteAccessTokenResult = {
  __typename?: 'DeleteAccessTokenResult';
  id: Scalars['ID'];
};

export type DeleteAccountResult = {
  __typename?: 'DeleteAccountResult';
  id: Scalars['ID'];
};

export type DeleteAndroidKeystoreResult = {
  __typename?: 'DeleteAndroidKeystoreResult';
  id: Scalars['ID'];
};

export type DeleteAppleDeviceResult = {
  __typename?: 'DeleteAppleDeviceResult';
  id: Scalars['ID'];
};

export type DeleteAppleDistributionCertificateResult = {
  __typename?: 'DeleteAppleDistributionCertificateResult';
  id: Scalars['ID'];
};

export type DeleteAppleProvisioningProfileResult = {
  __typename?: 'DeleteAppleProvisioningProfileResult';
  id: Scalars['ID'];
};

export type DeleteEnvironmentSecretResult = {
  __typename?: 'DeleteEnvironmentSecretResult';
  id: Scalars['ID'];
};

export type DeleteRobotResult = {
  __typename?: 'DeleteRobotResult';
  id: Scalars['ID'];
};

export type DeleteUpdateBranchResult = {
  __typename?: 'DeleteUpdateBranchResult';
  id: Scalars['ID'];
};

export type DeleteUpdateChannelResult = {
  __typename?: 'DeleteUpdateChannelResult';
  id: Scalars['ID'];
};

export type DeleteUpdateGroupResult = {
  __typename?: 'DeleteUpdateGroupResult';
  group: Scalars['ID'];
};

export type DeleteWebhookResult = {
  __typename?: 'DeleteWebhookResult';
  id: Scalars['ID'];
};

/** Represents a Deployment - a set of Builds with the same Runtime Version and Channel */
export type Deployment = {
  __typename?: 'Deployment';
  channel?: Maybe<UpdateChannel>;
  /**
   * The name of this deployment's associated channel. It is specified separately from the `channel`
   * field to allow specifying a deployment before an EAS Update channel has been created.
   */
  channelName: Scalars['String'];
  id: Scalars['ID'];
  mostRecentlyUpdatedAt: Scalars['DateTime'];
  recentBuilds: Array<Build>;
  runtimeVersion: Scalars['String'];
};

export type DeploymentOptions = {
  /** Max number of associated builds to return */
  buildListMaxSize?: Maybe<Scalars['Int']>;
};

export enum DistributionType {
  Internal = 'INTERNAL',
  Simulator = 'SIMULATOR',
  Store = 'STORE'
}

export type EasBuildDeprecationInfo = {
  __typename?: 'EASBuildDeprecationInfo';
  message: Scalars['String'];
  type: EasBuildDeprecationInfoType;
};

export enum EasBuildDeprecationInfoType {
  Internal = 'INTERNAL',
  UserFacing = 'USER_FACING'
}

export type EasBuildKillSwitch = {
  __typename?: 'EasBuildKillSwitch';
  name: EasBuildKillSwitchName;
  value: Scalars['Boolean'];
};

export type EasBuildKillSwitchMutation = {
  __typename?: 'EasBuildKillSwitchMutation';
  /** Reset all EAS Build kill switches (set them to false) */
  resetAll: Array<EasBuildKillSwitch>;
  /** Set an EAS Build kill switch to a given value */
  set: EasBuildKillSwitch;
};


export type EasBuildKillSwitchMutationSetArgs = {
  name: EasBuildKillSwitchName;
  value: Scalars['Boolean'];
};

export enum EasBuildKillSwitchName {
  StopAcceptingBuilds = 'STOP_ACCEPTING_BUILDS',
  StopAcceptingNormalPriorityBuilds = 'STOP_ACCEPTING_NORMAL_PRIORITY_BUILDS',
  StopSchedulingBuilds = 'STOP_SCHEDULING_BUILDS'
}

export type EasBuildQuery = {
  __typename?: 'EasBuildQuery';
  /** Get EAS Build kill switches state */
  killSwitches: Array<EasBuildKillSwitch>;
};

export type EditUpdateBranchInput = {
  appId?: Maybe<Scalars['ID']>;
  id?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  newName: Scalars['String'];
};

export type EmailSubscriptionMutation = {
  __typename?: 'EmailSubscriptionMutation';
  addUser?: Maybe<AddUserPayload>;
};


export type EmailSubscriptionMutationAddUserArgs = {
  addUserInput: AddUserInput;
};

export enum EmailTemplate {
  /** Able to purchase Developer Services */
  DevServicesOfferExtended = 'DEV_SERVICES_OFFER_EXTENDED',
  /** Developer Services Signup */
  DevServicesOnboarding = 'DEV_SERVICES_ONBOARDING'
}

export type EnvironmentSecret = {
  __typename?: 'EnvironmentSecret';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  name: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type EnvironmentSecretMutation = {
  __typename?: 'EnvironmentSecretMutation';
  /** Create an environment secret for an Account */
  createEnvironmentSecretForAccount: EnvironmentSecret;
  /** Create an environment secret for an App */
  createEnvironmentSecretForApp: EnvironmentSecret;
  /** Delete an environment secret */
  deleteEnvironmentSecret: DeleteEnvironmentSecretResult;
};


export type EnvironmentSecretMutationCreateEnvironmentSecretForAccountArgs = {
  accountId: Scalars['String'];
  environmentSecretData: CreateEnvironmentSecretInput;
};


export type EnvironmentSecretMutationCreateEnvironmentSecretForAppArgs = {
  appId: Scalars['String'];
  environmentSecretData: CreateEnvironmentSecretInput;
};


export type EnvironmentSecretMutationDeleteEnvironmentSecretArgs = {
  id: Scalars['String'];
};

export type ExperimentationQuery = {
  __typename?: 'ExperimentationQuery';
  /** Get device experimentation config */
  deviceConfig: Scalars['JSONObject'];
  /** Get experimentation unit to use for device experiments. In this case, it is the IP address. */
  deviceExperimentationUnit: Scalars['ID'];
  /** Get user experimentation config */
  userConfig: Scalars['JSONObject'];
};

export type FcmSnippet = FcmSnippetLegacy | FcmSnippetV1;

export type FcmSnippetLegacy = {
  __typename?: 'FcmSnippetLegacy';
  firstFourCharacters: Scalars['String'];
  lastFourCharacters: Scalars['String'];
};

export type FcmSnippetV1 = {
  __typename?: 'FcmSnippetV1';
  clientId?: Maybe<Scalars['String']>;
  keyId: Scalars['String'];
  projectId: Scalars['String'];
  serviceAccountEmail: Scalars['String'];
};

export enum Feature {
  /** Priority Builds */
  Builds = 'BUILDS',
  /** Funds support for open source development */
  OpenSource = 'OPEN_SOURCE',
  /** Top Tier Support */
  Support = 'SUPPORT',
  /** Share access to projects */
  Teams = 'TEAMS'
}

export type GetSignedAssetUploadSpecificationsResult = {
  __typename?: 'GetSignedAssetUploadSpecificationsResult';
  specifications: Array<Maybe<Scalars['String']>>;
};

export type GoogleServiceAccountKey = {
  __typename?: 'GoogleServiceAccountKey';
  account: Account;
  clientEmail: Scalars['String'];
  clientIdentifier: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  privateKeyIdentifier: Scalars['String'];
  projectIdentifier: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type IosAppBuildCredentials = {
  __typename?: 'IosAppBuildCredentials';
  /** @deprecated Get Apple Devices from AppleProvisioningProfile instead */
  appleDevices?: Maybe<Array<Maybe<AppleDevice>>>;
  distributionCertificate?: Maybe<AppleDistributionCertificate>;
  id: Scalars['ID'];
  iosAppCredentials: IosAppCredentials;
  iosDistributionType: IosDistributionType;
  provisioningProfile?: Maybe<AppleProvisioningProfile>;
};

export type IosAppBuildCredentialsFilter = {
  iosDistributionType?: Maybe<IosDistributionType>;
};

export type IosAppBuildCredentialsInput = {
  distributionCertificateId: Scalars['ID'];
  iosDistributionType: IosDistributionType;
  provisioningProfileId: Scalars['ID'];
};

export type IosAppBuildCredentialsMutation = {
  __typename?: 'IosAppBuildCredentialsMutation';
  /** Create a set of build credentials for an iOS app */
  createIosAppBuildCredentials: IosAppBuildCredentials;
  /** Set the distribution certificate to be used for an iOS app */
  setDistributionCertificate: IosAppBuildCredentials;
  /** Set the provisioning profile to be used for an iOS app */
  setProvisioningProfile: IosAppBuildCredentials;
};


export type IosAppBuildCredentialsMutationCreateIosAppBuildCredentialsArgs = {
  iosAppBuildCredentialsInput: IosAppBuildCredentialsInput;
  iosAppCredentialsId: Scalars['ID'];
};


export type IosAppBuildCredentialsMutationSetDistributionCertificateArgs = {
  distributionCertificateId: Scalars['ID'];
  id: Scalars['ID'];
};


export type IosAppBuildCredentialsMutationSetProvisioningProfileArgs = {
  id: Scalars['ID'];
  provisioningProfileId: Scalars['ID'];
};

export type IosAppCredentials = {
  __typename?: 'IosAppCredentials';
  app: App;
  appSpecificPassword?: Maybe<AppleAppSpecificPassword>;
  appleAppIdentifier: AppleAppIdentifier;
  appleTeam?: Maybe<AppleTeam>;
  id: Scalars['ID'];
  /** @deprecated use iosAppBuildCredentialsList instead */
  iosAppBuildCredentialsArray: Array<IosAppBuildCredentials>;
  iosAppBuildCredentialsList: Array<IosAppBuildCredentials>;
  pushKey?: Maybe<ApplePushKey>;
};


export type IosAppCredentialsIosAppBuildCredentialsArrayArgs = {
  filter?: Maybe<IosAppBuildCredentialsFilter>;
};


export type IosAppCredentialsIosAppBuildCredentialsListArgs = {
  filter?: Maybe<IosAppBuildCredentialsFilter>;
};

export type IosAppCredentialsFilter = {
  appleAppIdentifierId?: Maybe<Scalars['String']>;
};

export type IosAppCredentialsInput = {
  appSpecificPasswordId?: Maybe<Scalars['ID']>;
  appleTeamId?: Maybe<Scalars['ID']>;
  pushKeyId?: Maybe<Scalars['ID']>;
};

export type IosAppCredentialsMutation = {
  __typename?: 'IosAppCredentialsMutation';
  /** Create a set of credentials for an iOS app */
  createIosAppCredentials: IosAppCredentials;
  /** Set the app-specific password to be used for an iOS app */
  setAppSpecificPassword: IosAppCredentials;
  /** Set the push key to be used in an iOS app */
  setPushKey: IosAppCredentials;
};


export type IosAppCredentialsMutationCreateIosAppCredentialsArgs = {
  appId: Scalars['ID'];
  appleAppIdentifierId: Scalars['ID'];
  iosAppCredentialsInput: IosAppCredentialsInput;
};


export type IosAppCredentialsMutationSetAppSpecificPasswordArgs = {
  appSpecificPasswordId: Scalars['ID'];
  id: Scalars['ID'];
};


export type IosAppCredentialsMutationSetPushKeyArgs = {
  id: Scalars['ID'];
  pushKeyId: Scalars['ID'];
};

export enum IosBuildType {
  DevelopmentClient = 'DEVELOPMENT_CLIENT',
  Release = 'RELEASE'
}

export type IosBuilderEnvironmentInput = {
  bundler?: Maybe<Scalars['String']>;
  cocoapods?: Maybe<Scalars['String']>;
  env?: Maybe<Scalars['JSONObject']>;
  expoCli?: Maybe<Scalars['String']>;
  fastlane?: Maybe<Scalars['String']>;
  image?: Maybe<Scalars['String']>;
  node?: Maybe<Scalars['String']>;
  yarn?: Maybe<Scalars['String']>;
};

export enum IosDistributionType {
  AdHoc = 'AD_HOC',
  AppStore = 'APP_STORE',
  Development = 'DEVELOPMENT',
  Enterprise = 'ENTERPRISE'
}

export type IosGenericJobInput = {
  artifactPath?: Maybe<Scalars['String']>;
  buildConfiguration?: Maybe<Scalars['String']>;
  builderEnvironment?: Maybe<IosBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  distribution?: Maybe<DistributionType>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  scheme: Scalars['String'];
  schemeBuildConfiguration?: Maybe<IosSchemeBuildConfiguration>;
  secrets?: Maybe<IosJobSecretsInput>;
  updates?: Maybe<BuildUpdatesInput>;
};

export type IosJobDistributionCertificateInput = {
  dataBase64: Scalars['String'];
  password: Scalars['String'];
};

export type IosJobInput = {
  artifactPath?: Maybe<Scalars['String']>;
  buildConfiguration?: Maybe<Scalars['String']>;
  buildType?: Maybe<IosBuildType>;
  builderEnvironment?: Maybe<IosBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  distribution?: Maybe<DistributionType>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  scheme?: Maybe<Scalars['String']>;
  secrets?: Maybe<IosJobSecretsInput>;
  type: BuildWorkflow;
  updates?: Maybe<BuildUpdatesInput>;
  username?: Maybe<Scalars['String']>;
};

export type IosJobSecretsInput = {
  buildCredentials?: Maybe<Array<Maybe<IosJobTargetCredentialsInput>>>;
  environmentSecrets?: Maybe<Scalars['JSONObject']>;
};

export type IosJobTargetCredentialsInput = {
  distributionCertificate: IosJobDistributionCertificateInput;
  provisioningProfileBase64: Scalars['String'];
  targetName: Scalars['String'];
};

export enum IosManagedBuildType {
  DevelopmentClient = 'DEVELOPMENT_CLIENT',
  Release = 'RELEASE'
}

export type IosManagedJobInput = {
  buildType?: Maybe<IosManagedBuildType>;
  builderEnvironment?: Maybe<IosBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  distribution?: Maybe<DistributionType>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  secrets?: Maybe<IosJobSecretsInput>;
  updates?: Maybe<BuildUpdatesInput>;
  username?: Maybe<Scalars['String']>;
};

export enum IosSchemeBuildConfiguration {
  Debug = 'DEBUG',
  Release = 'RELEASE'
}

export type IosSubmissionConfig = {
  __typename?: 'IosSubmissionConfig';
  appleAppSpecificPasswordId?: Maybe<Scalars['String']>;
  appleIdUsername: Scalars['String'];
  ascAppIdentifier: Scalars['String'];
};

export type IosSubmissionConfigInput = {
  appleAppSpecificPassword?: Maybe<Scalars['String']>;
  appleAppSpecificPasswordId?: Maybe<Scalars['String']>;
  appleIdUsername: Scalars['String'];
  archiveUrl?: Maybe<Scalars['String']>;
  ascAppIdentifier: Scalars['String'];
};

export type LeaveAccountResult = {
  __typename?: 'LeaveAccountResult';
  success: Scalars['Boolean'];
};

export enum MailchimpAudience {
  ExpoDevelopers = 'EXPO_DEVELOPERS'
}

export enum MailchimpTag {
  DevClientUsers = 'DEV_CLIENT_USERS',
  EasMasterList = 'EAS_MASTER_LIST'
}

export type MailchimpTagPayload = {
  __typename?: 'MailchimpTagPayload';
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
};

export type MeMutation = {
  __typename?: 'MeMutation';
  /** Add an additional second factor device */
  addSecondFactorDevice: SecondFactorDeviceConfigurationResult;
  /** Certify an initiated second factor authentication method for the current user */
  certifySecondFactorDevice: SecondFactorBooleanResult;
  /** Create a new Account and grant this User the owner Role */
  createAccount?: Maybe<Account>;
  /** Delete an Account created via createAccount */
  deleteAccount: DeleteAccountResult;
  /** Delete a second factor device */
  deleteSecondFactorDevice: SecondFactorBooleanResult;
  /** Delete a Snack that the current user owns */
  deleteSnack?: Maybe<Snack>;
  /** Disable all second factor authentication for the current user */
  disableSecondFactorAuthentication: SecondFactorBooleanResult;
  /** Initiate setup of two-factor authentication for the current user */
  initiateSecondFactorAuthentication: SecondFactorInitiationResult;
  /** Leave an Account (revoke own permissions on Account) */
  leaveAccount: LeaveAccountResult;
  /** Purge unfinished two-factor authentication setup for the current user if not fully-set-up */
  purgeUnfinishedSecondFactorAuthentication: SecondFactorBooleanResult;
  /** Regenerate backup codes for the current user */
  regenerateSecondFactorBackupCodes: SecondFactorRegenerateBackupCodesResult;
  /** Send SMS OTP to a second factor device for use during device setup or during change confirmation */
  sendSMSOTPToSecondFactorDevice: SecondFactorBooleanResult;
  /** Set the user's primary second factor device */
  setPrimarySecondFactorDevice: SecondFactorBooleanResult;
  /** Transfer project to a different Account */
  transferApp: App;
  /** Unpublish an App that the current user owns */
  unpublishApp?: Maybe<App>;
  /** Update an App that the current user owns */
  updateApp?: Maybe<App>;
  /** Update the current user's data */
  updateProfile?: Maybe<User>;
};


export type MeMutationAddSecondFactorDeviceArgs = {
  deviceConfiguration: SecondFactorDeviceConfiguration;
  otp: Scalars['String'];
};


export type MeMutationCertifySecondFactorDeviceArgs = {
  otp: Scalars['String'];
};


export type MeMutationCreateAccountArgs = {
  accountData: AccountDataInput;
};


export type MeMutationDeleteAccountArgs = {
  accountId: Scalars['ID'];
};


export type MeMutationDeleteSecondFactorDeviceArgs = {
  otp: Scalars['String'];
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationDeleteSnackArgs = {
  snackId: Scalars['ID'];
};


export type MeMutationDisableSecondFactorAuthenticationArgs = {
  otp: Scalars['String'];
};


export type MeMutationInitiateSecondFactorAuthenticationArgs = {
  deviceConfigurations: Array<Maybe<SecondFactorDeviceConfiguration>>;
  recaptchaResponseToken?: Maybe<Scalars['String']>;
};


export type MeMutationLeaveAccountArgs = {
  accountId: Scalars['ID'];
};


export type MeMutationRegenerateSecondFactorBackupCodesArgs = {
  otp: Scalars['String'];
};


export type MeMutationSendSmsotpToSecondFactorDeviceArgs = {
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationSetPrimarySecondFactorDeviceArgs = {
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationTransferAppArgs = {
  appId: Scalars['ID'];
  destinationAccountId: Scalars['ID'];
};


export type MeMutationUnpublishAppArgs = {
  appId: Scalars['ID'];
};


export type MeMutationUpdateAppArgs = {
  appData: AppDataInput;
};


export type MeMutationUpdateProfileArgs = {
  userData: UserDataInput;
};

export type Offer = {
  __typename?: 'Offer';
  features?: Maybe<Array<Maybe<Feature>>>;
  id: Scalars['ID'];
  price: Scalars['Int'];
  quantity?: Maybe<Scalars['Int']>;
  stripeId: Scalars['ID'];
  trialLength?: Maybe<Scalars['Int']>;
  type: OfferType;
};

export enum OfferType {
  /** Advanced Purchase of Paid Resource */
  Prepaid = 'PREPAID',
  /** Term subscription */
  Subscription = 'SUBSCRIPTION'
}

export enum Order {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type PartialManifest = {
  assets: Array<Maybe<PartialManifestAsset>>;
  extra?: Maybe<Scalars['JSONObject']>;
  launchAsset: PartialManifestAsset;
};

export type PartialManifestAsset = {
  bundleKey: Scalars['String'];
  contentType: Scalars['String'];
  fileExtension?: Maybe<Scalars['String']>;
  fileSHA256: Scalars['String'];
  storageKey: Scalars['String'];
};

export type PaymentDetails = {
  __typename?: 'PaymentDetails';
  address?: Maybe<Address>;
  card?: Maybe<Card>;
  id: Scalars['ID'];
};

export enum Permission {
  Admin = 'ADMIN',
  Own = 'OWN',
  Publish = 'PUBLISH',
  View = 'VIEW'
}

export type Project = {
  description: Scalars['String'];
  fullName: Scalars['String'];
  /** @deprecated No longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  published: Scalars['Boolean'];
  slug: Scalars['String'];
  updated: Scalars['DateTime'];
  username: Scalars['String'];
};

export type ProjectArchiveSourceInput = {
  bucketKey?: Maybe<Scalars['String']>;
  type: ProjectArchiveSourceType;
  url?: Maybe<Scalars['String']>;
};

export enum ProjectArchiveSourceType {
  S3 = 'S3',
  Url = 'URL'
}

export type ProjectPublicData = {
  __typename?: 'ProjectPublicData';
  fullName: Scalars['String'];
  id: Scalars['ID'];
};

export type ProjectQuery = {
  __typename?: 'ProjectQuery';
  byAccountNameAndSlug: Project;
  /** @deprecated No longer supported */
  byPaths: Array<Maybe<Project>>;
  /** @deprecated See byAccountNameAndSlug */
  byUsernameAndSlug: Project;
};


export type ProjectQueryByAccountNameAndSlugArgs = {
  accountName: Scalars['String'];
  platform?: Maybe<AppPlatform>;
  sdkVersions?: Maybe<Array<Maybe<Scalars['String']>>>;
  slug: Scalars['String'];
};


export type ProjectQueryByPathsArgs = {
  paths?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type ProjectQueryByUsernameAndSlugArgs = {
  platform?: Maybe<Scalars['String']>;
  sdkVersions?: Maybe<Array<Maybe<Scalars['String']>>>;
  slug: Scalars['String'];
  username: Scalars['String'];
};

export type PublicArtifacts = {
  __typename?: 'PublicArtifacts';
  buildUrl?: Maybe<Scalars['String']>;
};

export type PublishUpdateGroupInput = {
  branchId: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  runtimeVersion: Scalars['String'];
  updateInfoGroup: UpdateInfoGroup;
};

export type RescindUserInvitationResult = {
  __typename?: 'RescindUserInvitationResult';
  id: Scalars['ID'];
};

/** Represents a robot (not human) actor. */
export type Robot = Actor & {
  __typename?: 'Robot';
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  /** Associated accounts */
  accounts: Array<Account>;
  created: Scalars['DateTime'];
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isExpoAdmin: Scalars['Boolean'];
};


/** Represents a robot (not human) actor. */
export type RobotFeatureGatesArgs = {
  filter?: Maybe<Array<Scalars['String']>>;
};

export type RobotDataInput = {
  name?: Maybe<Scalars['String']>;
};

export type RobotMutation = {
  __typename?: 'RobotMutation';
  /** Create a Robot and grant it Permissions on an Account */
  createRobotForAccount: Robot;
  /** Delete a Robot */
  deleteRobot: DeleteRobotResult;
  /** Update a Robot */
  updateRobot: Robot;
};


export type RobotMutationCreateRobotForAccountArgs = {
  accountID: Scalars['String'];
  permissions: Array<Maybe<Permission>>;
  robotData?: Maybe<RobotDataInput>;
};


export type RobotMutationDeleteRobotArgs = {
  id: Scalars['String'];
};


export type RobotMutationUpdateRobotArgs = {
  id: Scalars['String'];
  robotData: RobotDataInput;
};

export enum Role {
  Admin = 'ADMIN',
  Custom = 'CUSTOM',
  Developer = 'DEVELOPER',
  HasAdmin = 'HAS_ADMIN',
  NotAdmin = 'NOT_ADMIN',
  Owner = 'OWNER',
  ViewOnly = 'VIEW_ONLY'
}

export type RootMutation = {
  __typename?: 'RootMutation';
  /**
   * This is a placeholder field
   * @deprecated Not used.
   */
  _doNotUse?: Maybe<Scalars['String']>;
  /** Mutations that create, read, update, and delete AccessTokens for Actors */
  accessToken: AccessTokenMutation;
  /** Mutations that modify an Account */
  account?: Maybe<AccountMutation>;
  /** Mutations that modify the build credentials for an Android app */
  androidAppBuildCredentials: AndroidAppBuildCredentialsMutation;
  /** Mutations that modify the credentials for an Android app */
  androidAppCredentials: AndroidAppCredentialsMutation;
  /** Mutations that modify an FCM credential */
  androidFcm: AndroidFcmMutation;
  /** Mutations that modify a Keystore */
  androidKeystore: AndroidKeystoreMutation;
  /** Mutations that modify an App */
  app?: Maybe<AppMutation>;
  /** Mutations that modify an Identifier for an iOS App */
  appleAppIdentifier: AppleAppIdentifierMutation;
  /** Mutations that modify an App Specific Password for an Apple User Account */
  appleAppSpecificPassword: AppleAppSpecificPasswordMutation;
  /** Mutations that modify an Apple Device */
  appleDevice: AppleDeviceMutation;
  /** Mutations that modify an Apple Device registration request */
  appleDeviceRegistrationRequest: AppleDeviceRegistrationRequestMutation;
  /** Mutations that modify a Distribution Certificate */
  appleDistributionCertificate: AppleDistributionCertificateMutation;
  /** Mutations that modify a Provisioning Profile */
  appleProvisioningProfile: AppleProvisioningProfileMutation;
  /** Mutations that modify an Apple Push Notification key */
  applePushKey: ApplePushKeyMutation;
  /** Mutations that modify an Apple Team */
  appleTeam: AppleTeamMutation;
  asset: AssetMutation;
  /** Mutations that modify an EAS Build */
  build?: Maybe<BuildMutation>;
  /** Mutations that modify an BuildJob */
  buildJob?: Maybe<BuildJobMutation>;
  easBuildKillSwitch: EasBuildKillSwitchMutation;
  /** Mutations that modify an EmailSubscription */
  emailSubscription: EmailSubscriptionMutation;
  /** Mutations that create and delete EnvironmentSecrets */
  environmentSecret: EnvironmentSecretMutation;
  /** Mutations that modify the build credentials for an iOS app */
  iosAppBuildCredentials: IosAppBuildCredentialsMutation;
  /** Mutations that modify the credentials for an iOS app */
  iosAppCredentials: IosAppCredentialsMutation;
  /** Mutations that modify the currently authenticated User */
  me?: Maybe<MeMutation>;
  /** Mutations that create, update, and delete Robots */
  robot: RobotMutation;
  /** Mutations that modify an EAS Submit submission */
  submission: SubmissionMutation;
  update: UpdateMutation;
  updateBranch: UpdateBranchMutation;
  updateChannel: UpdateChannelMutation;
  uploadSession: UploadSession;
  /** Mutations that create, delete, and accept UserInvitations */
  userInvitation: UserInvitationMutation;
  /** Mutations that create, delete, update Webhooks */
  webhook: WebhookMutation;
};


export type RootMutationAccountArgs = {
  accountName: Scalars['ID'];
};


export type RootMutationAppArgs = {
  appId?: Maybe<Scalars['ID']>;
};


export type RootMutationBuildArgs = {
  buildId?: Maybe<Scalars['ID']>;
};


export type RootMutationBuildJobArgs = {
  buildId: Scalars['ID'];
};

export type RootQuery = {
  __typename?: 'RootQuery';
  /**
   * This is a placeholder field
   * @deprecated Not used.
   */
  _doNotUse?: Maybe<Scalars['String']>;
  /** Top-level query object for querying Accounts. */
  account: AccountQuery;
  /** Top-level query object for querying Actors. */
  actor: ActorQuery;
  /**
   * Public apps in the app directory
   * @deprecated Use 'all' field under 'app'.
   */
  allPublicApps?: Maybe<Array<Maybe<App>>>;
  app?: Maybe<AppQuery>;
  /**
   * Look up app by app id
   * @deprecated Use 'byId' field under 'app'.
   */
  appByAppId?: Maybe<App>;
  /** Top-level query object for querying Apple Device registration requests. */
  appleDeviceRegistrationRequest: AppleDeviceRegistrationRequestQuery;
  /** Top-level query object for querying Apple Teams. */
  appleTeam: AppleTeamQuery;
  asset: AssetQuery;
  buildJobs: BuildJobQuery;
  /** Top-level query object for querying BuildPublicData publicly. */
  buildPublicData: BuildPublicDataQuery;
  builds: BuildQuery;
  clientBuilds: ClientBuildQuery;
  /** Top-level query object for querying EAS Build configuration. */
  easBuild: EasBuildQuery;
  /** Top-level query object for querying Experimentation configuration. */
  experimentation: ExperimentationQuery;
  /**
   * If authenticated as a typical end user, this is the appropriate top-level
   * query object
   */
  me?: Maybe<User>;
  /**
   * If authenticated as a any type of Actor, this is the appropriate top-level
   * query object
   */
  meActor?: Maybe<Actor>;
  project: ProjectQuery;
  snack: SnackQuery;
  submissions: SubmissionQuery;
  /** fetch all updates in a group */
  updatesByGroup: Array<Update>;
  /** Top-level query object for querying Users. */
  user: UserQuery;
  /** @deprecated Use 'byId' field under 'user'. */
  userByUserId?: Maybe<User>;
  /** @deprecated Use 'byUsername' field under 'user'. */
  userByUsername?: Maybe<User>;
  /** Top-level query object for querying UserInvitationPublicData publicly. */
  userInvitationPublicData: UserInvitationPublicDataQuery;
  /**
   * If authenticated as a typical end user, this is the appropriate top-level
   * query object
   */
  viewer?: Maybe<User>;
  /** Top-level query object for querying Webhooks. */
  webhook: WebhookQuery;
};


export type RootQueryAllPublicAppsArgs = {
  filter: AppsFilter;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  sort: AppSort;
};


export type RootQueryAppByAppIdArgs = {
  appId: Scalars['String'];
};


export type RootQueryUpdatesByGroupArgs = {
  group: Scalars['ID'];
};


export type RootQueryUserByUserIdArgs = {
  userId: Scalars['String'];
};


export type RootQueryUserByUsernameArgs = {
  username: Scalars['String'];
};

export type SecondFactorBooleanResult = {
  __typename?: 'SecondFactorBooleanResult';
  success: Scalars['Boolean'];
};

export type SecondFactorDeviceConfiguration = {
  isPrimary: Scalars['Boolean'];
  method: SecondFactorMethod;
  name: Scalars['String'];
  smsPhoneNumber?: Maybe<Scalars['String']>;
};

export type SecondFactorDeviceConfigurationResult = {
  __typename?: 'SecondFactorDeviceConfigurationResult';
  keyURI: Scalars['String'];
  secondFactorDevice: UserSecondFactorDevice;
  secret: Scalars['String'];
};

export type SecondFactorInitiationResult = {
  __typename?: 'SecondFactorInitiationResult';
  configurationResults: Array<Maybe<SecondFactorDeviceConfigurationResult>>;
  plaintextBackupCodes: Array<Maybe<Scalars['String']>>;
};

export enum SecondFactorMethod {
  /** Google Authenticator (TOTP) */
  Authenticator = 'AUTHENTICATOR',
  /** SMS */
  Sms = 'SMS'
}

export type SecondFactorRegenerateBackupCodesResult = {
  __typename?: 'SecondFactorRegenerateBackupCodesResult';
  plaintextBackupCodes: Array<Maybe<Scalars['String']>>;
};

export type Snack = Project & {
  __typename?: 'Snack';
  /** Description of the Snack */
  description: Scalars['String'];
  /** Full name of the Snack, e.g. "@john/mysnack", "@snack/245631" */
  fullName: Scalars['String'];
  hashId: Scalars['String'];
  /** @deprecated No longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** Draft status, which is true when the Snack was not saved explicitly, but auto-saved */
  isDraft: Scalars['Boolean'];
  /** Name of the Snack, e.g. "My Snack" */
  name: Scalars['String'];
  published: Scalars['Boolean'];
  /** Slug name, e.g. "mysnack", "245631" */
  slug: Scalars['String'];
  /** Date and time the Snack was last updated */
  updated: Scalars['DateTime'];
  /** Name of the user that created the Snack, or "snack" when the Snack was saved anonymously */
  username: Scalars['String'];
};

export type SnackQuery = {
  __typename?: 'SnackQuery';
  /** Get snack by hashId */
  byHashId: Snack;
  /**
   * Get snack by hashId
   * @deprecated Use byHashId
   */
  byId: Snack;
};


export type SnackQueryByHashIdArgs = {
  hashId: Scalars['ID'];
};


export type SnackQueryByIdArgs = {
  id: Scalars['ID'];
};

export enum StandardOffer {
  /** $29 USD per month, 30 day trial */
  Default = 'DEFAULT',
  /** $800 USD per month */
  Support = 'SUPPORT',
  /** $29 USD per month, 1 year trial */
  YcDeals = 'YC_DEALS',
  /** $348 USD per year, 30 day trial */
  YearlySub = 'YEARLY_SUB'
}

/** Represents an EAS Submission */
export type Submission = ActivityTimelineProjectActivity & {
  __typename?: 'Submission';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  androidConfig?: Maybe<AndroidSubmissionConfig>;
  app: App;
  createdAt: Scalars['DateTime'];
  error?: Maybe<SubmissionError>;
  id: Scalars['ID'];
  initiatingActor?: Maybe<Actor>;
  iosConfig?: Maybe<IosSubmissionConfig>;
  logsUrl?: Maybe<Scalars['String']>;
  platform: AppPlatform;
  status: SubmissionStatus;
  submittedBuild?: Maybe<Build>;
  updatedAt: Scalars['DateTime'];
};

export enum SubmissionAndroidArchiveType {
  Aab = 'AAB',
  Apk = 'APK'
}

export enum SubmissionAndroidReleaseStatus {
  Completed = 'COMPLETED',
  Draft = 'DRAFT',
  Halted = 'HALTED',
  InProgress = 'IN_PROGRESS'
}

export enum SubmissionAndroidTrack {
  Alpha = 'ALPHA',
  Beta = 'BETA',
  Internal = 'INTERNAL',
  Production = 'PRODUCTION'
}

export type SubmissionError = {
  __typename?: 'SubmissionError';
  errorCode?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
};

export type SubmissionFilter = {
  platform?: Maybe<AppPlatform>;
  status?: Maybe<SubmissionStatus>;
};

export type SubmissionMutation = {
  __typename?: 'SubmissionMutation';
  /** Create an Android EAS Submit submission */
  createAndroidSubmission: CreateSubmissionResult;
  /** Create an iOS EAS Submit submission */
  createIosSubmission: CreateSubmissionResult;
  /**
   * Create an EAS Submit submission
   * @deprecated Use createIosSubmission / createAndroidSubmission instead
   */
  createSubmission: CreateSubmissionResult;
};


export type SubmissionMutationCreateAndroidSubmissionArgs = {
  input: CreateAndroidSubmissionInput;
};


export type SubmissionMutationCreateIosSubmissionArgs = {
  input: CreateIosSubmissionInput;
};


export type SubmissionMutationCreateSubmissionArgs = {
  input: CreateSubmissionInput;
};

export type SubmissionQuery = {
  __typename?: 'SubmissionQuery';
  /** Look up EAS Submission by submission ID */
  byId: Submission;
};


export type SubmissionQueryByIdArgs = {
  submissionId: Scalars['ID'];
};

export enum SubmissionStatus {
  AwaitingBuild = 'AWAITING_BUILD',
  Canceled = 'CANCELED',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  InQueue = 'IN_QUEUE'
}

export type SubscriptionDetails = {
  __typename?: 'SubscriptionDetails';
  cancelledAt?: Maybe<Scalars['DateTime']>;
  endedAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  nextInvoice?: Maybe<Scalars['DateTime']>;
  status?: Maybe<Scalars['String']>;
  trialEnd?: Maybe<Scalars['DateTime']>;
  willCancel?: Maybe<Scalars['Boolean']>;
};

export type Update = ActivityTimelineProjectActivity & {
  __typename?: 'Update';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  branch: UpdateBranch;
  branchId: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  group: Scalars['String'];
  id: Scalars['ID'];
  manifestFragment: Scalars['String'];
  manifestPermalink: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  platform: Scalars['String'];
  runtimeVersion: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type UpdateBranch = {
  __typename?: 'UpdateBranch';
  appId: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  name: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  updates: Array<Update>;
};


export type UpdateBranchUpdatesArgs = {
  filter?: Maybe<UpdatesFilter>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type UpdateBranchMutation = {
  __typename?: 'UpdateBranchMutation';
  /** Create an EAS branch for an app */
  createUpdateBranchForApp?: Maybe<UpdateBranch>;
  /** Delete an EAS branch and all of its updates as long as the branch is not being used by any channels */
  deleteUpdateBranch: DeleteUpdateBranchResult;
  /**
   * Edit an EAS branch. The branch can be specified either by its ID or
   * with the combination of (appId, name).
   */
  editUpdateBranch: UpdateBranch;
  /** Publish an update group to a branch */
  publishUpdateGroups: Array<Update>;
};


export type UpdateBranchMutationCreateUpdateBranchForAppArgs = {
  appId: Scalars['ID'];
  name: Scalars['String'];
};


export type UpdateBranchMutationDeleteUpdateBranchArgs = {
  branchId: Scalars['ID'];
};


export type UpdateBranchMutationEditUpdateBranchArgs = {
  input: EditUpdateBranchInput;
};


export type UpdateBranchMutationPublishUpdateGroupsArgs = {
  publishUpdateGroupsInput: Array<PublishUpdateGroupInput>;
};

export type UpdateChannel = {
  __typename?: 'UpdateChannel';
  appId: Scalars['ID'];
  branchMapping: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  name: Scalars['String'];
  updateBranches: Array<UpdateBranch>;
  updatedAt: Scalars['DateTime'];
};


export type UpdateChannelUpdateBranchesArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type UpdateChannelMutation = {
  __typename?: 'UpdateChannelMutation';
  /**
   * Create an EAS channel for an app.
   *
   * In order to work with GraphQL formatting, the branchMapping should be a
   * stringified JSON supplied to the mutation as a variable.
   */
  createUpdateChannelForApp?: Maybe<UpdateChannel>;
  /** delete an EAS channel that doesn't point to any branches */
  deleteUpdateChannel: DeleteUpdateChannelResult;
  /**
   * Edit an EAS channel.
   *
   * In order to work with GraphQL formatting, the branchMapping should be a
   * stringified JSON supplied to the mutation as a variable.
   */
  editUpdateChannel?: Maybe<UpdateChannel>;
};


export type UpdateChannelMutationCreateUpdateChannelForAppArgs = {
  appId: Scalars['ID'];
  branchMapping?: Maybe<Scalars['String']>;
  name: Scalars['String'];
};


export type UpdateChannelMutationDeleteUpdateChannelArgs = {
  channelId: Scalars['ID'];
};


export type UpdateChannelMutationEditUpdateChannelArgs = {
  branchMapping: Scalars['String'];
  channelId: Scalars['ID'];
};

export type UpdateInfoGroup = {
  android?: Maybe<PartialManifest>;
  ios?: Maybe<PartialManifest>;
  web?: Maybe<PartialManifest>;
};

export type UpdateMutation = {
  __typename?: 'UpdateMutation';
  /** Delete an EAS update group */
  deleteUpdateGroup: DeleteUpdateGroupResult;
};


export type UpdateMutationDeleteUpdateGroupArgs = {
  group: Scalars['ID'];
};

export type UpdatesFilter = {
  platform?: Maybe<AppPlatform>;
  runtimeVersions?: Maybe<Array<Scalars['String']>>;
};

export type UploadSession = {
  __typename?: 'UploadSession';
  /** Create an Upload Session */
  createUploadSession: Scalars['JSONObject'];
};


export type UploadSessionCreateUploadSessionArgs = {
  type: UploadSessionType;
};

export enum UploadSessionType {
  EasBuildProjectSources = 'EAS_BUILD_PROJECT_SOURCES',
  EasSubmitAppArchive = 'EAS_SUBMIT_APP_ARCHIVE'
}

/** Represents a human (not robot) actor. */
export type User = Actor & {
  __typename?: 'User';
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  accounts: Array<Account>;
  /** Coalesced project activity for all apps belonging to all accounts this user belongs to. Only resolves for the viewer. */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  appCount: Scalars['Int'];
  appetizeCode?: Maybe<Scalars['String']>;
  /** Apps this user has published */
  apps: Array<App>;
  created: Scalars['DateTime'];
  email?: Maybe<Scalars['String']>;
  emailVerified: Scalars['Boolean'];
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  githubUsername?: Maybe<Scalars['String']>;
  /** Whether this user has any pending user invitations. Only resolves for the viewer. */
  hasPendingUserInvitations: Scalars['Boolean'];
  id: Scalars['ID'];
  industry?: Maybe<Scalars['String']>;
  /** @deprecated No longer supported */
  isEmailUnsubscribed: Scalars['Boolean'];
  isExpoAdmin: Scalars['Boolean'];
  /** @deprecated No longer supported */
  isLegacy?: Maybe<Scalars['Boolean']>;
  /** @deprecated No longer supported */
  isOnboarded?: Maybe<Scalars['Boolean']>;
  isSecondFactorAuthenticationEnabled: Scalars['Boolean'];
  /** @deprecated No longer supported */
  lastLogin?: Maybe<Scalars['DateTime']>;
  lastName?: Maybe<Scalars['String']>;
  /** @deprecated No longer supported */
  lastPasswordReset?: Maybe<Scalars['DateTime']>;
  /** @deprecated 'likes' have been deprecated. */
  likes?: Maybe<Array<Maybe<App>>>;
  location?: Maybe<Scalars['String']>;
  /** Pending UserInvitations for this user. Only resolves for the viewer. */
  pendingUserInvitations: Array<UserInvitation>;
  /** Associated accounts */
  primaryAccount: Account;
  profilePhoto: Scalars['String'];
  /** Get all certified second factor authentication methods */
  secondFactorDevices: Array<UserSecondFactorDevice>;
  /** Snacks associated with this account */
  snacks: Array<Snack>;
  twitterUsername?: Maybe<Scalars['String']>;
  username: Scalars['String'];
  /** @deprecated No longer supported */
  wasLegacy?: Maybe<Scalars['Boolean']>;
};


/** Represents a human (not robot) actor. */
export type UserActivityTimelineProjectActivitiesArgs = {
  createdBefore?: Maybe<Scalars['DateTime']>;
  filterTypes?: Maybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/** Represents a human (not robot) actor. */
export type UserAppsArgs = {
  includeUnpublished?: Maybe<Scalars['Boolean']>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents a human (not robot) actor. */
export type UserFeatureGatesArgs = {
  filter?: Maybe<Array<Scalars['String']>>;
};


/** Represents a human (not robot) actor. */
export type UserLikesArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents a human (not robot) actor. */
export type UserSnacksArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type UserDataInput = {
  appetizeCode?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  firstName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  githubUsername?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  industry?: Maybe<Scalars['String']>;
  isEmailUnsubscribed?: Maybe<Scalars['Boolean']>;
  isLegacy?: Maybe<Scalars['Boolean']>;
  isOnboarded?: Maybe<Scalars['Boolean']>;
  lastName?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  profilePhoto?: Maybe<Scalars['String']>;
  twitterUsername?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
  wasLegacy?: Maybe<Scalars['Boolean']>;
};

/** An pending invitation sent to an email granting membership on an Account. */
export type UserInvitation = {
  __typename?: 'UserInvitation';
  accountName: Scalars['String'];
  created: Scalars['DateTime'];
  /** Email to which this invitation was sent */
  email: Scalars['String'];
  id: Scalars['ID'];
  /** Account permissions to be granted upon acceptance of this invitation */
  permissions: Array<Permission>;
  /** Role to be granted upon acceptance of this invitation */
  role: Role;
};

export type UserInvitationMutation = {
  __typename?: 'UserInvitationMutation';
  /** Accept UserInvitation by ID. Viewer must have matching email and email must be verified. */
  acceptUserInvitationAsViewer: AcceptUserInvitationResult;
  /**
   * Accept UserInvitation by token. Note that the viewer's email is not required to match
   * the email on the invitation. If viewer's email does match that of the invitation,
   * their email will also be verified.
   */
  acceptUserInvitationByTokenAsViewer: AcceptUserInvitationResult;
  /**
   * Create a UserInvitation for an email that when accepted grants
   * the specified permissions on an Account
   */
  createUserInvitationForAccount: UserInvitation;
  /** Rescind UserInvitation by ID */
  deleteUserInvitation: RescindUserInvitationResult;
  /**
   * Delete UserInvitation by token. Note that the viewer's email is not required to match
   * the email on the invitation.
   */
  deleteUserInvitationByToken: RescindUserInvitationResult;
  /** Re-send UserInivitation by ID */
  resendUserInvitation: UserInvitation;
};


export type UserInvitationMutationAcceptUserInvitationAsViewerArgs = {
  id: Scalars['ID'];
};


export type UserInvitationMutationAcceptUserInvitationByTokenAsViewerArgs = {
  token: Scalars['ID'];
};


export type UserInvitationMutationCreateUserInvitationForAccountArgs = {
  accountID: Scalars['ID'];
  email: Scalars['String'];
  permissions: Array<Maybe<Permission>>;
};


export type UserInvitationMutationDeleteUserInvitationArgs = {
  id: Scalars['ID'];
};


export type UserInvitationMutationDeleteUserInvitationByTokenArgs = {
  token: Scalars['ID'];
};


export type UserInvitationMutationResendUserInvitationArgs = {
  id: Scalars['ID'];
};

/** Publicly visible data for a UserInvitation. */
export type UserInvitationPublicData = {
  __typename?: 'UserInvitationPublicData';
  accountName: Scalars['String'];
  created: Scalars['DateTime'];
  email: Scalars['String'];
  /** Email to which this invitation was sent */
  id: Scalars['ID'];
};

export type UserInvitationPublicDataQuery = {
  __typename?: 'UserInvitationPublicDataQuery';
  /** Get UserInvitationPublicData by token */
  byToken: UserInvitationPublicData;
};


export type UserInvitationPublicDataQueryByTokenArgs = {
  token: Scalars['ID'];
};

export type UserPermission = {
  __typename?: 'UserPermission';
  actor: Actor;
  permissions: Array<Permission>;
  role?: Maybe<Role>;
  /** @deprecated User type is deprecated */
  user?: Maybe<User>;
};

export type UserQuery = {
  __typename?: 'UserQuery';
  /** Query a User by ID */
  byId: User;
  /** Query a User by username */
  byUsername: User;
};


export type UserQueryByIdArgs = {
  userId: Scalars['String'];
};


export type UserQueryByUsernameArgs = {
  username: Scalars['String'];
};

/** A second factor device belonging to a User */
export type UserSecondFactorDevice = {
  __typename?: 'UserSecondFactorDevice';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  isCertified: Scalars['Boolean'];
  isPrimary: Scalars['Boolean'];
  method: SecondFactorMethod;
  name: Scalars['String'];
  smsPhoneNumber?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
  user: User;
};

export type Webhook = {
  __typename?: 'Webhook';
  appId: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  event: WebhookType;
  id: Scalars['ID'];
  updatedAt: Scalars['DateTime'];
  url: Scalars['String'];
};

export type WebhookFilter = {
  event?: Maybe<WebhookType>;
};

export type WebhookInput = {
  event: WebhookType;
  secret: Scalars['String'];
  url: Scalars['String'];
};

export type WebhookMutation = {
  __typename?: 'WebhookMutation';
  /** Create a Webhook */
  createWebhook: Webhook;
  /** Delete a Webhook */
  deleteWebhook: DeleteWebhookResult;
  /** Update a Webhook */
  updateWebhook: Webhook;
};


export type WebhookMutationCreateWebhookArgs = {
  appId: Scalars['String'];
  webhookInput: WebhookInput;
};


export type WebhookMutationDeleteWebhookArgs = {
  webhookId: Scalars['ID'];
};


export type WebhookMutationUpdateWebhookArgs = {
  webhookId: Scalars['ID'];
  webhookInput: WebhookInput;
};

export type WebhookQuery = {
  __typename?: 'WebhookQuery';
  byId: Webhook;
};


export type WebhookQueryByIdArgs = {
  id: Scalars['ID'];
};

export enum WebhookType {
  Build = 'BUILD'
}

export type DeleteAndroidAppBuildCredentialsResult = {
  __typename?: 'deleteAndroidAppBuildCredentialsResult';
  id: Scalars['ID'];
};

export type DeleteAndroidFcmResult = {
  __typename?: 'deleteAndroidFcmResult';
  id: Scalars['ID'];
};

export type DeleteApplePushKeyResult = {
  __typename?: 'deleteApplePushKeyResult';
  id: Scalars['ID'];
};

export type Home_AccountDataQueryVariables = Exact<{
  accountName: Scalars['String'];
  appLimit: Scalars['Int'];
  snackLimit: Scalars['Int'];
}>;


export type Home_AccountDataQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: Maybe<string>, packageName: string, username: string, description: string, sdkVersion: string, published: boolean, lastPublishedTime: any, privacy: string }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } } };

export type Home_ProfileData2QueryVariables = Exact<{
  appLimit: Scalars['Int'];
  snackLimit: Scalars['Int'];
}>;


export type Home_ProfileData2Query = { __typename?: 'RootQuery', me?: Maybe<{ __typename?: 'User', id: string, username: string, firstName?: Maybe<string>, lastName?: Maybe<string>, profilePhoto: string, appCount: number, accounts: Array<{ __typename?: 'Account', id: string, name: string }>, apps: Array<{ __typename?: 'App', id: string, description: string, fullName: string, iconUrl?: Maybe<string>, lastPublishedTime: any, name: string, packageName: string, username: string, sdkVersion: string, privacy: string, published: boolean }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> }> };

export type Home_MyAppsQueryVariables = Exact<{
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_MyAppsQuery = { __typename?: 'RootQuery', me?: Maybe<{ __typename?: 'User', id: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, description: string, fullName: string, iconUrl?: Maybe<string>, lastPublishedTime: any, name: string, username: string, packageName: string, privacy: string, sdkVersion: string, published: boolean }> }> };

export type Home_ProfileSnacksQueryVariables = Exact<{
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_ProfileSnacksQuery = { __typename?: 'RootQuery', me?: Maybe<{ __typename?: 'User', id: string, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> }> };

export type WebContainerProjectPage_QueryQueryVariables = Exact<{
  appId: Scalars['String'];
  platform: AppPlatform;
  runtimeVersions: Array<Scalars['String']> | Scalars['String'];
}>;


export type WebContainerProjectPage_QueryQuery = { __typename?: 'RootQuery', app?: Maybe<{ __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, slug: string, fullName: string, username: string, published: boolean, description: string, githubUrl?: Maybe<string>, playStoreUrl?: Maybe<string>, appStoreUrl?: Maybe<string>, sdkVersion: string, iconUrl?: Maybe<string>, privacy: string, icon?: Maybe<{ __typename?: 'AppIcon', url: string }>, latestReleaseForReleaseChannel?: Maybe<{ __typename?: 'AppRelease', sdkVersion: string, runtimeVersion?: Maybe<string> }>, updateBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: Maybe<string>, createdAt: any, runtimeVersion: string, platform: string, manifestPermalink: string }> }> } }> };

export type Home_AccountAppsQueryVariables = Exact<{
  accountName: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_AccountAppsQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: Maybe<string>, packageName: string, username: string, description: string, lastPublishedTime: any, sdkVersion: string, published: boolean, privacy: string }> } } };

export type Home_AccountSnacksQueryVariables = Exact<{
  accountName: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_AccountSnacksQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } } };

export type Home_ViewerUsernameQueryVariables = Exact<{ [key: string]: never; }>;


export type Home_ViewerUsernameQuery = { __typename?: 'RootQuery', me?: Maybe<{ __typename?: 'User', id: string, username: string }> };


export const Home_AccountDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Home_AccountData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appLimit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"snackLimit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"accountName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"appCount"}},{"kind":"Field","name":{"kind":"Name","value":"apps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"packageName"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sdkVersion"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"lastPublishedTime"}},{"kind":"Field","name":{"kind":"Name","value":"privacy"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snacks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"snackLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isDraft"}}]}}]}}]}}]}}]} as unknown as DocumentNode<Home_AccountDataQuery, Home_AccountDataQueryVariables>;
export const Home_ProfileData2Document = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Home_ProfileData2"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appLimit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"snackLimit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"profilePhoto"}},{"kind":"Field","name":{"kind":"Name","value":"accounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"appCount"}},{"kind":"Field","name":{"kind":"Name","value":"apps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastPublishedTime"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"packageName"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"sdkVersion"}},{"kind":"Field","name":{"kind":"Name","value":"privacy"}},{"kind":"Field","name":{"kind":"Name","value":"published"}}]}},{"kind":"Field","name":{"kind":"Name","value":"snacks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"snackLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isDraft"}}]}}]}}]}}]} as unknown as DocumentNode<Home_ProfileData2Query, Home_ProfileData2QueryVariables>;
export const Home_MyAppsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Home_MyApps"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"appCount"}},{"kind":"Field","name":{"kind":"Name","value":"apps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastPublishedTime"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"packageName"}},{"kind":"Field","name":{"kind":"Name","value":"privacy"}},{"kind":"Field","name":{"kind":"Name","value":"sdkVersion"}},{"kind":"Field","name":{"kind":"Name","value":"published"}}]}}]}}]}}]} as unknown as DocumentNode<Home_MyAppsQuery, Home_MyAppsQueryVariables>;
export const Home_ProfileSnacksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Home_ProfileSnacks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"snacks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isDraft"}}]}}]}}]}}]} as unknown as DocumentNode<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>;
export const WebContainerProjectPage_QueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebContainerProjectPage_Query"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"platform"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppPlatform"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runtimeVersions"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"appId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"githubUrl"}},{"kind":"Field","name":{"kind":"Name","value":"playStoreUrl"}},{"kind":"Field","name":{"kind":"Name","value":"appStoreUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sdkVersion"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"privacy"}},{"kind":"Field","name":{"kind":"Name","value":"icon"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestReleaseForReleaseChannel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"platform"},"value":{"kind":"Variable","name":{"kind":"Name","value":"platform"}}},{"kind":"Argument","name":{"kind":"Name","value":"releaseChannel"},"value":{"kind":"StringValue","value":"default","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sdkVersion"}},{"kind":"Field","name":{"kind":"Name","value":"runtimeVersion"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updateBranches"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"IntValue","value":"0"}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"platform"},"value":{"kind":"Variable","name":{"kind":"Name","value":"platform"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"runtimeVersions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runtimeVersions"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"runtimeVersion"}},{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"manifestPermalink"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<WebContainerProjectPage_QueryQuery, WebContainerProjectPage_QueryQueryVariables>;
export const Home_AccountAppsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Home_AccountApps"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"accountName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"appCount"}},{"kind":"Field","name":{"kind":"Name","value":"apps"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"packageName"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lastPublishedTime"}},{"kind":"Field","name":{"kind":"Name","value":"sdkVersion"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"privacy"}}]}}]}}]}}]}}]} as unknown as DocumentNode<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>;
export const Home_AccountSnacksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Home_AccountSnacks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"accountName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"snacks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isDraft"}}]}}]}}]}}]}}]} as unknown as DocumentNode<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>;
export const Home_ViewerUsernameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Home_ViewerUsername"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]} as unknown as DocumentNode<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>;