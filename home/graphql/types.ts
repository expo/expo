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
  id: Scalars['ID'];
  visibleTokenPrefix: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  revokedAt?: Maybe<Scalars['DateTime']>;
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  owner: Actor;
  note?: Maybe<Scalars['String']>;
};

export type AccessTokenMutation = {
  __typename?: 'AccessTokenMutation';
  /** Create an AccessToken for an Actor */
  createAccessToken: CreateAccessTokenResponse;
  /** Revoke an AccessToken */
  setAccessTokenRevoked: AccessToken;
  /** Delete an AccessToken */
  deleteAccessToken: DeleteAccessTokenResult;
};


export type AccessTokenMutationCreateAccessTokenArgs = {
  createAccessTokenData: CreateAccessTokenInput;
};


export type AccessTokenMutationSetAccessTokenRevokedArgs = {
  id: Scalars['ID'];
  revoked?: Maybe<Scalars['Boolean']>;
};


export type AccessTokenMutationDeleteAccessTokenArgs = {
  id: Scalars['ID'];
};

/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type Account = {
  __typename?: 'Account';
  id: Scalars['ID'];
  name: Scalars['String'];
  isCurrent: Scalars['Boolean'];
  pushSecurityEnabled: Scalars['Boolean'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  /** Offers set on this account */
  offers?: Maybe<Array<Offer>>;
  /** Snacks associated with this account */
  snacks: Array<Snack>;
  /** Apps associated with this account */
  apps: Array<App>;
  appCount: Scalars['Int'];
  /** Build Jobs associated with this account */
  buildJobs: Array<BuildJob>;
  /** (EAS Build) Builds associated with this account */
  builds: Array<Build>;
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
  /** Billing information */
  billing?: Maybe<Billing>;
  /** Subscription info visible to members that have VIEWER role */
  subscription?: Maybe<SubscriptionDetails>;
  /** iOS credentials for account */
  appleTeams: Array<AppleTeam>;
  appleAppIdentifiers: Array<AppleAppIdentifier>;
  appleDistributionCertificates: Array<AppleDistributionCertificate>;
  applePushKeys: Array<ApplePushKey>;
  appleProvisioningProfiles: Array<AppleProvisioningProfile>;
  appleDevices: Array<AppleDevice>;
  appleAppSpecificPasswords: Array<AppleAppSpecificPassword>;
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


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountSnacksArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppsArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  includeUnpublished?: Maybe<Scalars['Boolean']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildJobsArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  status?: Maybe<BuildJobStatus>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildsArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  status?: Maybe<BuildStatus>;
  platform?: Maybe<AppPlatform>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildOrBuildJobsArgs = {
  limit: Scalars['Int'];
  createdBefore?: Maybe<Scalars['DateTime']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountActivityTimelineProjectActivitiesArgs = {
  limit: Scalars['Int'];
  createdBefore?: Maybe<Scalars['DateTime']>;
  filterTypes?: Maybe<Array<ActivityTimelineProjectActivityType>>;
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
export type AccountAppleAppIdentifiersArgs = {
  bundleIdentifier?: Maybe<Scalars['String']>;
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
export type AccountAppleDevicesArgs = {
  identifier?: Maybe<Scalars['String']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountEnvironmentSecretsArgs = {
  filterNames?: Maybe<Array<Scalars['String']>>;
};

export type AccountDataInput = {
  name: Scalars['String'];
};

export type AccountMutation = {
  __typename?: 'AccountMutation';
  /** Add specified account Permissions for Actor. Actor must already have at least one permission on the account. */
  grantActorPermissions?: Maybe<Account>;
  /** Revoke specified Permissions for Actor. Actor must already have at least one permission on the account. */
  revokeActorPermissions?: Maybe<Account>;
  /** Add a subscription */
  subscribeToProduct?: Maybe<Account>;
  /** Cancels the active subscription */
  cancelSubscription?: Maybe<Account>;
  /**
   * Makes a one time purchase
   * @deprecated Build packs are no longer supported
   */
  buyProduct?: Maybe<Account>;
  /**
   * Update setting to purchase new build packs when the current one is consumed
   * @deprecated Build packs are no longer supported
   */
  setBuildAutoRenew?: Maybe<Account>;
  /** Set payment details */
  setPaymentSource?: Maybe<Account>;
  /** Extend offer to account */
  extendOffer?: Maybe<Account>;
  /** Send an email to primary account email */
  sendEmail?: Maybe<Account>;
  /** Require authorization to send push notifications for experiences owned by this account */
  setPushSecurityEnabled?: Maybe<Account>;
  /** Rename this account and the primary user's username if this account is a personal account */
  rename: Account;
};


export type AccountMutationGrantActorPermissionsArgs = {
  accountID: Scalars['ID'];
  actorID: Scalars['ID'];
  permissions?: Maybe<Array<Maybe<Permission>>>;
};


export type AccountMutationRevokeActorPermissionsArgs = {
  accountID: Scalars['ID'];
  actorID: Scalars['ID'];
  permissions?: Maybe<Array<Maybe<Permission>>>;
};


export type AccountMutationSubscribeToProductArgs = {
  accountName: Scalars['ID'];
  productId: Scalars['ID'];
  paymentSource: Scalars['ID'];
};


export type AccountMutationCancelSubscriptionArgs = {
  accountName: Scalars['ID'];
};


export type AccountMutationBuyProductArgs = {
  accountName: Scalars['ID'];
  productId: Scalars['ID'];
  paymentSource?: Maybe<Scalars['ID']>;
  autoRenew?: Maybe<Scalars['Boolean']>;
};


export type AccountMutationSetBuildAutoRenewArgs = {
  accountName: Scalars['ID'];
  autoRenew?: Maybe<Scalars['Boolean']>;
};


export type AccountMutationSetPaymentSourceArgs = {
  accountName: Scalars['ID'];
  paymentSource: Scalars['ID'];
};


export type AccountMutationExtendOfferArgs = {
  accountName: Scalars['ID'];
  offer: StandardOffer;
  suppressMessage?: Maybe<Scalars['Boolean']>;
};


export type AccountMutationSendEmailArgs = {
  accountName: Scalars['ID'];
  emailTemplate: EmailTemplate;
};


export type AccountMutationSetPushSecurityEnabledArgs = {
  accountID: Scalars['ID'];
  pushSecurityEnabled: Scalars['Boolean'];
};


export type AccountMutationRenameArgs = {
  accountID: Scalars['ID'];
  newName: Scalars['String'];
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
  id: Scalars['ID'];
  actor?: Maybe<Actor>;
  activityTimestamp: Scalars['DateTime'];
};

export enum ActivityTimelineProjectActivityType {
  BuildJob = 'BUILD_JOB',
  Build = 'BUILD',
  Update = 'UPDATE',
  Submission = 'SUBMISSION'
}

/** A user or robot that can authenticate with Expo services and be a member of accounts. */
export type Actor = {
  id: Scalars['ID'];
  firstName?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  isExpoAdmin: Scalars['Boolean'];
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
  email: Scalars['String'];
  tags?: Maybe<Array<MailchimpTag>>;
  audience?: Maybe<MailchimpAudience>;
};

export type AddUserPayload = {
  __typename?: 'AddUserPayload';
  id?: Maybe<Scalars['String']>;
  email_address?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  timestamp_signup?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<MailchimpTagPayload>>;
  list_id?: Maybe<Scalars['String']>;
};

export type Address = {
  __typename?: 'Address';
  line1?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
  zip?: Maybe<Scalars['String']>;
  country?: Maybe<Scalars['String']>;
};

export type AndroidAppBuildCredentials = {
  __typename?: 'AndroidAppBuildCredentials';
  id: Scalars['ID'];
  name: Scalars['String'];
  androidKeystore?: Maybe<AndroidKeystore>;
  isDefault: Scalars['Boolean'];
  isLegacy: Scalars['Boolean'];
};

/** @isDefault: if set, these build credentials will become the default for the Android app. All other build credentials will have their default status set to false. */
export type AndroidAppBuildCredentialsInput = {
  isDefault: Scalars['Boolean'];
  name: Scalars['String'];
  keystoreId: Scalars['ID'];
};

export type AndroidAppBuildCredentialsMutation = {
  __typename?: 'AndroidAppBuildCredentialsMutation';
  /** Create a set of build credentials for an Android app */
  createAndroidAppBuildCredentials?: Maybe<AndroidAppBuildCredentials>;
  /** delete a set of build credentials for an Android app */
  deleteAndroidAppBuildCredentials?: Maybe<DeleteAndroidAppBuildCredentialsResult>;
  /** Set the name of a set of build credentials to be used for an Android app */
  setName?: Maybe<AndroidAppBuildCredentials>;
  /** Set the keystore to be used for an Android app */
  setKeystore?: Maybe<AndroidAppBuildCredentials>;
  /** Set the build credentials to be the default for the Android app */
  setDefault?: Maybe<AndroidAppBuildCredentials>;
};


export type AndroidAppBuildCredentialsMutationCreateAndroidAppBuildCredentialsArgs = {
  androidAppBuildCredentialsInput: AndroidAppBuildCredentialsInput;
  androidAppCredentialsId: Scalars['ID'];
};


export type AndroidAppBuildCredentialsMutationDeleteAndroidAppBuildCredentialsArgs = {
  id: Scalars['ID'];
};


export type AndroidAppBuildCredentialsMutationSetNameArgs = {
  id: Scalars['ID'];
  name: Scalars['String'];
};


export type AndroidAppBuildCredentialsMutationSetKeystoreArgs = {
  id: Scalars['ID'];
  keystoreId: Scalars['ID'];
};


export type AndroidAppBuildCredentialsMutationSetDefaultArgs = {
  id: Scalars['ID'];
  isDefault: Scalars['Boolean'];
};

export type AndroidAppCredentials = {
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

export type AndroidAppCredentialsFilter = {
  legacyOnly?: Maybe<Scalars['Boolean']>;
  applicationIdentifier?: Maybe<Scalars['String']>;
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
  id: Scalars['ID'];
  fcmId: Scalars['ID'];
};

export enum AndroidBuildType {
  Apk = 'APK',
  AppBundle = 'APP_BUNDLE',
  DevelopmentClient = 'DEVELOPMENT_CLIENT'
}

export type AndroidBuilderEnvironmentInput = {
  image?: Maybe<Scalars['String']>;
  node?: Maybe<Scalars['String']>;
  yarn?: Maybe<Scalars['String']>;
  ndk?: Maybe<Scalars['String']>;
  expoCli?: Maybe<Scalars['String']>;
  env?: Maybe<Scalars['JSONObject']>;
};

export type AndroidFcm = {
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
  androidFcmInput: AndroidFcmInput;
  accountId: Scalars['ID'];
};


export type AndroidFcmMutationDeleteAndroidFcmArgs = {
  id: Scalars['ID'];
};

export enum AndroidFcmVersion {
  Legacy = 'LEGACY',
  V1 = 'V1'
}

export type AndroidGenericJobInput = {
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  updates?: Maybe<BuildUpdatesInput>;
  secrets?: Maybe<AndroidJobSecretsInput>;
  builderEnvironment?: Maybe<AndroidBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  gradleCommand?: Maybe<Scalars['String']>;
  artifactPath?: Maybe<Scalars['String']>;
};

export type AndroidJobBuildCredentialsInput = {
  keystore: AndroidJobKeystoreInput;
};

export type AndroidJobInput = {
  type: BuildWorkflow;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  updates?: Maybe<BuildUpdatesInput>;
  secrets?: Maybe<AndroidJobSecretsInput>;
  builderEnvironment?: Maybe<AndroidBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  gradleCommand?: Maybe<Scalars['String']>;
  artifactPath?: Maybe<Scalars['String']>;
  buildType?: Maybe<AndroidBuildType>;
  username?: Maybe<Scalars['String']>;
};

export type AndroidJobKeystoreInput = {
  dataBase64: Scalars['String'];
  keystorePassword: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: Maybe<Scalars['String']>;
};

export type AndroidJobSecretsInput = {
  buildCredentials?: Maybe<AndroidJobBuildCredentialsInput>;
  environmentSecrets?: Maybe<Scalars['JSONObject']>;
};

export type AndroidKeystore = {
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

export type AndroidKeystoreInput = {
  base64EncodedKeystore: Scalars['String'];
  keystorePassword: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: Maybe<Scalars['String']>;
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
  androidKeystoreInput: AndroidKeystoreInput;
  accountId: Scalars['ID'];
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
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  updates?: Maybe<BuildUpdatesInput>;
  secrets?: Maybe<AndroidJobSecretsInput>;
  builderEnvironment?: Maybe<AndroidBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  buildType?: Maybe<AndroidManagedBuildType>;
  username?: Maybe<Scalars['String']>;
};

export type AndroidSubmissionConfig = {
  __typename?: 'AndroidSubmissionConfig';
  applicationIdentifier: Scalars['String'];
  archiveType: SubmissionAndroidArchiveType;
  track: SubmissionAndroidTrack;
  releaseStatus?: Maybe<SubmissionAndroidReleaseStatus>;
};

export type AndroidSubmissionConfigInput = {
  googleServiceAccountKeyId?: Maybe<Scalars['String']>;
  googleServiceAccountKeyJson?: Maybe<Scalars['String']>;
  archiveUrl: Scalars['String'];
  archiveType: SubmissionAndroidArchiveType;
  applicationIdentifier: Scalars['String'];
  track: SubmissionAndroidTrack;
  releaseStatus?: Maybe<SubmissionAndroidReleaseStatus>;
  changesNotSentForReview?: Maybe<Scalars['Boolean']>;
};

/** Represents an Exponent App (or Experience in legacy terms) */
export type App = Project & {
  __typename?: 'App';
  id: Scalars['ID'];
  name: Scalars['String'];
  fullName: Scalars['String'];
  description: Scalars['String'];
  slug: Scalars['String'];
  updated: Scalars['DateTime'];
  published: Scalars['Boolean'];
  ownerAccount: Account;
  githubUrl?: Maybe<Scalars['String']>;
  playStoreUrl?: Maybe<Scalars['String']>;
  appStoreUrl?: Maybe<Scalars['String']>;
  icon?: Maybe<AppIcon>;
  sdkVersion: Scalars['String'];
  isDeprecated: Scalars['Boolean'];
  privacySetting: AppPrivacy;
  latestReleaseId: Scalars['ID'];
  pushSecurityEnabled: Scalars['Boolean'];
  /** (EAS Build) Builds associated with this app */
  builds: Array<Build>;
  buildJobs: Array<BuildJob>;
  /**
   * Coalesced Build (EAS) or BuildJob (Classic) items for this app.
   * @deprecated Use activityTimelineProjectActivities with filterTypes instead
   */
  buildOrBuildJobs: Array<BuildOrBuildJob>;
  /** EAS Submissions associated with this app */
  submissions: Array<Submission>;
  /** Deployments associated with this app */
  deployments: Array<Deployment>;
  deployment?: Maybe<Deployment>;
  /** iOS app credentials for the project */
  iosAppCredentials: Array<IosAppCredentials>;
  /** Android app credentials for the project */
  androidAppCredentials: Array<AndroidAppCredentials>;
  /** EAS channels owned by an app */
  updateChannels: Array<UpdateChannel>;
  /** get an EAS channel owned by the app by name */
  updateChannelByName?: Maybe<UpdateChannel>;
  /** EAS branches owned by an app */
  updateBranches: Array<UpdateBranch>;
  /** get an EAS branch owned by the app by name */
  updateBranchByName?: Maybe<UpdateBranch>;
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


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildsArgs = {
  filter?: Maybe<BuildFilter>;
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  status?: Maybe<BuildStatus>;
  platform?: Maybe<AppPlatform>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildJobsArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  status?: Maybe<BuildStatus>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildOrBuildJobsArgs = {
  limit: Scalars['Int'];
  createdBefore?: Maybe<Scalars['DateTime']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppSubmissionsArgs = {
  filter: SubmissionFilter;
  offset: Scalars['Int'];
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentsArgs = {
  limit: Scalars['Int'];
  mostRecentlyUpdatedAt?: Maybe<Scalars['DateTime']>;
  options?: Maybe<DeploymentOptions>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentArgs = {
  channel: Scalars['String'];
  runtimeVersion: Scalars['String'];
  options?: Maybe<DeploymentOptions>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppIosAppCredentialsArgs = {
  filter?: Maybe<IosAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppAndroidAppCredentialsArgs = {
  filter?: Maybe<AndroidAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateChannelsArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateChannelByNameArgs = {
  name: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateBranchesArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdateBranchByNameArgs = {
  name: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppActivityTimelineProjectActivitiesArgs = {
  limit: Scalars['Int'];
  createdBefore?: Maybe<Scalars['DateTime']>;
  filterTypes?: Maybe<Array<ActivityTimelineProjectActivityType>>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppEnvironmentSecretsArgs = {
  filterNames?: Maybe<Array<Scalars['String']>>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWebhooksArgs = {
  filter?: Maybe<WebhookFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppLikedByArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppReleasesArgs = {
  platform: AppPlatform;
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppLatestReleaseForReleaseChannelArgs = {
  platform: AppPlatform;
  releaseChannel: Scalars['String'];
};

export type AppDataInput = {
  id: Scalars['ID'];
  privacy?: Maybe<Scalars['String']>;
};

export type AppIcon = {
  __typename?: 'AppIcon';
  url: Scalars['String'];
  primaryColor?: Maybe<Scalars['String']>;
  originalUrl: Scalars['String'];
  /** Nullable color palette of the app icon. If null, color palette couldn't be retrieved from external service (imgix) */
  colorPalette?: Maybe<Scalars['JSON']>;
};

export type AppInput = {
  accountId: Scalars['ID'];
  projectName: Scalars['String'];
  privacy: AppPrivacy;
};

export type AppMutation = {
  __typename?: 'AppMutation';
  /** Create an unpublished app */
  createApp: App;
  /** @deprecated Field no longer supported */
  grantAccess?: Maybe<App>;
  /** Require api token to send push notifs for experience */
  setPushSecurityEnabled?: Maybe<App>;
};


export type AppMutationCreateAppArgs = {
  appInput: AppInput;
};


export type AppMutationGrantAccessArgs = {
  toUser: Scalars['ID'];
  accessLevel?: Maybe<Scalars['String']>;
};


export type AppMutationSetPushSecurityEnabledArgs = {
  appId: Scalars['ID'];
  pushSecurityEnabled: Scalars['Boolean'];
};

export enum AppPlatform {
  Ios = 'IOS',
  Android = 'ANDROID'
}

export enum AppPrivacy {
  Public = 'PUBLIC',
  Unlisted = 'UNLISTED',
  Hidden = 'HIDDEN'
}

export type AppQuery = {
  __typename?: 'AppQuery';
  /** Look up app by app id */
  byId: App;
  byFullName: App;
  /** Public apps in the app directory */
  all: Array<App>;
};


export type AppQueryByIdArgs = {
  appId: Scalars['String'];
};


export type AppQueryByFullNameArgs = {
  fullName: Scalars['String'];
};


export type AppQueryAllArgs = {
  filter: AppsFilter;
  sort: AppSort;
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
};

export type AppRelease = {
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

export enum AppSort {
  /** Sort by recently published */
  RecentlyPublished = 'RECENTLY_PUBLISHED',
  /** Sort by highest trendScore */
  Viewed = 'VIEWED'
}

export type AppleAppIdentifier = {
  __typename?: 'AppleAppIdentifier';
  id: Scalars['ID'];
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  bundleIdentifier: Scalars['String'];
  parentAppleAppIdentifier?: Maybe<AppleAppIdentifier>;
};

export type AppleAppIdentifierInput = {
  bundleIdentifier: Scalars['String'];
  appleTeamId?: Maybe<Scalars['ID']>;
  parentAppleAppId?: Maybe<Scalars['ID']>;
};

export type AppleAppIdentifierMutation = {
  __typename?: 'AppleAppIdentifierMutation';
  /** Create an Identifier for an iOS App */
  createAppleAppIdentifier?: Maybe<AppleAppIdentifier>;
};


export type AppleAppIdentifierMutationCreateAppleAppIdentifierArgs = {
  appleAppIdentifierInput: AppleAppIdentifierInput;
  accountId: Scalars['ID'];
};

export type AppleAppSpecificPassword = {
  __typename?: 'AppleAppSpecificPassword';
  id: Scalars['ID'];
  account: Account;
  appleIdUsername: Scalars['String'];
  passwordLabel?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

export type AppleAppSpecificPasswordInput = {
  appleIdUsername: Scalars['String'];
  passwordLabel?: Maybe<Scalars['String']>;
  appSpecificPassword: Scalars['String'];
};

export type AppleAppSpecificPasswordMutation = {
  __typename?: 'AppleAppSpecificPasswordMutation';
  /** Create an App Specific Password for an Apple User Account */
  createAppleAppSpecificPassword: AppleAppSpecificPassword;
};


export type AppleAppSpecificPasswordMutationCreateAppleAppSpecificPasswordArgs = {
  appleAppSpecificPasswordInput: AppleAppSpecificPasswordInput;
  accountId: Scalars['ID'];
};

export type AppleDevice = {
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

export enum AppleDeviceClass {
  Ipad = 'IPAD',
  Iphone = 'IPHONE'
}

export type AppleDeviceInput = {
  appleTeamId: Scalars['ID'];
  identifier: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  model?: Maybe<Scalars['String']>;
  deviceClass?: Maybe<AppleDeviceClass>;
  softwareVersion?: Maybe<Scalars['String']>;
  enabled?: Maybe<Scalars['Boolean']>;
};

export type AppleDeviceMutation = {
  __typename?: 'AppleDeviceMutation';
  /** Create an Apple Device */
  createAppleDevice: AppleDevice;
  /** Delete an Apple Device */
  deleteAppleDevice: DeleteAppleDeviceResult;
};


export type AppleDeviceMutationCreateAppleDeviceArgs = {
  appleDeviceInput: AppleDeviceInput;
  accountId: Scalars['ID'];
};


export type AppleDeviceMutationDeleteAppleDeviceArgs = {
  id: Scalars['ID'];
};

export type AppleDeviceRegistrationRequest = {
  __typename?: 'AppleDeviceRegistrationRequest';
  id: Scalars['ID'];
  account: Account;
  appleTeam: AppleTeam;
};

export type AppleDeviceRegistrationRequestMutation = {
  __typename?: 'AppleDeviceRegistrationRequestMutation';
  /** Create an Apple Device registration request */
  createAppleDeviceRegistrationRequest: AppleDeviceRegistrationRequest;
};


export type AppleDeviceRegistrationRequestMutationCreateAppleDeviceRegistrationRequestArgs = {
  appleTeamId: Scalars['ID'];
  accountId: Scalars['ID'];
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

export type AppleDistributionCertificateInput = {
  certP12: Scalars['String'];
  certPassword: Scalars['String'];
  certPrivateSigningKey?: Maybe<Scalars['String']>;
  developerPortalIdentifier?: Maybe<Scalars['String']>;
  appleTeamId?: Maybe<Scalars['ID']>;
};

export type AppleDistributionCertificateMutation = {
  __typename?: 'AppleDistributionCertificateMutation';
  /** Create a Distribution Certificate */
  createAppleDistributionCertificate?: Maybe<AppleDistributionCertificate>;
  /** Delete a Distribution Certificate */
  deleteAppleDistributionCertificate: DeleteAppleDistributionCertificateResult;
};


export type AppleDistributionCertificateMutationCreateAppleDistributionCertificateArgs = {
  appleDistributionCertificateInput: AppleDistributionCertificateInput;
  accountId: Scalars['ID'];
};


export type AppleDistributionCertificateMutationDeleteAppleDistributionCertificateArgs = {
  id: Scalars['ID'];
};

export type AppleProvisioningProfile = {
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

export type AppleProvisioningProfileInput = {
  appleProvisioningProfile: Scalars['String'];
  developerPortalIdentifier?: Maybe<Scalars['String']>;
};

export type AppleProvisioningProfileMutation = {
  __typename?: 'AppleProvisioningProfileMutation';
  /** Create a Provisioning Profile */
  createAppleProvisioningProfile: AppleProvisioningProfile;
  /** Update a Provisioning Profile */
  updateAppleProvisioningProfile: AppleProvisioningProfile;
  /** Delete a Provisioning Profile */
  deleteAppleProvisioningProfile: DeleteAppleProvisioningProfileResult;
  /** Delete Provisioning Profiles */
  deleteAppleProvisioningProfiles: Array<DeleteAppleProvisioningProfileResult>;
};


export type AppleProvisioningProfileMutationCreateAppleProvisioningProfileArgs = {
  appleProvisioningProfileInput: AppleProvisioningProfileInput;
  accountId: Scalars['ID'];
  appleAppIdentifierId: Scalars['ID'];
};


export type AppleProvisioningProfileMutationUpdateAppleProvisioningProfileArgs = {
  id: Scalars['ID'];
  appleProvisioningProfileInput: AppleProvisioningProfileInput;
};


export type AppleProvisioningProfileMutationDeleteAppleProvisioningProfileArgs = {
  id: Scalars['ID'];
};


export type AppleProvisioningProfileMutationDeleteAppleProvisioningProfilesArgs = {
  ids: Array<Scalars['ID']>;
};

export type ApplePushKey = {
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

export type ApplePushKeyInput = {
  keyP8: Scalars['String'];
  keyIdentifier: Scalars['String'];
  appleTeamId?: Maybe<Scalars['ID']>;
};

export type ApplePushKeyMutation = {
  __typename?: 'ApplePushKeyMutation';
  /** Create an Apple Push Notification key */
  createApplePushKey: ApplePushKey;
  /** Delete an Apple Push Notification key */
  deleteApplePushKey: DeleteApplePushKeyResult;
};


export type ApplePushKeyMutationCreateApplePushKeyArgs = {
  applePushKeyInput: ApplePushKeyInput;
  accountId: Scalars['ID'];
};


export type ApplePushKeyMutationDeleteApplePushKeyArgs = {
  id: Scalars['ID'];
};

export type AppleTeam = {
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
  appleTeamInput: AppleTeamInput;
  accountId: Scalars['ID'];
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
  Exists = 'EXISTS',
  DoesNotExist = 'DOES_NOT_EXIST'
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
  payment?: Maybe<PaymentDetails>;
  subscription?: Maybe<SubscriptionDetails>;
  /** History of invoices */
  charges?: Maybe<Array<Maybe<Charge>>>;
};

/** Represents an EAS Build */
export type Build = ActivityTimelineProjectActivity & BuildOrBuildJob & {
  __typename?: 'Build';
  id: Scalars['ID'];
  actor?: Maybe<Actor>;
  activityTimestamp: Scalars['DateTime'];
  project: Project;
  /** @deprecated User type is deprecated */
  initiatingUser?: Maybe<User>;
  initiatingActor?: Maybe<Actor>;
  cancelingActor?: Maybe<Actor>;
  artifacts?: Maybe<BuildArtifacts>;
  logFiles: Array<Scalars['String']>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  status: BuildStatus;
  expirationDate?: Maybe<Scalars['DateTime']>;
  platform: AppPlatform;
  appVersion?: Maybe<Scalars['String']>;
  appBuildVersion?: Maybe<Scalars['String']>;
  sdkVersion?: Maybe<Scalars['String']>;
  runtimeVersion?: Maybe<Scalars['String']>;
  releaseChannel?: Maybe<Scalars['String']>;
  channel?: Maybe<Scalars['String']>;
  metrics?: Maybe<BuildMetrics>;
  distribution?: Maybe<DistributionType>;
  iosEnterpriseProvisioning?: Maybe<BuildIosEnterpriseProvisioning>;
  buildProfile?: Maybe<Scalars['String']>;
  gitCommitHash?: Maybe<Scalars['String']>;
  error?: Maybe<BuildError>;
  submissions: Array<Submission>;
};

export type BuildArtifact = {
  __typename?: 'BuildArtifact';
  url: Scalars['String'];
  manifestPlistUrl?: Maybe<Scalars['String']>;
};

export type BuildArtifacts = {
  __typename?: 'BuildArtifacts';
  buildUrl?: Maybe<Scalars['String']>;
  xcodeBuildLogsUrl?: Maybe<Scalars['String']>;
};

export type BuildCacheInput = {
  disabled?: Maybe<Scalars['Boolean']>;
  clear?: Maybe<Scalars['Boolean']>;
  key?: Maybe<Scalars['String']>;
  cacheDefaultPaths?: Maybe<Scalars['Boolean']>;
  customPaths?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export enum BuildCredentialsSource {
  Local = 'LOCAL',
  Remote = 'REMOTE'
}

export type BuildError = {
  __typename?: 'BuildError';
  errorCode: Scalars['String'];
  message: Scalars['String'];
  docsUrl?: Maybe<Scalars['String']>;
};

export type BuildFilter = {
  platform?: Maybe<AppPlatform>;
  status?: Maybe<BuildStatus>;
  distribution?: Maybe<DistributionType>;
  channel?: Maybe<Scalars['String']>;
  appVersion?: Maybe<Scalars['String']>;
  appBuildVersion?: Maybe<Scalars['String']>;
  sdkVersion?: Maybe<Scalars['String']>;
  runtimeVersion?: Maybe<Scalars['String']>;
  appIdentifier?: Maybe<Scalars['String']>;
  buildProfile?: Maybe<Scalars['String']>;
  gitCommitHash?: Maybe<Scalars['String']>;
};

export enum BuildIosEnterpriseProvisioning {
  Adhoc = 'ADHOC',
  Universal = 'UNIVERSAL'
}

/** Represents an Standalone App build job */
export type BuildJob = ActivityTimelineProjectActivity & BuildOrBuildJob & {
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

export enum BuildJobLogsFormat {
  Raw = 'RAW',
  Json = 'JSON'
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
  status?: Maybe<BuildJobStatus>;
  username?: Maybe<Scalars['String']>;
  experienceSlug?: Maybe<Scalars['String']>;
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  showAdminView?: Maybe<Scalars['Boolean']>;
};


export type BuildJobQueryByIdArgs = {
  buildId: Scalars['ID'];
};

export enum BuildJobStatus {
  Pending = 'PENDING',
  Started = 'STARTED',
  InProgress = 'IN_PROGRESS',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  SentToQueue = 'SENT_TO_QUEUE'
}

export type BuildLogs = {
  __typename?: 'BuildLogs';
  url?: Maybe<Scalars['String']>;
  format?: Maybe<BuildJobLogsFormat>;
};

export type BuildMetadataInput = {
  trackingContext?: Maybe<Scalars['JSONObject']>;
  appVersion?: Maybe<Scalars['String']>;
  appBuildVersion?: Maybe<Scalars['String']>;
  cliVersion?: Maybe<Scalars['String']>;
  workflow?: Maybe<BuildWorkflow>;
  credentialsSource?: Maybe<BuildCredentialsSource>;
  sdkVersion?: Maybe<Scalars['String']>;
  runtimeVersion?: Maybe<Scalars['String']>;
  releaseChannel?: Maybe<Scalars['String']>;
  channel?: Maybe<Scalars['String']>;
  distribution?: Maybe<DistributionType>;
  iosEnterpriseProvisioning?: Maybe<BuildIosEnterpriseProvisioning>;
  appName?: Maybe<Scalars['String']>;
  appIdentifier?: Maybe<Scalars['String']>;
  buildProfile?: Maybe<Scalars['String']>;
  gitCommitHash?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
};

export type BuildMetrics = {
  __typename?: 'BuildMetrics';
  buildQueueTime?: Maybe<Scalars['Int']>;
  buildDuration?: Maybe<Scalars['Int']>;
};

export type BuildMutation = {
  __typename?: 'BuildMutation';
  /** Cancel an EAS Build build */
  cancelBuild: Build;
  /** Delete an EAS Build build */
  deleteBuild: Build;
  /**
   * Cancel an EAS Build build
   * @deprecated Use cancelBuild instead
   */
  cancel: Build;
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
  /** Create an Android build */
  createAndroidBuild: CreateBuildResult;
  /** Create an iOS generic build */
  createIosGenericBuild: CreateBuildResult;
  /** Create an iOS managed build */
  createIosManagedBuild: CreateBuildResult;
  /** Create an iOS build */
  createIosBuild: CreateBuildResult;
};


export type BuildMutationCancelBuildArgs = {
  buildId: Scalars['ID'];
};


export type BuildMutationDeleteBuildArgs = {
  buildId: Scalars['ID'];
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


export type BuildMutationCreateAndroidBuildArgs = {
  appId: Scalars['ID'];
  job: AndroidJobInput;
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


export type BuildMutationCreateIosBuildArgs = {
  appId: Scalars['ID'];
  job: IosJobInput;
  metadata?: Maybe<BuildMetadataInput>;
};

export type BuildOrBuildJob = {
  id: Scalars['ID'];
};

/** Publicly visible data for a Build. */
export type BuildPublicData = {
  __typename?: 'BuildPublicData';
  id: Scalars['ID'];
  status: BuildStatus;
  artifacts: PublicArtifacts;
  project: ProjectPublicData;
  platform: AppPlatform;
  distribution?: Maybe<DistributionType>;
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
  /** Look up EAS Build by build ID */
  byId: Build;
  /**
   * Get all builds for a specific app.
   * They are sorted from latest to oldest.
   * @deprecated Use App.builds instead
   */
  allForApp: Array<Maybe<Build>>;
  /**
   * Get all builds.
   * By default, they are sorted from latest to oldest.
   * Available only for admin users.
   */
  all: Array<Build>;
};


export type BuildQueryByIdArgs = {
  buildId: Scalars['ID'];
};


export type BuildQueryAllForAppArgs = {
  appId: Scalars['String'];
  status?: Maybe<BuildStatus>;
  platform?: Maybe<AppPlatform>;
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
};


export type BuildQueryAllArgs = {
  statuses?: Maybe<Array<BuildStatus>>;
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  order?: Maybe<Order>;
};

export enum BuildStatus {
  New = 'NEW',
  InQueue = 'IN_QUEUE',
  InProgress = 'IN_PROGRESS',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  Canceled = 'CANCELED'
}

export type BuildUpdatesInput = {
  channel?: Maybe<Scalars['String']>;
};

export enum BuildWorkflow {
  Generic = 'GENERIC',
  Managed = 'MANAGED'
}

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

export type Card = {
  __typename?: 'Card';
  cardHolder?: Maybe<Scalars['String']>;
  brand?: Maybe<Scalars['String']>;
  last4?: Maybe<Scalars['String']>;
  expYear?: Maybe<Scalars['Int']>;
  expMonth?: Maybe<Scalars['Int']>;
};

export type Charge = {
  __typename?: 'Charge';
  id: Scalars['ID'];
  paid?: Maybe<Scalars['Boolean']>;
  invoiceId?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['DateTime']>;
  amount?: Maybe<Scalars['Int']>;
  wasRefunded?: Maybe<Scalars['Boolean']>;
  receiptUrl?: Maybe<Scalars['String']>;
};

/** Represents a client build request */
export type ClientBuild = {
  __typename?: 'ClientBuild';
  id: Scalars['ID'];
  status?: Maybe<Scalars['String']>;
  userFacingErrorMessage?: Maybe<Scalars['String']>;
  buildJobId?: Maybe<Scalars['String']>;
  manifestPlistUrl?: Maybe<Scalars['String']>;
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
  platform: AppPlatform;
  config: Scalars['JSONObject'];
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
  id: Scalars['ID'];
  runtimeVersion: Scalars['String'];
  channel: Scalars['String'];
  recentBuilds: Array<Build>;
  branchMapping?: Maybe<UpdateBranch>;
  mostRecentlyUpdatedAt: Scalars['DateTime'];
};

export type DeploymentOptions = {
  /** Max number of associated builds to return */
  buildListMaxSize?: Maybe<Scalars['Int']>;
};

export enum DistributionType {
  Store = 'STORE',
  Internal = 'INTERNAL',
  Simulator = 'SIMULATOR'
}

export type EasBuildDeprecationInfo = {
  __typename?: 'EASBuildDeprecationInfo';
  type: EasBuildDeprecationInfoType;
  message: Scalars['String'];
};

export enum EasBuildDeprecationInfoType {
  UserFacing = 'USER_FACING',
  Internal = 'INTERNAL'
}

export type EasBuildKillSwitch = {
  __typename?: 'EasBuildKillSwitch';
  name: EasBuildKillSwitchName;
  value: Scalars['Boolean'];
};

export type EasBuildKillSwitchMutation = {
  __typename?: 'EasBuildKillSwitchMutation';
  /** Set an EAS Build kill switch to a given value */
  set: EasBuildKillSwitch;
  /** Reset all EAS Build kill switches (set them to false) */
  resetAll: Array<EasBuildKillSwitch>;
};


export type EasBuildKillSwitchMutationSetArgs = {
  name: EasBuildKillSwitchName;
  value: Scalars['Boolean'];
};

export enum EasBuildKillSwitchName {
  StopAcceptingBuilds = 'STOP_ACCEPTING_BUILDS',
  StopSchedulingBuilds = 'STOP_SCHEDULING_BUILDS',
  StopAcceptingNormalPriorityBuilds = 'STOP_ACCEPTING_NORMAL_PRIORITY_BUILDS'
}

export type EasBuildQuery = {
  __typename?: 'EasBuildQuery';
  /** Get EAS Build kill switches state */
  killSwitches: Array<EasBuildKillSwitch>;
};

export type EditUpdateBranchInput = {
  id?: Maybe<Scalars['ID']>;
  appId?: Maybe<Scalars['ID']>;
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
  id: Scalars['ID'];
  name: Scalars['String'];
  createdAt: Scalars['DateTime'];
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
  environmentSecretData: CreateEnvironmentSecretInput;
  accountId: Scalars['String'];
};


export type EnvironmentSecretMutationCreateEnvironmentSecretForAppArgs = {
  environmentSecretData: CreateEnvironmentSecretInput;
  appId: Scalars['String'];
};


export type EnvironmentSecretMutationDeleteEnvironmentSecretArgs = {
  id: Scalars['String'];
};

export type ExperimentationQuery = {
  __typename?: 'ExperimentationQuery';
  /** Get user experimentation config */
  userConfig: Scalars['JSONObject'];
  /** Get device experimentation config */
  deviceConfig: Scalars['JSONObject'];
  /** Get experimentation unit to use for device experiments. In this case, it is the IP address. */
  deviceExperimentationUnit: Scalars['ID'];
};

export type FcmSnippet = FcmSnippetLegacy | FcmSnippetV1;

export type FcmSnippetLegacy = {
  __typename?: 'FcmSnippetLegacy';
  firstFourCharacters: Scalars['String'];
  lastFourCharacters: Scalars['String'];
};

export type FcmSnippetV1 = {
  __typename?: 'FcmSnippetV1';
  projectId: Scalars['String'];
  keyId: Scalars['String'];
  serviceAccountEmail: Scalars['String'];
  clientId?: Maybe<Scalars['String']>;
};

export enum Feature {
  /** Top Tier Support */
  Support = 'SUPPORT',
  /** Share access to projects */
  Teams = 'TEAMS',
  /** Priority Builds */
  Builds = 'BUILDS',
  /** Funds support for open source development */
  OpenSource = 'OPEN_SOURCE'
}

export type GetSignedAssetUploadSpecificationsResult = {
  __typename?: 'GetSignedAssetUploadSpecificationsResult';
  specifications: Array<Maybe<Scalars['String']>>;
};

export type GoogleServiceAccountKey = {
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

export type IosAppBuildCredentials = {
  __typename?: 'IosAppBuildCredentials';
  id: Scalars['ID'];
  distributionCertificate?: Maybe<AppleDistributionCertificate>;
  provisioningProfile?: Maybe<AppleProvisioningProfile>;
  iosDistributionType: IosDistributionType;
  iosAppCredentials: IosAppCredentials;
  /** @deprecated Get Apple Devices from AppleProvisioningProfile instead */
  appleDevices?: Maybe<Array<Maybe<AppleDevice>>>;
};

export type IosAppBuildCredentialsFilter = {
  iosDistributionType?: Maybe<IosDistributionType>;
};

export type IosAppBuildCredentialsInput = {
  iosDistributionType: IosDistributionType;
  distributionCertificateId: Scalars['ID'];
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
  id: Scalars['ID'];
  distributionCertificateId: Scalars['ID'];
};


export type IosAppBuildCredentialsMutationSetProvisioningProfileArgs = {
  id: Scalars['ID'];
  provisioningProfileId: Scalars['ID'];
};

export type IosAppCredentials = {
  __typename?: 'IosAppCredentials';
  id: Scalars['ID'];
  app: App;
  appleTeam?: Maybe<AppleTeam>;
  appleAppIdentifier: AppleAppIdentifier;
  iosAppBuildCredentialsList: Array<IosAppBuildCredentials>;
  pushKey?: Maybe<ApplePushKey>;
  appSpecificPassword?: Maybe<AppleAppSpecificPassword>;
  /** @deprecated use iosAppBuildCredentialsList instead */
  iosAppBuildCredentialsArray: Array<IosAppBuildCredentials>;
};


export type IosAppCredentialsIosAppBuildCredentialsListArgs = {
  filter?: Maybe<IosAppBuildCredentialsFilter>;
};


export type IosAppCredentialsIosAppBuildCredentialsArrayArgs = {
  filter?: Maybe<IosAppBuildCredentialsFilter>;
};

export type IosAppCredentialsFilter = {
  appleAppIdentifierId?: Maybe<Scalars['String']>;
};

export type IosAppCredentialsInput = {
  appleTeamId?: Maybe<Scalars['ID']>;
  pushKeyId?: Maybe<Scalars['ID']>;
  appSpecificPasswordId?: Maybe<Scalars['ID']>;
};

export type IosAppCredentialsMutation = {
  __typename?: 'IosAppCredentialsMutation';
  /** Create a set of credentials for an iOS app */
  createIosAppCredentials: IosAppCredentials;
  /** Set the push key to be used in an iOS app */
  setPushKey: IosAppCredentials;
  /** Set the app-specific password to be used for an iOS app */
  setAppSpecificPassword: IosAppCredentials;
};


export type IosAppCredentialsMutationCreateIosAppCredentialsArgs = {
  iosAppCredentialsInput: IosAppCredentialsInput;
  appId: Scalars['ID'];
  appleAppIdentifierId: Scalars['ID'];
};


export type IosAppCredentialsMutationSetPushKeyArgs = {
  id: Scalars['ID'];
  pushKeyId: Scalars['ID'];
};


export type IosAppCredentialsMutationSetAppSpecificPasswordArgs = {
  id: Scalars['ID'];
  appSpecificPasswordId: Scalars['ID'];
};

export enum IosBuildType {
  Release = 'RELEASE',
  DevelopmentClient = 'DEVELOPMENT_CLIENT'
}

export type IosBuilderEnvironmentInput = {
  image?: Maybe<Scalars['String']>;
  node?: Maybe<Scalars['String']>;
  yarn?: Maybe<Scalars['String']>;
  bundler?: Maybe<Scalars['String']>;
  fastlane?: Maybe<Scalars['String']>;
  cocoapods?: Maybe<Scalars['String']>;
  expoCli?: Maybe<Scalars['String']>;
  env?: Maybe<Scalars['JSONObject']>;
};

export enum IosDistributionType {
  AppStore = 'APP_STORE',
  Enterprise = 'ENTERPRISE',
  AdHoc = 'AD_HOC',
  Development = 'DEVELOPMENT'
}

export type IosGenericJobInput = {
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  updates?: Maybe<BuildUpdatesInput>;
  distribution?: Maybe<DistributionType>;
  secrets?: Maybe<IosJobSecretsInput>;
  builderEnvironment?: Maybe<IosBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  scheme: Scalars['String'];
  schemeBuildConfiguration?: Maybe<IosSchemeBuildConfiguration>;
  buildConfiguration?: Maybe<Scalars['String']>;
  artifactPath?: Maybe<Scalars['String']>;
};

export type IosJobDistributionCertificateInput = {
  dataBase64: Scalars['String'];
  password: Scalars['String'];
};

export type IosJobInput = {
  type: BuildWorkflow;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  updates?: Maybe<BuildUpdatesInput>;
  distribution?: Maybe<DistributionType>;
  secrets?: Maybe<IosJobSecretsInput>;
  builderEnvironment?: Maybe<IosBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  scheme?: Maybe<Scalars['String']>;
  buildConfiguration?: Maybe<Scalars['String']>;
  artifactPath?: Maybe<Scalars['String']>;
  buildType?: Maybe<IosBuildType>;
  username?: Maybe<Scalars['String']>;
};

export type IosJobSecretsInput = {
  buildCredentials?: Maybe<Array<Maybe<IosJobTargetCredentialsInput>>>;
  environmentSecrets?: Maybe<Scalars['JSONObject']>;
};

export type IosJobTargetCredentialsInput = {
  targetName: Scalars['String'];
  provisioningProfileBase64: Scalars['String'];
  distributionCertificate: IosJobDistributionCertificateInput;
};

export enum IosManagedBuildType {
  Release = 'RELEASE',
  DevelopmentClient = 'DEVELOPMENT_CLIENT'
}

export type IosManagedJobInput = {
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: Maybe<Scalars['String']>;
  updates?: Maybe<BuildUpdatesInput>;
  distribution?: Maybe<DistributionType>;
  secrets?: Maybe<IosJobSecretsInput>;
  builderEnvironment?: Maybe<IosBuilderEnvironmentInput>;
  cache?: Maybe<BuildCacheInput>;
  buildType?: Maybe<IosManagedBuildType>;
  username?: Maybe<Scalars['String']>;
};

export enum IosSchemeBuildConfiguration {
  Release = 'RELEASE',
  Debug = 'DEBUG'
}

export type IosSubmissionConfig = {
  __typename?: 'IosSubmissionConfig';
  ascAppIdentifier: Scalars['String'];
  appleIdUsername: Scalars['String'];
  appleAppSpecificPasswordId?: Maybe<Scalars['String']>;
};

export type IosSubmissionConfigInput = {
  appleAppSpecificPasswordId?: Maybe<Scalars['String']>;
  appleAppSpecificPassword?: Maybe<Scalars['String']>;
  archiveUrl: Scalars['String'];
  appleIdUsername: Scalars['String'];
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
  EasMasterList = 'EAS_MASTER_LIST',
  DevClientUsers = 'DEV_CLIENT_USERS'
}

export type MailchimpTagPayload = {
  __typename?: 'MailchimpTagPayload';
  id?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
};

export type MeMutation = {
  __typename?: 'MeMutation';
  /** Update the current user's data */
  updateProfile?: Maybe<User>;
  /** Update an App that the current user owns */
  updateApp?: Maybe<App>;
  /** Unpublish an App that the current user owns */
  unpublishApp?: Maybe<App>;
  /** Transfer project to a different Account */
  transferApp: App;
  /** Delete a Snack that the current user owns */
  deleteSnack?: Maybe<Snack>;
  /** Create a new Account and grant this User the owner Role */
  createAccount?: Maybe<Account>;
  /** Delete an Account created via createAccount */
  deleteAccount: DeleteAccountResult;
  /** Leave an Account (revoke own permissions on Account) */
  leaveAccount: LeaveAccountResult;
  /** Initiate setup of two-factor authentication for the current user */
  initiateSecondFactorAuthentication: SecondFactorInitiationResult;
  /** Purge unfinished two-factor authentication setup for the current user if not fully-set-up */
  purgeUnfinishedSecondFactorAuthentication: SecondFactorBooleanResult;
  /** Regenerate backup codes for the current user */
  regenerateSecondFactorBackupCodes: SecondFactorRegenerateBackupCodesResult;
  /** Send SMS OTP to a second factor device for use during device setup or during change confirmation */
  sendSMSOTPToSecondFactorDevice: SecondFactorBooleanResult;
  /** Certify an initiated second factor authentication method for the current user */
  certifySecondFactorDevice: SecondFactorBooleanResult;
  /** Set the user's primary second factor device */
  setPrimarySecondFactorDevice: SecondFactorBooleanResult;
  /** Add an additional second factor device */
  addSecondFactorDevice: SecondFactorDeviceConfigurationResult;
  /** Delete a second factor device */
  deleteSecondFactorDevice: SecondFactorBooleanResult;
  /** Disable all second factor authentication for the current user */
  disableSecondFactorAuthentication: SecondFactorBooleanResult;
};


export type MeMutationUpdateProfileArgs = {
  userData: UserDataInput;
};


export type MeMutationUpdateAppArgs = {
  appData: AppDataInput;
};


export type MeMutationUnpublishAppArgs = {
  appId: Scalars['ID'];
};


export type MeMutationTransferAppArgs = {
  appId: Scalars['ID'];
  destinationAccountId: Scalars['ID'];
};


export type MeMutationDeleteSnackArgs = {
  snackId: Scalars['ID'];
};


export type MeMutationCreateAccountArgs = {
  accountData: AccountDataInput;
};


export type MeMutationDeleteAccountArgs = {
  accountId: Scalars['ID'];
};


export type MeMutationLeaveAccountArgs = {
  accountId: Scalars['ID'];
};


export type MeMutationInitiateSecondFactorAuthenticationArgs = {
  deviceConfigurations: Array<Maybe<SecondFactorDeviceConfiguration>>;
  recaptchaResponseToken?: Maybe<Scalars['String']>;
};


export type MeMutationRegenerateSecondFactorBackupCodesArgs = {
  otp: Scalars['String'];
};


export type MeMutationSendSmsotpToSecondFactorDeviceArgs = {
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationCertifySecondFactorDeviceArgs = {
  otp: Scalars['String'];
};


export type MeMutationSetPrimarySecondFactorDeviceArgs = {
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationAddSecondFactorDeviceArgs = {
  deviceConfiguration: SecondFactorDeviceConfiguration;
  otp: Scalars['String'];
};


export type MeMutationDeleteSecondFactorDeviceArgs = {
  userSecondFactorDeviceId: Scalars['ID'];
  otp: Scalars['String'];
};


export type MeMutationDisableSecondFactorAuthenticationArgs = {
  otp: Scalars['String'];
};

export type Offer = {
  __typename?: 'Offer';
  id: Scalars['ID'];
  stripeId: Scalars['ID'];
  price: Scalars['Int'];
  quantity?: Maybe<Scalars['Int']>;
  trialLength?: Maybe<Scalars['Int']>;
  type: OfferType;
  features?: Maybe<Array<Maybe<Feature>>>;
};

export enum OfferType {
  /** Term subscription */
  Subscription = 'SUBSCRIPTION',
  /** Advanced Purchase of Paid Resource */
  Prepaid = 'PREPAID'
}

export enum Order {
  Desc = 'DESC',
  Asc = 'ASC'
}

export type PartialManifest = {
  launchAsset: PartialManifestAsset;
  assets: Array<Maybe<PartialManifestAsset>>;
  extra?: Maybe<Scalars['JSONObject']>;
};

export type PartialManifestAsset = {
  fileSHA256: Scalars['String'];
  bundleKey: Scalars['String'];
  contentType: Scalars['String'];
  fileExtension?: Maybe<Scalars['String']>;
  storageKey: Scalars['String'];
};

export type PaymentDetails = {
  __typename?: 'PaymentDetails';
  id: Scalars['ID'];
  card?: Maybe<Card>;
  address?: Maybe<Address>;
};

export enum Permission {
  Own = 'OWN',
  Admin = 'ADMIN',
  Publish = 'PUBLISH',
  View = 'VIEW'
}

export type Project = {
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

export type ProjectArchiveSourceInput = {
  type: ProjectArchiveSourceType;
  bucketKey?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
};

export enum ProjectArchiveSourceType {
  S3 = 'S3',
  Url = 'URL'
}

export type ProjectPublicData = {
  __typename?: 'ProjectPublicData';
  id: Scalars['ID'];
  fullName: Scalars['String'];
};

export type ProjectQuery = {
  __typename?: 'ProjectQuery';
  byAccountNameAndSlug: Project;
  /** @deprecated See byAccountNameAndSlug */
  byUsernameAndSlug: Project;
  /** @deprecated Field no longer supported */
  byPaths: Array<Maybe<Project>>;
};


export type ProjectQueryByAccountNameAndSlugArgs = {
  accountName: Scalars['String'];
  slug: Scalars['String'];
  platform?: Maybe<AppPlatform>;
  sdkVersions?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type ProjectQueryByUsernameAndSlugArgs = {
  username: Scalars['String'];
  slug: Scalars['String'];
  platform?: Maybe<Scalars['String']>;
  sdkVersions?: Maybe<Array<Maybe<Scalars['String']>>>;
};


export type ProjectQueryByPathsArgs = {
  paths?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type PublicArtifacts = {
  __typename?: 'PublicArtifacts';
  buildUrl?: Maybe<Scalars['String']>;
};

export type PublishUpdateGroupInput = {
  branchId: Scalars['String'];
  updateInfoGroup: UpdateInfoGroup;
  runtimeVersion: Scalars['String'];
  message?: Maybe<Scalars['String']>;
};

export type RescindUserInvitationResult = {
  __typename?: 'RescindUserInvitationResult';
  id: Scalars['ID'];
};

/** Represents a robot (not human) actor. */
export type Robot = Actor & {
  __typename?: 'Robot';
  id: Scalars['ID'];
  firstName?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  isExpoAdmin: Scalars['Boolean'];
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
  /** Update a Robot */
  updateRobot: Robot;
  /** Delete a Robot */
  deleteRobot: DeleteRobotResult;
};


export type RobotMutationCreateRobotForAccountArgs = {
  robotData?: Maybe<RobotDataInput>;
  accountID: Scalars['String'];
  permissions: Array<Maybe<Permission>>;
};


export type RobotMutationUpdateRobotArgs = {
  id: Scalars['String'];
  robotData: RobotDataInput;
};


export type RobotMutationDeleteRobotArgs = {
  id: Scalars['String'];
};

export enum Role {
  Owner = 'OWNER',
  Admin = 'ADMIN',
  Developer = 'DEVELOPER',
  ViewOnly = 'VIEW_ONLY',
  Custom = 'CUSTOM',
  HasAdmin = 'HAS_ADMIN',
  NotAdmin = 'NOT_ADMIN'
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
  /** Mutations that modify an App */
  app?: Maybe<AppMutation>;
  asset: AssetMutation;
  /** Mutations that modify an BuildJob */
  buildJob?: Maybe<BuildJobMutation>;
  /** Mutations that modify an EAS Build */
  build?: Maybe<BuildMutation>;
  /** Mutations that modify the build credentials for an iOS app */
  iosAppBuildCredentials: IosAppBuildCredentialsMutation;
  /** Mutations that modify the credentials for an iOS app */
  iosAppCredentials: IosAppCredentialsMutation;
  /** Mutations that create, update, and delete Robots */
  robot: RobotMutation;
  /** Mutations that modify an EAS Submit submission */
  submission: SubmissionMutation;
  updateChannel: UpdateChannelMutation;
  update: UpdateMutation;
  updateBranch: UpdateBranchMutation;
  uploadSession: UploadSession;
  /** Mutations that create, delete, and accept UserInvitations */
  userInvitation: UserInvitationMutation;
  /** Mutations that modify the currently authenticated User */
  me?: Maybe<MeMutation>;
  easBuildKillSwitch: EasBuildKillSwitchMutation;
  /** Mutations that modify an EmailSubscription */
  emailSubscription: EmailSubscriptionMutation;
  /** Mutations that create and delete EnvironmentSecrets */
  environmentSecret: EnvironmentSecretMutation;
  /** Mutations that create, delete, update Webhooks */
  webhook: WebhookMutation;
};


export type RootMutationAccountArgs = {
  accountName: Scalars['ID'];
};


export type RootMutationAppArgs = {
  appId?: Maybe<Scalars['ID']>;
};


export type RootMutationBuildJobArgs = {
  buildId: Scalars['ID'];
};


export type RootMutationBuildArgs = {
  buildId?: Maybe<Scalars['ID']>;
};

export type RootQuery = {
  __typename?: 'RootQuery';
  /**
   * This is a placeholder field
   * @deprecated Not used.
   */
  _doNotUse?: Maybe<Scalars['String']>;
  /** fetch all updates in a group */
  updatesByGroup: Array<Update>;
  /** Top-level query object for querying Accounts. */
  account: AccountQuery;
  /** Top-level query object for querying Actors. */
  actor: ActorQuery;
  /** Top-level query object for querying Apple Device registration requests. */
  appleDeviceRegistrationRequest: AppleDeviceRegistrationRequestQuery;
  /** Top-level query object for querying Apple Teams. */
  appleTeam: AppleTeamQuery;
  app?: Maybe<AppQuery>;
  /**
   * Look up app by app id
   * @deprecated Use 'byId' field under 'app'.
   */
  appByAppId?: Maybe<App>;
  /**
   * Public apps in the app directory
   * @deprecated Use 'all' field under 'app'.
   */
  allPublicApps?: Maybe<Array<Maybe<App>>>;
  asset: AssetQuery;
  /** Top-level query object for querying BuildPublicData publicly. */
  buildPublicData: BuildPublicDataQuery;
  buildJobs: BuildJobQuery;
  builds: BuildQuery;
  clientBuilds: ClientBuildQuery;
  /** Top-level query object for querying EAS Build configuration. */
  easBuild: EasBuildQuery;
  /** Top-level query object for querying Experimentation configuration. */
  experimentation: ExperimentationQuery;
  project: ProjectQuery;
  snack: SnackQuery;
  submissions: SubmissionQuery;
  /** Top-level query object for querying UserInvitationPublicData publicly. */
  userInvitationPublicData: UserInvitationPublicDataQuery;
  /** Top-level query object for querying Users. */
  user: UserQuery;
  /** @deprecated Use 'byId' field under 'user'. */
  userByUserId?: Maybe<User>;
  /** @deprecated Use 'byUsername' field under 'user'. */
  userByUsername?: Maybe<User>;
  /**
   * If authenticated as a typical end user, this is the appropriate top-level
   * query object
   */
  me?: Maybe<User>;
  /**
   * If authenticated as a typical end user, this is the appropriate top-level
   * query object
   */
  viewer?: Maybe<User>;
  /**
   * If authenticated as a any type of Actor, this is the appropriate top-level
   * query object
   */
  meActor?: Maybe<Actor>;
  /** Top-level query object for querying Webhooks. */
  webhook: WebhookQuery;
};


export type RootQueryUpdatesByGroupArgs = {
  group: Scalars['ID'];
};


export type RootQueryAppByAppIdArgs = {
  appId: Scalars['String'];
};


export type RootQueryAllPublicAppsArgs = {
  filter: AppsFilter;
  sort: AppSort;
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
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
  method: SecondFactorMethod;
  smsPhoneNumber?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  isPrimary: Scalars['Boolean'];
};

export type SecondFactorDeviceConfigurationResult = {
  __typename?: 'SecondFactorDeviceConfigurationResult';
  secondFactorDevice: UserSecondFactorDevice;
  secret: Scalars['String'];
  keyURI: Scalars['String'];
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
  id: Scalars['ID'];
  hashId: Scalars['String'];
  /** Name of the Snack, e.g. "My Snack" */
  name: Scalars['String'];
  /** Full name of the Snack, e.g. "@john/mysnack", "@snack/245631" */
  fullName: Scalars['String'];
  /** Description of the Snack */
  description: Scalars['String'];
  /** @deprecated Field no longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  /** Slug name, e.g. "mysnack", "245631" */
  slug: Scalars['String'];
  /** Name of the user that created the Snack, or "snack" when the Snack was saved anonymously */
  username: Scalars['String'];
  /** Date and time the Snack was last updated */
  updated: Scalars['DateTime'];
  published: Scalars['Boolean'];
  /** Draft status, which is true when the Snack was not saved explicitly, but auto-saved */
  isDraft: Scalars['Boolean'];
};

export type SnackQuery = {
  __typename?: 'SnackQuery';
  /**
   * Get snack by hashId
   * @deprecated Use byHashId
   */
  byId: Snack;
  /** Get snack by hashId */
  byHashId: Snack;
};


export type SnackQueryByIdArgs = {
  id: Scalars['ID'];
};


export type SnackQueryByHashIdArgs = {
  hashId: Scalars['ID'];
};

export enum StandardOffer {
  /** $29 USD per month, 30 day trial */
  Default = 'DEFAULT',
  /** $348 USD per year, 30 day trial */
  YearlySub = 'YEARLY_SUB',
  /** $29 USD per month, 1 year trial */
  YcDeals = 'YC_DEALS',
  /** $800 USD per month */
  Support = 'SUPPORT'
}

/** Represents an EAS Submission */
export type Submission = ActivityTimelineProjectActivity & {
  __typename?: 'Submission';
  id: Scalars['ID'];
  actor?: Maybe<Actor>;
  activityTimestamp: Scalars['DateTime'];
  app?: Maybe<App>;
  initiatingActor?: Maybe<Actor>;
  submittedBuild?: Maybe<Build>;
  platform: AppPlatform;
  status: SubmissionStatus;
  androidConfig?: Maybe<AndroidSubmissionConfig>;
  iosConfig?: Maybe<IosSubmissionConfig>;
  logsUrl?: Maybe<Scalars['String']>;
  error?: Maybe<SubmissionError>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

export enum SubmissionAndroidArchiveType {
  Apk = 'APK',
  Aab = 'AAB'
}

export enum SubmissionAndroidReleaseStatus {
  Draft = 'DRAFT',
  InProgress = 'IN_PROGRESS',
  Halted = 'HALTED',
  Completed = 'COMPLETED'
}

export enum SubmissionAndroidTrack {
  Production = 'PRODUCTION',
  Internal = 'INTERNAL',
  Alpha = 'ALPHA',
  Beta = 'BETA'
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
  /** Create an EAS Submit submission */
  createSubmission: CreateSubmissionResult;
  /** Create an iOS EAS Submit submission */
  createIosSubmission: CreateSubmissionResult;
  /** Create an Android EAS Submit submission */
  createAndroidSubmission: CreateSubmissionResult;
};


export type SubmissionMutationCreateSubmissionArgs = {
  input: CreateSubmissionInput;
};


export type SubmissionMutationCreateIosSubmissionArgs = {
  input: CreateIosSubmissionInput;
};


export type SubmissionMutationCreateAndroidSubmissionArgs = {
  input: CreateAndroidSubmissionInput;
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
  InQueue = 'IN_QUEUE',
  InProgress = 'IN_PROGRESS',
  Finished = 'FINISHED',
  Errored = 'ERRORED'
}

export type SubscriptionDetails = {
  __typename?: 'SubscriptionDetails';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  nextInvoice?: Maybe<Scalars['DateTime']>;
  cancelledAt?: Maybe<Scalars['DateTime']>;
  willCancel?: Maybe<Scalars['Boolean']>;
  endedAt?: Maybe<Scalars['DateTime']>;
  trialEnd?: Maybe<Scalars['DateTime']>;
  status?: Maybe<Scalars['String']>;
};

export type Update = ActivityTimelineProjectActivity & {
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

export type UpdateBranch = {
  __typename?: 'UpdateBranch';
  id: Scalars['ID'];
  appId: Scalars['ID'];
  name: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  updates: Array<Update>;
};


export type UpdateBranchUpdatesArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  filter?: Maybe<UpdatesFilter>;
};

export type UpdateBranchMutation = {
  __typename?: 'UpdateBranchMutation';
  /** Create an EAS branch for an app */
  createUpdateBranchForApp?: Maybe<UpdateBranch>;
  /**
   * Edit an EAS branch. The branch can be specified either by its ID or
   * with the combination of (appId, name).
   */
  editUpdateBranch: UpdateBranch;
  /** Delete an EAS branch and all of its updates as long as the branch is not being used by any channels */
  deleteUpdateBranch: DeleteUpdateBranchResult;
  /** Publish an update group to a branch */
  publishUpdateGroup: Array<Update>;
};


export type UpdateBranchMutationCreateUpdateBranchForAppArgs = {
  appId: Scalars['ID'];
  name: Scalars['String'];
};


export type UpdateBranchMutationEditUpdateBranchArgs = {
  input: EditUpdateBranchInput;
};


export type UpdateBranchMutationDeleteUpdateBranchArgs = {
  branchId: Scalars['ID'];
};


export type UpdateBranchMutationPublishUpdateGroupArgs = {
  publishUpdateGroupInput?: Maybe<PublishUpdateGroupInput>;
};

export type UpdateChannel = {
  __typename?: 'UpdateChannel';
  id: Scalars['ID'];
  appId: Scalars['ID'];
  name: Scalars['String'];
  branchMapping: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  updateBranches: Array<UpdateBranch>;
};


export type UpdateChannelUpdateBranchesArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
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
  /**
   * Edit an EAS channel.
   *
   * In order to work with GraphQL formatting, the branchMapping should be a
   * stringified JSON supplied to the mutation as a variable.
   */
  editUpdateChannel?: Maybe<UpdateChannel>;
  /** delete an EAS channel that doesn't point to any branches */
  deleteUpdateChannel: DeleteUpdateChannelResult;
};


export type UpdateChannelMutationCreateUpdateChannelForAppArgs = {
  appId: Scalars['ID'];
  name: Scalars['String'];
  branchMapping?: Maybe<Scalars['String']>;
};


export type UpdateChannelMutationEditUpdateChannelArgs = {
  channelId: Scalars['ID'];
  branchMapping: Scalars['String'];
};


export type UpdateChannelMutationDeleteUpdateChannelArgs = {
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
  isSecondFactorAuthenticationEnabled: Scalars['Boolean'];
  /** Get all certified second factor authentication methods */
  secondFactorDevices: Array<UserSecondFactorDevice>;
  /** Associated accounts */
  primaryAccount: Account;
  accounts: Array<Account>;
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  /** Snacks associated with this account */
  snacks: Array<Snack>;
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


/** Represents a human (not robot) actor. */
export type UserSnacksArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
};


/** Represents a human (not robot) actor. */
export type UserAppsArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  includeUnpublished?: Maybe<Scalars['Boolean']>;
};


/** Represents a human (not robot) actor. */
export type UserActivityTimelineProjectActivitiesArgs = {
  limit: Scalars['Int'];
  createdBefore?: Maybe<Scalars['DateTime']>;
  filterTypes?: Maybe<Array<ActivityTimelineProjectActivityType>>;
};


/** Represents a human (not robot) actor. */
export type UserFeatureGatesArgs = {
  filter?: Maybe<Array<Scalars['String']>>;
};


/** Represents a human (not robot) actor. */
export type UserLikesArgs = {
  offset: Scalars['Int'];
  limit: Scalars['Int'];
};

export type UserDataInput = {
  id?: Maybe<Scalars['ID']>;
  username?: Maybe<Scalars['String']>;
  industry?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  githubUsername?: Maybe<Scalars['String']>;
  twitterUsername?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  profilePhoto?: Maybe<Scalars['String']>;
  isOnboarded?: Maybe<Scalars['Boolean']>;
  isLegacy?: Maybe<Scalars['Boolean']>;
  isEmailUnsubscribed?: Maybe<Scalars['Boolean']>;
  wasLegacy?: Maybe<Scalars['Boolean']>;
  appetizeCode?: Maybe<Scalars['String']>;
};

/** An pending invitation sent to an email granting membership on an Account. */
export type UserInvitation = {
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

export type UserInvitationMutation = {
  __typename?: 'UserInvitationMutation';
  /**
   * Create a UserInvitation for an email that when accepted grants
   * the specified permissions on an Account
   */
  createUserInvitationForAccount: UserInvitation;
  /** Re-send UserInivitation by ID */
  resendUserInvitation: UserInvitation;
  /** Rescind UserInvitation by ID */
  deleteUserInvitation: RescindUserInvitationResult;
  /**
   * Delete UserInvitation by token. Note that the viewer's email is not required to match
   * the email on the invitation.
   */
  deleteUserInvitationByToken: RescindUserInvitationResult;
  /** Accept UserInvitation by ID. Viewer must have matching email and email must be verified. */
  acceptUserInvitationAsViewer: AcceptUserInvitationResult;
  /**
   * Accept UserInvitation by token. Note that the viewer's email is not required to match
   * the email on the invitation. If viewer's email does match that of the invitation,
   * their email will also be verified.
   */
  acceptUserInvitationByTokenAsViewer: AcceptUserInvitationResult;
};


export type UserInvitationMutationCreateUserInvitationForAccountArgs = {
  accountID: Scalars['ID'];
  email: Scalars['String'];
  permissions: Array<Maybe<Permission>>;
};


export type UserInvitationMutationResendUserInvitationArgs = {
  id: Scalars['ID'];
};


export type UserInvitationMutationDeleteUserInvitationArgs = {
  id: Scalars['ID'];
};


export type UserInvitationMutationDeleteUserInvitationByTokenArgs = {
  token: Scalars['ID'];
};


export type UserInvitationMutationAcceptUserInvitationAsViewerArgs = {
  id: Scalars['ID'];
};


export type UserInvitationMutationAcceptUserInvitationByTokenAsViewerArgs = {
  token: Scalars['ID'];
};

/** Publicly visible data for a UserInvitation. */
export type UserInvitationPublicData = {
  __typename?: 'UserInvitationPublicData';
  /** Email to which this invitation was sent */
  id: Scalars['ID'];
  email: Scalars['String'];
  created: Scalars['DateTime'];
  accountName: Scalars['String'];
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
  permissions: Array<Permission>;
  role?: Maybe<Role>;
  /** @deprecated User type is deprecated */
  user?: Maybe<User>;
  actor: Actor;
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

export type Webhook = {
  __typename?: 'Webhook';
  id: Scalars['ID'];
  appId: Scalars['ID'];
  event: WebhookType;
  url: Scalars['String'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
};

export type WebhookFilter = {
  event?: Maybe<WebhookType>;
};

export type WebhookInput = {
  url: Scalars['String'];
  secret: Scalars['String'];
  event: WebhookType;
};

export type WebhookMutation = {
  __typename?: 'WebhookMutation';
  /** Create a Webhook */
  createWebhook: Webhook;
  /** Update a Webhook */
  updateWebhook: Webhook;
  /** Delete a Webhook */
  deleteWebhook: DeleteWebhookResult;
};


export type WebhookMutationCreateWebhookArgs = {
  appId: Scalars['String'];
  webhookInput: WebhookInput;
};


export type WebhookMutationUpdateWebhookArgs = {
  webhookId: Scalars['ID'];
  webhookInput: WebhookInput;
};


export type WebhookMutationDeleteWebhookArgs = {
  webhookId: Scalars['ID'];
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
