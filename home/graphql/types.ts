import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
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
  success: Scalars['Boolean'];
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
  revoked?: InputMaybe<Scalars['Boolean']>;
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
  appStoreConnectApiKeys: Array<AppStoreConnectApiKey>;
  appleAppIdentifiers: Array<AppleAppIdentifier>;
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
  /** Billing information. Only visible to members with the ADMIN or OWNER role. */
  billing?: Maybe<Billing>;
  billingPeriod: BillingPeriod;
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
  /** Android credentials for account */
  googleServiceAccountKeys: Array<GoogleServiceAccountKey>;
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
  /** Account query object for querying EAS usage metrics */
  usageMetrics: AccountUsageMetrics;
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
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  filterTypes?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleAppIdentifiersArgs = {
  bundleIdentifier?: InputMaybe<Scalars['String']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleDevicesArgs = {
  identifier?: InputMaybe<Scalars['String']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleProvisioningProfilesArgs = {
  appleAppIdentifierId?: InputMaybe<Scalars['ID']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleTeamsArgs = {
  appleTeamIdentifier?: InputMaybe<Scalars['String']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppsArgs = {
  includeUnpublished?: InputMaybe<Scalars['Boolean']>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBillingPeriodArgs = {
  date: Scalars['DateTime'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildJobsArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  status?: InputMaybe<BuildJobStatus>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildOrBuildJobsArgs = {
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  limit: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountBuildsArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  platform?: InputMaybe<AppPlatform>;
  status?: InputMaybe<BuildStatus>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountEnvironmentSecretsArgs = {
  filterNames?: InputMaybe<Array<Scalars['String']>>;
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
  /** Cancel scheduled subscription change */
  cancelScheduledSubscriptionChange: Account;
  /** Cancels the active subscription */
  cancelSubscription: Account;
  /** Upgrades or downgrades the active subscription to the newPlanIdentifier, which must be one of the EAS plans (i.e., Production or Enterprise). */
  changePlan: Account;
  /** Add specified account Permissions for Actor. Actor must already have at least one permission on the account. */
  grantActorPermissions: Account;
  /** Rename this account and the primary user's username if this account is a personal account */
  rename: Account;
  /** Requests a refund for the specified charge. Returns true if auto-refund was possible, otherwise requests a manual refund from support and returns false. */
  requestRefund: Scalars['Boolean'];
  /** Revoke specified Permissions for Actor. Actor must already have at least one permission on the account. */
  revokeActorPermissions: Account;
  /**
   * Update setting to purchase new build packs when the current one is consumed
   * @deprecated Build packs are no longer supported
   */
  setBuildAutoRenew?: Maybe<Account>;
  /** Set payment details */
  setPaymentSource: Account;
  /** Require authorization to send push notifications for experiences owned by this account */
  setPushSecurityEnabled: Account;
  /** Add a subscription */
  subscribeToProduct: Account;
};


export type AccountMutationBuyProductArgs = {
  accountName: Scalars['ID'];
  autoRenew?: InputMaybe<Scalars['Boolean']>;
  paymentSource?: InputMaybe<Scalars['ID']>;
  productId: Scalars['ID'];
};


export type AccountMutationCancelScheduledSubscriptionChangeArgs = {
  accountID: Scalars['ID'];
};


export type AccountMutationCancelSubscriptionArgs = {
  accountName: Scalars['ID'];
};


export type AccountMutationChangePlanArgs = {
  accountID: Scalars['ID'];
  couponCode?: InputMaybe<Scalars['String']>;
  newPlanIdentifier: Scalars['String'];
};


export type AccountMutationGrantActorPermissionsArgs = {
  accountID: Scalars['ID'];
  actorID: Scalars['ID'];
  permissions?: InputMaybe<Array<InputMaybe<Permission>>>;
};


export type AccountMutationRenameArgs = {
  accountID: Scalars['ID'];
  newName: Scalars['String'];
};


export type AccountMutationRequestRefundArgs = {
  accountID: Scalars['ID'];
  chargeID: Scalars['ID'];
  description?: InputMaybe<Scalars['String']>;
  reason?: InputMaybe<Scalars['String']>;
};


export type AccountMutationRevokeActorPermissionsArgs = {
  accountID: Scalars['ID'];
  actorID: Scalars['ID'];
  permissions?: InputMaybe<Array<InputMaybe<Permission>>>;
};


export type AccountMutationSetBuildAutoRenewArgs = {
  accountName: Scalars['ID'];
  autoRenew?: InputMaybe<Scalars['Boolean']>;
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

export type AccountUsageMetric = {
  __typename?: 'AccountUsageMetric';
  id: Scalars['ID'];
  metricType: UsageMetricType;
  serviceMetric: EasServiceMetric;
  timestamp: Scalars['DateTime'];
  value: Scalars['Float'];
};

export type AccountUsageMetricAndCost = {
  __typename?: 'AccountUsageMetricAndCost';
  id: Scalars['ID'];
  /** The limit, in units, allowed by this plan */
  limit: Scalars['Float'];
  metricType: UsageMetricType;
  serviceMetric: EasServiceMetric;
  /** Total cost of this particular metric, in cents */
  totalCost: Scalars['Float'];
  value: Scalars['Float'];
};

export type AccountUsageMetrics = {
  __typename?: 'AccountUsageMetrics';
  byBillingPeriod: UsageMetricTotal;
  metricsForServiceMetric: Array<AccountUsageMetric>;
};


export type AccountUsageMetricsByBillingPeriodArgs = {
  date: Scalars['DateTime'];
};


export type AccountUsageMetricsMetricsForServiceMetricArgs = {
  granularity: UsageMetricsGranularity;
  serviceMetric: EasServiceMetric;
  timespan: UsageMetricsTimespan;
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
   * Best-effort human readable name for this actor for use in user interfaces during action attribution.
   * For example, when displaying a sentence indicating that actor X created a build or published an update.
   */
  displayName: Scalars['String'];
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
  filter?: InputMaybe<Array<Scalars['String']>>;
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
  audience?: InputMaybe<MailchimpAudience>;
  email: Scalars['String'];
  tags?: InputMaybe<Array<MailchimpTag>>;
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

export type AddonDetails = {
  __typename?: 'AddonDetails';
  id: Scalars['ID'];
  name: Scalars['String'];
  nextInvoice?: Maybe<Scalars['DateTime']>;
  planId: Scalars['String'];
  willCancel?: Maybe<Scalars['Boolean']>;
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
  createAndroidAppBuildCredentials: AndroidAppBuildCredentials;
  /** delete a set of build credentials for an Android app */
  deleteAndroidAppBuildCredentials: DeleteAndroidAppBuildCredentialsResult;
  /** Set the build credentials to be the default for the Android app */
  setDefault: AndroidAppBuildCredentials;
  /** Set the keystore to be used for an Android app */
  setKeystore: AndroidAppBuildCredentials;
  /** Set the name of a set of build credentials to be used for an Android app */
  setName: AndroidAppBuildCredentials;
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
  applicationIdentifier?: InputMaybe<Scalars['String']>;
  legacyOnly?: InputMaybe<Scalars['Boolean']>;
};

export type AndroidAppCredentialsInput = {
  fcmId?: InputMaybe<Scalars['ID']>;
  googleServiceAccountKeyForSubmissionsId?: InputMaybe<Scalars['ID']>;
};

export type AndroidAppCredentialsMutation = {
  __typename?: 'AndroidAppCredentialsMutation';
  /** Create a set of credentials for an Android app */
  createAndroidAppCredentials: AndroidAppCredentials;
  /** Set the FCM push key to be used in an Android app */
  setFcm: AndroidAppCredentials;
  /** Set the Google Service Account Key to be used for submitting an Android app */
  setGoogleServiceAccountKeyForSubmissions: AndroidAppCredentials;
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


export type AndroidAppCredentialsMutationSetGoogleServiceAccountKeyForSubmissionsArgs = {
  googleServiceAccountKeyId: Scalars['ID'];
  id: Scalars['ID'];
};

export enum AndroidBuildType {
  Apk = 'APK',
  AppBundle = 'APP_BUNDLE',
  /** @deprecated Use developmentClient option instead. */
  DevelopmentClient = 'DEVELOPMENT_CLIENT'
}

export type AndroidBuilderEnvironmentInput = {
  env?: InputMaybe<Scalars['JSONObject']>;
  expoCli?: InputMaybe<Scalars['String']>;
  image?: InputMaybe<Scalars['String']>;
  ndk?: InputMaybe<Scalars['String']>;
  node?: InputMaybe<Scalars['String']>;
  yarn?: InputMaybe<Scalars['String']>;
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

export type AndroidJobBuildCredentialsInput = {
  keystore: AndroidJobKeystoreInput;
};

export type AndroidJobInput = {
  artifactPath?: InputMaybe<Scalars['String']>;
  buildType?: InputMaybe<AndroidBuildType>;
  builderEnvironment?: InputMaybe<AndroidBuilderEnvironmentInput>;
  cache?: InputMaybe<BuildCacheInput>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
  gradleCommand?: InputMaybe<Scalars['String']>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: InputMaybe<Scalars['String']>;
  secrets?: InputMaybe<AndroidJobSecretsInput>;
  type: BuildWorkflow;
  updates?: InputMaybe<BuildUpdatesInput>;
  username?: InputMaybe<Scalars['String']>;
};

export type AndroidJobKeystoreInput = {
  dataBase64: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: InputMaybe<Scalars['String']>;
  keystorePassword: Scalars['String'];
};

export type AndroidJobSecretsInput = {
  buildCredentials?: InputMaybe<AndroidJobBuildCredentialsInput>;
  environmentSecrets?: InputMaybe<Scalars['JSONObject']>;
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
  keyPassword?: InputMaybe<Scalars['String']>;
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

export type AndroidSubmissionConfig = {
  __typename?: 'AndroidSubmissionConfig';
  /** @deprecated applicationIdentifier is deprecated and will be auto-detected on submit */
  applicationIdentifier?: Maybe<Scalars['String']>;
  /** @deprecated archiveType is deprecated and will be null */
  archiveType?: Maybe<SubmissionAndroidArchiveType>;
  releaseStatus?: Maybe<SubmissionAndroidReleaseStatus>;
  track: SubmissionAndroidTrack;
};

export type AndroidSubmissionConfigInput = {
  applicationIdentifier?: InputMaybe<Scalars['String']>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  changesNotSentForReview?: InputMaybe<Scalars['Boolean']>;
  googleServiceAccountKeyId?: InputMaybe<Scalars['String']>;
  googleServiceAccountKeyJson?: InputMaybe<Scalars['String']>;
  releaseStatus?: InputMaybe<SubmissionAndroidReleaseStatus>;
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
  /** ios.appStoreUrl field from most recent classic update manifest */
  appStoreUrl?: Maybe<Scalars['String']>;
  buildJobs: Array<BuildJob>;
  /**
   * Coalesced Build (EAS) or BuildJob (Classic) items for this app.
   * @deprecated Use activityTimelineProjectActivities with filterTypes instead
   */
  buildOrBuildJobs: Array<BuildOrBuildJob>;
  /** (EAS Build) Builds associated with this app */
  builds: Array<Build>;
  /** Classic update release channel names that have at least one build */
  buildsReleaseChannels: Array<Scalars['String']>;
  deployment?: Maybe<Deployment>;
  /** Deployments associated with this app */
  deployments: Array<Deployment>;
  description: Scalars['String'];
  /** Environment secrets for an app */
  environmentSecrets: Array<EnvironmentSecret>;
  fullName: Scalars['String'];
  /** githubUrl field from most recent classic update manifest */
  githubUrl?: Maybe<Scalars['String']>;
  /** Info about the icon specified in the most recent classic update manifest */
  icon?: Maybe<AppIcon>;
  /** @deprecated No longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** iOS app credentials for the project */
  iosAppCredentials: Array<IosAppCredentials>;
  /** Whether the latest classic update publish is using a deprecated SDK version */
  isDeprecated: Scalars['Boolean'];
  /** @deprecated 'likes' have been deprecated. */
  isLikedByMe: Scalars['Boolean'];
  /** @deprecated No longer supported */
  lastPublishedTime: Scalars['DateTime'];
  latestReleaseForReleaseChannel?: Maybe<AppRelease>;
  /** ID of latest classic update release */
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
  /** android.playStoreUrl field from most recent classic update manifest */
  playStoreUrl?: Maybe<Scalars['String']>;
  /** @deprecated Use 'privacySetting' instead. */
  privacy: Scalars['String'];
  privacySetting: AppPrivacy;
  /** Whether there have been any classic update publishes */
  published: Scalars['Boolean'];
  pushSecurityEnabled: Scalars['Boolean'];
  /** Classic update release channel names (to be removed) */
  releaseChannels: Array<Scalars['String']>;
  /** @deprecated Legacy access tokens are deprecated */
  requiresAccessTokenForPushSecurity: Scalars['Boolean'];
  /** SDK version of the latest classic update publish, 0.0.0 otherwise */
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
  /** Time of last classic update publish */
  updated: Scalars['DateTime'];
  /** EAS updates owned by an app */
  updates: Array<Update>;
  /** @deprecated Use ownerAccount.name instead */
  username: Scalars['String'];
  /** @deprecated No longer supported */
  users?: Maybe<Array<Maybe<User>>>;
  /** Webhooks for an app */
  webhooks: Array<Webhook>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppActivityTimelineProjectActivitiesArgs = {
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  filterPlatforms?: InputMaybe<Array<AppPlatform>>;
  filterReleaseChannels?: InputMaybe<Array<Scalars['String']>>;
  filterTypes?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppAndroidAppCredentialsArgs = {
  filter?: InputMaybe<AndroidAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildJobsArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  status?: InputMaybe<BuildStatus>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildOrBuildJobsArgs = {
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBuildsArgs = {
  filter?: InputMaybe<BuildFilter>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  platform?: InputMaybe<AppPlatform>;
  status?: InputMaybe<BuildStatus>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentArgs = {
  channel: Scalars['String'];
  options?: InputMaybe<DeploymentOptions>;
  runtimeVersion: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentsArgs = {
  limit: Scalars['Int'];
  mostRecentlyUpdatedAt?: InputMaybe<Scalars['DateTime']>;
  options?: InputMaybe<DeploymentOptions>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppEnvironmentSecretsArgs = {
  filterNames?: InputMaybe<Array<Scalars['String']>>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppIosAppCredentialsArgs = {
  filter?: InputMaybe<IosAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppLatestReleaseForReleaseChannelArgs = {
  platform: AppPlatform;
  releaseChannel: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppLikedByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
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
export type AppUpdatesArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWebhooksArgs = {
  filter?: InputMaybe<WebhookFilter>;
};

export type AppDataInput = {
  id: Scalars['ID'];
  privacy?: InputMaybe<Scalars['String']>;
};

export type AppIcon = {
  __typename?: 'AppIcon';
  /** @deprecated No longer supported */
  colorPalette?: Maybe<Scalars['JSON']>;
  originalUrl: Scalars['String'];
  primaryColor?: Maybe<Scalars['String']>;
  url: Scalars['String'];
};

export type AppInfoInput = {
  displayName?: InputMaybe<Scalars['String']>;
};

export type AppInput = {
  accountId: Scalars['ID'];
  appInfo?: InputMaybe<AppInfoInput>;
  privacy: AppPrivacy;
  projectName: Scalars['String'];
};

export type AppMutation = {
  __typename?: 'AppMutation';
  /** Create an unpublished app */
  createApp: App;
  /** @deprecated No longer supported */
  grantAccess?: Maybe<App>;
  /** Set display info for app */
  setAppInfo: App;
  /** Require api token to send push notifs for experience */
  setPushSecurityEnabled: App;
};


export type AppMutationCreateAppArgs = {
  appInput: AppInput;
};


export type AppMutationGrantAccessArgs = {
  accessLevel?: InputMaybe<Scalars['String']>;
  toUser: Scalars['ID'];
};


export type AppMutationSetAppInfoArgs = {
  appId: Scalars['ID'];
  appInfo: AppInfoInput;
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
  /**
   * Public apps in the app directory
   * @deprecated App directory no longer supported
   */
  all: Array<App>;
  byFullName: App;
  /** Look up app by app id */
  byId: App;
};


export type AppQueryAllArgs = {
  filter: AppsFilter;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
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

export type AppStoreConnectApiKey = {
  __typename?: 'AppStoreConnectApiKey';
  account: Account;
  appleTeam?: Maybe<AppleTeam>;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  issuerIdentifier: Scalars['String'];
  keyIdentifier: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  roles?: Maybe<Array<AppStoreConnectUserRole>>;
  updatedAt: Scalars['DateTime'];
};

export type AppStoreConnectApiKeyInput = {
  appleTeamId?: InputMaybe<Scalars['ID']>;
  issuerIdentifier: Scalars['String'];
  keyIdentifier: Scalars['String'];
  keyP8: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
  roles?: InputMaybe<Array<AppStoreConnectUserRole>>;
};

export type AppStoreConnectApiKeyMutation = {
  __typename?: 'AppStoreConnectApiKeyMutation';
  /** Create an App Store Connect Api Key for an Apple Team */
  createAppStoreConnectApiKey: AppStoreConnectApiKey;
  /** Delete an App Store Connect Api Key */
  deleteAppStoreConnectApiKey: DeleteAppStoreConnectApiKeyResult;
};


export type AppStoreConnectApiKeyMutationCreateAppStoreConnectApiKeyArgs = {
  accountId: Scalars['ID'];
  appStoreConnectApiKeyInput: AppStoreConnectApiKeyInput;
};


export type AppStoreConnectApiKeyMutationDeleteAppStoreConnectApiKeyArgs = {
  id: Scalars['ID'];
};

export enum AppStoreConnectUserRole {
  AccessToReports = 'ACCESS_TO_REPORTS',
  AccountHolder = 'ACCOUNT_HOLDER',
  Admin = 'ADMIN',
  AppManager = 'APP_MANAGER',
  CloudManagedAppDistribution = 'CLOUD_MANAGED_APP_DISTRIBUTION',
  CloudManagedDeveloperId = 'CLOUD_MANAGED_DEVELOPER_ID',
  CreateApps = 'CREATE_APPS',
  CustomerSupport = 'CUSTOMER_SUPPORT',
  Developer = 'DEVELOPER',
  Finance = 'FINANCE',
  ImageManager = 'IMAGE_MANAGER',
  Marketing = 'MARKETING',
  ReadOnly = 'READ_ONLY',
  Sales = 'SALES',
  Technical = 'TECHNICAL',
  Unknown = 'UNKNOWN'
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
  appleTeamId?: InputMaybe<Scalars['ID']>;
  bundleIdentifier: Scalars['String'];
  parentAppleAppId?: InputMaybe<Scalars['ID']>;
};

export type AppleAppIdentifierMutation = {
  __typename?: 'AppleAppIdentifierMutation';
  /** Create an Identifier for an iOS App */
  createAppleAppIdentifier: AppleAppIdentifier;
};


export type AppleAppIdentifierMutationCreateAppleAppIdentifierArgs = {
  accountId: Scalars['ID'];
  appleAppIdentifierInput: AppleAppIdentifierInput;
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
  deviceClass?: InputMaybe<AppleDeviceClass>;
  enabled?: InputMaybe<Scalars['Boolean']>;
  identifier: Scalars['String'];
  model?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  softwareVersion?: InputMaybe<Scalars['String']>;
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
  appleTeamId?: InputMaybe<Scalars['ID']>;
  certP12: Scalars['String'];
  certPassword: Scalars['String'];
  certPrivateSigningKey?: InputMaybe<Scalars['String']>;
  developerPortalIdentifier?: InputMaybe<Scalars['String']>;
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
  developerPortalIdentifier?: InputMaybe<Scalars['String']>;
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
  appleTeamId?: InputMaybe<Scalars['ID']>;
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
  bundleIdentifier?: InputMaybe<Scalars['String']>;
};


export type AppleTeamAppleProvisioningProfilesArgs = {
  appleAppIdentifierId?: InputMaybe<Scalars['ID']>;
};

export type AppleTeamInput = {
  appleTeamIdentifier: Scalars['String'];
  appleTeamName?: InputMaybe<Scalars['String']>;
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

export type AscApiKeyInput = {
  issuerIdentifier: Scalars['String'];
  keyIdentifier: Scalars['String'];
  keyP8: Scalars['String'];
};

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
  getSignedAssetUploadSpecifications: GetSignedAssetUploadSpecificationsResult;
};


export type AssetMutationGetSignedAssetUploadSpecificationsArgs = {
  assetContentTypes: Array<InputMaybe<Scalars['String']>>;
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
  id: Scalars['ID'];
  payment?: Maybe<PaymentDetails>;
  subscription?: Maybe<SubscriptionDetails>;
};

export type BillingPeriod = {
  __typename?: 'BillingPeriod';
  anchor: Scalars['DateTime'];
  end: Scalars['DateTime'];
  start: Scalars['DateTime'];
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
  estimatedWaitTimeLeftSeconds?: Maybe<Scalars['Int']>;
  expirationDate?: Maybe<Scalars['DateTime']>;
  gitCommitHash?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** Queue position is 1-indexed */
  initialQueuePosition?: Maybe<Scalars['Int']>;
  initiatingActor?: Maybe<Actor>;
  /** @deprecated User type is deprecated */
  initiatingUser?: Maybe<User>;
  iosEnterpriseProvisioning?: Maybe<BuildIosEnterpriseProvisioning>;
  isGitWorkingTreeDirty?: Maybe<Scalars['Boolean']>;
  logFiles: Array<Scalars['String']>;
  metrics?: Maybe<BuildMetrics>;
  platform: AppPlatform;
  priority: BuildPriority;
  project: Project;
  /** Queue position is 1-indexed */
  queuePosition?: Maybe<Scalars['Int']>;
  reactNativeVersion?: Maybe<Scalars['String']>;
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
  cacheDefaultPaths?: InputMaybe<Scalars['Boolean']>;
  clear?: InputMaybe<Scalars['Boolean']>;
  customPaths?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  disabled?: InputMaybe<Scalars['Boolean']>;
  key?: InputMaybe<Scalars['String']>;
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
  appBuildVersion?: InputMaybe<Scalars['String']>;
  appIdentifier?: InputMaybe<Scalars['String']>;
  appVersion?: InputMaybe<Scalars['String']>;
  buildProfile?: InputMaybe<Scalars['String']>;
  channel?: InputMaybe<Scalars['String']>;
  distribution?: InputMaybe<DistributionType>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  platform?: InputMaybe<AppPlatform>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  sdkVersion?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<BuildStatus>;
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
  cancel: BuildJob;
  del?: Maybe<BuildJob>;
  restart: BuildJob;
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
  experienceSlug?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  showAdminView?: InputMaybe<Scalars['Boolean']>;
  status?: InputMaybe<BuildJobStatus>;
  username?: InputMaybe<Scalars['String']>;
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
  appBuildVersion?: InputMaybe<Scalars['String']>;
  appIdentifier?: InputMaybe<Scalars['String']>;
  appName?: InputMaybe<Scalars['String']>;
  appVersion?: InputMaybe<Scalars['String']>;
  buildProfile?: InputMaybe<Scalars['String']>;
  channel?: InputMaybe<Scalars['String']>;
  cliVersion?: InputMaybe<Scalars['String']>;
  credentialsSource?: InputMaybe<BuildCredentialsSource>;
  distribution?: InputMaybe<DistributionType>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  iosEnterpriseProvisioning?: InputMaybe<BuildIosEnterpriseProvisioning>;
  isGitWorkingTreeDirty?: InputMaybe<Scalars['Boolean']>;
  reactNativeVersion?: InputMaybe<Scalars['String']>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  sdkVersion?: InputMaybe<Scalars['String']>;
  trackingContext?: InputMaybe<Scalars['JSONObject']>;
  username?: InputMaybe<Scalars['String']>;
  workflow?: InputMaybe<BuildWorkflow>;
};

export type BuildMetrics = {
  __typename?: 'BuildMetrics';
  buildDuration?: Maybe<Scalars['Int']>;
  buildQueueTime?: Maybe<Scalars['Int']>;
  buildWaitTime?: Maybe<Scalars['Int']>;
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
  /** Create an iOS build */
  createIosBuild: CreateBuildResult;
  /** Delete an EAS Build build */
  deleteBuild: Build;
};


export type BuildMutationCancelBuildArgs = {
  buildId: Scalars['ID'];
};


export type BuildMutationCreateAndroidBuildArgs = {
  appId: Scalars['ID'];
  job: AndroidJobInput;
  metadata?: InputMaybe<BuildMetadataInput>;
};


export type BuildMutationCreateIosBuildArgs = {
  appId: Scalars['ID'];
  job: IosJobInput;
  metadata?: InputMaybe<BuildMetadataInput>;
};


export type BuildMutationDeleteBuildArgs = {
  buildId: Scalars['ID'];
};

export type BuildOrBuildJob = {
  id: Scalars['ID'];
};

export enum BuildPriority {
  High = 'HIGH',
  Normal = 'NORMAL'
}

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
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order?: InputMaybe<Order>;
  statuses?: InputMaybe<Array<BuildStatus>>;
};


export type BuildQueryAllForAppArgs = {
  appId: Scalars['String'];
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  platform?: InputMaybe<AppPlatform>;
  status?: InputMaybe<BuildStatus>;
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
  channel?: InputMaybe<Scalars['String']>;
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

export type CodeSigningInfo = {
  __typename?: 'CodeSigningInfo';
  alg: Scalars['String'];
  keyid: Scalars['String'];
  sig: Scalars['String'];
};

export type CodeSigningInfoInput = {
  alg: Scalars['String'];
  keyid: Scalars['String'];
  sig: Scalars['String'];
};

export type Concurrencies = {
  __typename?: 'Concurrencies';
  android: Scalars['Int'];
  ios: Scalars['Int'];
  total: Scalars['Int'];
};

export type CreateAccessTokenInput = {
  actorID: Scalars['ID'];
  note?: InputMaybe<Scalars['String']>;
};

export type CreateAccessTokenResponse = {
  __typename?: 'CreateAccessTokenResponse';
  /** AccessToken created */
  accessToken: AccessToken;
  /** Full token string to be used for authentication */
  token: Scalars['String'];
};

export type CreateAndroidSubmissionInput = {
  appId: Scalars['ID'];
  archiveUrl?: InputMaybe<Scalars['String']>;
  config: AndroidSubmissionConfigInput;
  submittedBuildId?: InputMaybe<Scalars['ID']>;
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
  archiveUrl?: InputMaybe<Scalars['String']>;
  config: IosSubmissionConfigInput;
  submittedBuildId?: InputMaybe<Scalars['ID']>;
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

export type DeleteGoogleServiceAccountKeyResult = {
  __typename?: 'DeleteGoogleServiceAccountKeyResult';
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
  buildListMaxSize?: InputMaybe<Scalars['Int']>;
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

export enum EasServiceMetric {
  AssetsRequests = 'ASSETS_REQUESTS',
  BandwidthUsage = 'BANDWIDTH_USAGE',
  ManifestRequests = 'MANIFEST_REQUESTS',
  UniqueUsers = 'UNIQUE_USERS'
}

export type EditUpdateBranchInput = {
  appId?: InputMaybe<Scalars['ID']>;
  id?: InputMaybe<Scalars['ID']>;
  name?: InputMaybe<Scalars['String']>;
  newName: Scalars['String'];
};

export type EmailSubscriptionMutation = {
  __typename?: 'EmailSubscriptionMutation';
  addUser: AddUserPayload;
};


export type EmailSubscriptionMutationAddUserArgs = {
  addUserInput: AddUserInput;
};

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
  specifications: Array<Scalars['String']>;
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

export type GoogleServiceAccountKeyInput = {
  jsonKey: Scalars['JSONObject'];
};

export type GoogleServiceAccountKeyMutation = {
  __typename?: 'GoogleServiceAccountKeyMutation';
  /** Create a Google Service Account Key */
  createGoogleServiceAccountKey: GoogleServiceAccountKey;
  /** Delete a Google Service Account Key */
  deleteGoogleServiceAccountKey: DeleteGoogleServiceAccountKeyResult;
};


export type GoogleServiceAccountKeyMutationCreateGoogleServiceAccountKeyArgs = {
  accountId: Scalars['ID'];
  googleServiceAccountKeyInput: GoogleServiceAccountKeyInput;
};


export type GoogleServiceAccountKeyMutationDeleteGoogleServiceAccountKeyArgs = {
  id: Scalars['ID'];
};

export type Invoice = {
  __typename?: 'Invoice';
  /** The total amount due for the invoice, in cents */
  amountDue: Scalars['Int'];
  /** The total amount that has been paid, considering any discounts or account credit. Value is in cents. */
  amountPaid: Scalars['Int'];
  /** The total amount that needs to be paid, considering any discounts or account credit. Value is in cents. */
  amountRemaining: Scalars['Int'];
  discount?: Maybe<InvoiceDiscount>;
  id: Scalars['ID'];
  lineItems: Array<InvoiceLineItem>;
  period: InvoicePeriod;
  startingBalance: Scalars['Int'];
  subtotal: Scalars['Int'];
  total: Scalars['Int'];
  totalDiscountedAmount: Scalars['Int'];
};

export type InvoiceDiscount = {
  __typename?: 'InvoiceDiscount';
  /** The coupon's discount value, in percentage or in dollar amount */
  amount: Scalars['Int'];
  duration: Scalars['String'];
  durationInMonths?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  type: InvoiceDiscountType;
};

export enum InvoiceDiscountType {
  Amount = 'AMOUNT',
  Percentage = 'PERCENTAGE'
}

export type InvoiceLineItem = {
  __typename?: 'InvoiceLineItem';
  /** Line-item amount in cents */
  amount: Scalars['Int'];
  description: Scalars['String'];
  id: Scalars['ID'];
  period: InvoicePeriod;
  plan: InvoiceLineItemPlan;
  proration: Scalars['Boolean'];
  quantity: Scalars['Int'];
  title: Scalars['String'];
};

export type InvoiceLineItemPlan = {
  __typename?: 'InvoiceLineItemPlan';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type InvoicePeriod = {
  __typename?: 'InvoicePeriod';
  end: Scalars['DateTime'];
  start: Scalars['DateTime'];
};

export type InvoiceQuery = {
  __typename?: 'InvoiceQuery';
  /** Preview an upgrade subscription invoice, with proration */
  previewInvoiceForSubscriptionUpdate: Invoice;
};


export type InvoiceQueryPreviewInvoiceForSubscriptionUpdateArgs = {
  accountId: Scalars['String'];
  couponCode?: InputMaybe<Scalars['String']>;
  newPlanIdentifier: Scalars['String'];
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
  iosDistributionType?: InputMaybe<IosDistributionType>;
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
  appStoreConnectApiKeyForSubmissions?: Maybe<AppStoreConnectApiKey>;
  appleAppIdentifier: AppleAppIdentifier;
  appleTeam?: Maybe<AppleTeam>;
  id: Scalars['ID'];
  /** @deprecated use iosAppBuildCredentialsList instead */
  iosAppBuildCredentialsArray: Array<IosAppBuildCredentials>;
  iosAppBuildCredentialsList: Array<IosAppBuildCredentials>;
  pushKey?: Maybe<ApplePushKey>;
};


export type IosAppCredentialsIosAppBuildCredentialsArrayArgs = {
  filter?: InputMaybe<IosAppBuildCredentialsFilter>;
};


export type IosAppCredentialsIosAppBuildCredentialsListArgs = {
  filter?: InputMaybe<IosAppBuildCredentialsFilter>;
};

export type IosAppCredentialsFilter = {
  appleAppIdentifierId?: InputMaybe<Scalars['String']>;
};

export type IosAppCredentialsInput = {
  appStoreConnectApiKeyForSubmissionsId?: InputMaybe<Scalars['ID']>;
  appleTeamId?: InputMaybe<Scalars['ID']>;
  pushKeyId?: InputMaybe<Scalars['ID']>;
};

export type IosAppCredentialsMutation = {
  __typename?: 'IosAppCredentialsMutation';
  /** Create a set of credentials for an iOS app */
  createIosAppCredentials: IosAppCredentials;
  /** Set the App Store Connect Api Key to be used for submitting an iOS app */
  setAppStoreConnectApiKeyForSubmissions: IosAppCredentials;
  /** Set the push key to be used in an iOS app */
  setPushKey: IosAppCredentials;
};


export type IosAppCredentialsMutationCreateIosAppCredentialsArgs = {
  appId: Scalars['ID'];
  appleAppIdentifierId: Scalars['ID'];
  iosAppCredentialsInput: IosAppCredentialsInput;
};


export type IosAppCredentialsMutationSetAppStoreConnectApiKeyForSubmissionsArgs = {
  ascApiKeyId: Scalars['ID'];
  id: Scalars['ID'];
};


export type IosAppCredentialsMutationSetPushKeyArgs = {
  id: Scalars['ID'];
  pushKeyId: Scalars['ID'];
};

/** @deprecated Use developmentClient option instead. */
export enum IosBuildType {
  DevelopmentClient = 'DEVELOPMENT_CLIENT',
  Release = 'RELEASE'
}

export type IosBuilderEnvironmentInput = {
  bundler?: InputMaybe<Scalars['String']>;
  cocoapods?: InputMaybe<Scalars['String']>;
  env?: InputMaybe<Scalars['JSONObject']>;
  expoCli?: InputMaybe<Scalars['String']>;
  fastlane?: InputMaybe<Scalars['String']>;
  image?: InputMaybe<Scalars['String']>;
  node?: InputMaybe<Scalars['String']>;
  yarn?: InputMaybe<Scalars['String']>;
};

export enum IosDistributionType {
  AdHoc = 'AD_HOC',
  AppStore = 'APP_STORE',
  Development = 'DEVELOPMENT',
  Enterprise = 'ENTERPRISE'
}

export type IosJobDistributionCertificateInput = {
  dataBase64: Scalars['String'];
  password: Scalars['String'];
};

export type IosJobInput = {
  artifactPath?: InputMaybe<Scalars['String']>;
  buildConfiguration?: InputMaybe<Scalars['String']>;
  /** @deprecated */
  buildType?: InputMaybe<IosBuildType>;
  builderEnvironment?: InputMaybe<IosBuilderEnvironmentInput>;
  cache?: InputMaybe<BuildCacheInput>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  /** @deprecated */
  distribution?: InputMaybe<DistributionType>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: InputMaybe<Scalars['String']>;
  scheme?: InputMaybe<Scalars['String']>;
  secrets?: InputMaybe<IosJobSecretsInput>;
  simulator?: InputMaybe<Scalars['Boolean']>;
  type: BuildWorkflow;
  updates?: InputMaybe<BuildUpdatesInput>;
  username?: InputMaybe<Scalars['String']>;
};

export type IosJobSecretsInput = {
  buildCredentials?: InputMaybe<Array<InputMaybe<IosJobTargetCredentialsInput>>>;
  environmentSecrets?: InputMaybe<Scalars['JSONObject']>;
};

export type IosJobTargetCredentialsInput = {
  distributionCertificate: IosJobDistributionCertificateInput;
  provisioningProfileBase64: Scalars['String'];
  targetName: Scalars['String'];
};

/** @deprecated Use developmentClient option instead. */
export enum IosManagedBuildType {
  DevelopmentClient = 'DEVELOPMENT_CLIENT',
  Release = 'RELEASE'
}

export enum IosSchemeBuildConfiguration {
  Debug = 'DEBUG',
  Release = 'RELEASE'
}

export type IosSubmissionConfig = {
  __typename?: 'IosSubmissionConfig';
  appleIdUsername?: Maybe<Scalars['String']>;
  ascApiKeyId?: Maybe<Scalars['String']>;
  ascAppIdentifier: Scalars['String'];
};

export type IosSubmissionConfigInput = {
  appleAppSpecificPassword?: InputMaybe<Scalars['String']>;
  appleIdUsername?: InputMaybe<Scalars['String']>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  ascApiKey?: InputMaybe<AscApiKeyInput>;
  ascApiKeyId?: InputMaybe<Scalars['String']>;
  ascAppIdentifier: Scalars['String'];
};

export type KeystoreGenerationUrl = {
  __typename?: 'KeystoreGenerationUrl';
  id: Scalars['ID'];
  url: Scalars['String'];
};

export type KeystoreGenerationUrlMutation = {
  __typename?: 'KeystoreGenerationUrlMutation';
  /** Create a Keystore Generation URL */
  createKeystoreGenerationUrl: KeystoreGenerationUrl;
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
  createAccount: Account;
  /** Delete an Account created via createAccount */
  deleteAccount: DeleteAccountResult;
  /** Delete a second factor device */
  deleteSecondFactorDevice: SecondFactorBooleanResult;
  /** Delete a Snack that the current user owns */
  deleteSnack: Snack;
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
  unpublishApp: App;
  /** Update an App that the current user owns */
  updateApp: App;
  /** Update the current user's data */
  updateProfile: User;
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
  deviceConfigurations: Array<SecondFactorDeviceConfiguration>;
  recaptchaResponseToken?: InputMaybe<Scalars['String']>;
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
  prerequisite?: Maybe<OfferPrerequisite>;
  price: Scalars['Int'];
  quantity?: Maybe<Scalars['Int']>;
  stripeId: Scalars['ID'];
  trialLength?: Maybe<Scalars['Int']>;
  type: OfferType;
};

export type OfferPrerequisite = {
  __typename?: 'OfferPrerequisite';
  stripeIds: Array<Scalars['String']>;
  type: Scalars['String'];
};

export enum OfferType {
  /** Addon, or supplementary subscription */
  Addon = 'ADDON',
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
  assets: Array<InputMaybe<PartialManifestAsset>>;
  extra?: InputMaybe<Scalars['JSONObject']>;
  launchAsset: PartialManifestAsset;
};

export type PartialManifestAsset = {
  bundleKey: Scalars['String'];
  contentType: Scalars['String'];
  fileExtension?: InputMaybe<Scalars['String']>;
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
  bucketKey?: InputMaybe<Scalars['String']>;
  type: ProjectArchiveSourceType;
  url?: InputMaybe<Scalars['String']>;
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
  platform?: InputMaybe<AppPlatform>;
  sdkVersions?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  slug: Scalars['String'];
};


export type ProjectQueryByPathsArgs = {
  paths?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type ProjectQueryByUsernameAndSlugArgs = {
  platform?: InputMaybe<Scalars['String']>;
  sdkVersions?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  slug: Scalars['String'];
  username: Scalars['String'];
};

export type PublicArtifacts = {
  __typename?: 'PublicArtifacts';
  buildUrl?: Maybe<Scalars['String']>;
};

export type PublishUpdateGroupInput = {
  awaitingCodeSigningInfo?: InputMaybe<Scalars['Boolean']>;
  branchId: Scalars['String'];
  message?: InputMaybe<Scalars['String']>;
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
  displayName: Scalars['String'];
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
  filter?: InputMaybe<Array<Scalars['String']>>;
};

export type RobotDataInput = {
  name?: InputMaybe<Scalars['String']>;
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
  permissions: Array<InputMaybe<Permission>>;
  robotData?: InputMaybe<RobotDataInput>;
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
  account: AccountMutation;
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
  /** Mutations that modify an App Store Connect Api Key */
  appStoreConnectApiKey: AppStoreConnectApiKeyMutation;
  /** Mutations that modify an Identifier for an iOS App */
  appleAppIdentifier: AppleAppIdentifierMutation;
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
  build: BuildMutation;
  /** Mutations that modify an BuildJob */
  buildJob: BuildJobMutation;
  /** Mutations that modify an EmailSubscription */
  emailSubscription: EmailSubscriptionMutation;
  /** Mutations that create and delete EnvironmentSecrets */
  environmentSecret: EnvironmentSecretMutation;
  /** Mutations that modify a Google Service Account Key */
  googleServiceAccountKey: GoogleServiceAccountKeyMutation;
  /** Mutations that modify the build credentials for an iOS app */
  iosAppBuildCredentials: IosAppBuildCredentialsMutation;
  /** Mutations that modify the credentials for an iOS app */
  iosAppCredentials: IosAppCredentialsMutation;
  keystoreGenerationUrl: KeystoreGenerationUrlMutation;
  /** Mutations that modify the currently authenticated User */
  me: MeMutation;
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
  appId?: InputMaybe<Scalars['ID']>;
};


export type RootMutationBuildArgs = {
  buildId?: InputMaybe<Scalars['ID']>;
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
  app: AppQuery;
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
  /** Top-level query object for querying Experimentation configuration. */
  experimentation: ExperimentationQuery;
  /** Top-level query object for querying Stripe Invoices. */
  invoice: InvoiceQuery;
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
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
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
  smsPhoneNumber?: InputMaybe<Scalars['String']>;
};

export type SecondFactorDeviceConfigurationResult = {
  __typename?: 'SecondFactorDeviceConfigurationResult';
  keyURI: Scalars['String'];
  secondFactorDevice: UserSecondFactorDevice;
  secret: Scalars['String'];
};

export type SecondFactorInitiationResult = {
  __typename?: 'SecondFactorInitiationResult';
  configurationResults: Array<SecondFactorDeviceConfigurationResult>;
  plaintextBackupCodes: Array<Scalars['String']>;
};

export enum SecondFactorMethod {
  /** Google Authenticator (TOTP) */
  Authenticator = 'AUTHENTICATOR',
  /** SMS */
  Sms = 'SMS'
}

export type SecondFactorRegenerateBackupCodesResult = {
  __typename?: 'SecondFactorRegenerateBackupCodesResult';
  plaintextBackupCodes: Array<Scalars['String']>;
};

export type Snack = Project & {
  __typename?: 'Snack';
  /** Description of the Snack */
  description: Scalars['String'];
  /** Full name of the Snack, e.g. "@john/mysnack", "@snack/245631" */
  fullName: Scalars['String'];
  /** Has the Snack been run without errors */
  hasBeenRunSuccessfully?: Maybe<Scalars['Boolean']>;
  hashId: Scalars['String'];
  /** @deprecated No longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** Draft status, which is true when the Snack was not saved explicitly, but auto-saved */
  isDraft: Scalars['Boolean'];
  /** Name of the Snack, e.g. "My Snack" */
  name: Scalars['String'];
  /** Preview image of the running snack */
  previewImage?: Maybe<Scalars['String']>;
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
  archiveUrl?: Maybe<Scalars['String']>;
  canRetry: Scalars['Boolean'];
  cancelingActor?: Maybe<Actor>;
  createdAt: Scalars['DateTime'];
  error?: Maybe<SubmissionError>;
  id: Scalars['ID'];
  initiatingActor?: Maybe<Actor>;
  iosConfig?: Maybe<IosSubmissionConfig>;
  logsUrl?: Maybe<Scalars['String']>;
  parentSubmission?: Maybe<Submission>;
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
  platform?: InputMaybe<AppPlatform>;
  status?: InputMaybe<SubmissionStatus>;
};

export type SubmissionMutation = {
  __typename?: 'SubmissionMutation';
  /** Cancel an EAS Submit submission */
  cancelSubmission: Submission;
  /** Create an Android EAS Submit submission */
  createAndroidSubmission: CreateSubmissionResult;
  /** Create an iOS EAS Submit submission */
  createIosSubmission: CreateSubmissionResult;
  /** Retry an EAS Submit submission */
  retrySubmission: CreateSubmissionResult;
};


export type SubmissionMutationCancelSubmissionArgs = {
  submissionId: Scalars['ID'];
};


export type SubmissionMutationCreateAndroidSubmissionArgs = {
  input: CreateAndroidSubmissionInput;
};


export type SubmissionMutationCreateIosSubmissionArgs = {
  input: CreateIosSubmissionInput;
};


export type SubmissionMutationRetrySubmissionArgs = {
  parentSubmissionId: Scalars['ID'];
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
  addons: Array<AddonDetails>;
  cancelledAt?: Maybe<Scalars['DateTime']>;
  concurrencies?: Maybe<Concurrencies>;
  endedAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  isDowngrading?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  nextInvoice?: Maybe<Scalars['DateTime']>;
  planId?: Maybe<Scalars['String']>;
  price: Scalars['Int'];
  status?: Maybe<Scalars['String']>;
  trialEnd?: Maybe<Scalars['DateTime']>;
  willCancel?: Maybe<Scalars['Boolean']>;
};

export type Update = ActivityTimelineProjectActivity & {
  __typename?: 'Update';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  awaitingCodeSigningInfo: Scalars['Boolean'];
  branch: UpdateBranch;
  branchId: Scalars['ID'];
  codeSigningInfo?: Maybe<CodeSigningInfo>;
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
  filter?: InputMaybe<UpdatesFilter>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type UpdateBranchMutation = {
  __typename?: 'UpdateBranchMutation';
  /** Create an EAS branch for an app */
  createUpdateBranchForApp: UpdateBranch;
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
  createUpdateChannelForApp: UpdateChannel;
  /** delete an EAS channel that doesn't point to any branches */
  deleteUpdateChannel: DeleteUpdateChannelResult;
  /**
   * Edit an EAS channel.
   *
   * In order to work with GraphQL formatting, the branchMapping should be a
   * stringified JSON supplied to the mutation as a variable.
   */
  editUpdateChannel: UpdateChannel;
};


export type UpdateChannelMutationCreateUpdateChannelForAppArgs = {
  appId: Scalars['ID'];
  branchMapping?: InputMaybe<Scalars['String']>;
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
  android?: InputMaybe<PartialManifest>;
  ios?: InputMaybe<PartialManifest>;
  web?: InputMaybe<PartialManifest>;
};

export type UpdateMutation = {
  __typename?: 'UpdateMutation';
  /** Delete an EAS update group */
  deleteUpdateGroup: DeleteUpdateGroupResult;
  /** Set code signing info for an update */
  setCodeSigningInfo: Update;
};


export type UpdateMutationDeleteUpdateGroupArgs = {
  group: Scalars['ID'];
};


export type UpdateMutationSetCodeSigningInfoArgs = {
  codeSigningInfo: CodeSigningInfoInput;
  updateId: Scalars['ID'];
};

export type UpdatesFilter = {
  platform?: InputMaybe<AppPlatform>;
  runtimeVersions?: InputMaybe<Array<Scalars['String']>>;
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

export type UsageMetricTotal = {
  __typename?: 'UsageMetricTotal';
  billingPeriod: BillingPeriod;
  id: Scalars['ID'];
  overageMetrics: Array<AccountUsageMetricAndCost>;
  planMetrics: Array<AccountUsageMetricAndCost>;
  /** Total cost of overages, in cents */
  totalCost: Scalars['Float'];
};

export enum UsageMetricType {
  Bandwidth = 'BANDWIDTH',
  Request = 'REQUEST',
  User = 'USER'
}

export enum UsageMetricsGranularity {
  Day = 'DAY',
  Hour = 'HOUR',
  Minute = 'MINUTE',
  Total = 'TOTAL'
}

export type UsageMetricsTimespan = {
  end: Scalars['DateTime'];
  start: Scalars['DateTime'];
};

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
  displayName: Scalars['String'];
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
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  filterTypes?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/** Represents a human (not robot) actor. */
export type UserAppsArgs = {
  includeUnpublished?: InputMaybe<Scalars['Boolean']>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents a human (not robot) actor. */
export type UserFeatureGatesArgs = {
  filter?: InputMaybe<Array<Scalars['String']>>;
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
  appetizeCode?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['String']>;
  firstName?: InputMaybe<Scalars['String']>;
  fullName?: InputMaybe<Scalars['String']>;
  githubUsername?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  industry?: InputMaybe<Scalars['String']>;
  isEmailUnsubscribed?: InputMaybe<Scalars['Boolean']>;
  isLegacy?: InputMaybe<Scalars['Boolean']>;
  isOnboarded?: InputMaybe<Scalars['Boolean']>;
  lastName?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  profilePhoto?: InputMaybe<Scalars['String']>;
  twitterUsername?: InputMaybe<Scalars['String']>;
  username?: InputMaybe<Scalars['String']>;
  wasLegacy?: InputMaybe<Scalars['Boolean']>;
};

/** An pending invitation sent to an email granting membership on an Account. */
export type UserInvitation = {
  __typename?: 'UserInvitation';
  accountName: Scalars['String'];
  created: Scalars['DateTime'];
  /** Email to which this invitation was sent */
  email: Scalars['String'];
  expires: Scalars['DateTime'];
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
  permissions: Array<InputMaybe<Permission>>;
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
  expires: Scalars['DateTime'];
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
  event?: InputMaybe<WebhookType>;
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
  Build = 'BUILD',
  Submit = 'SUBMIT'
}

export type DeleteAndroidAppBuildCredentialsResult = {
  __typename?: 'deleteAndroidAppBuildCredentialsResult';
  id: Scalars['ID'];
};

export type DeleteAndroidFcmResult = {
  __typename?: 'deleteAndroidFcmResult';
  id: Scalars['ID'];
};

export type DeleteAppStoreConnectApiKeyResult = {
  __typename?: 'deleteAppStoreConnectApiKeyResult';
  id: Scalars['ID'];
};

export type DeleteApplePushKeyResult = {
  __typename?: 'deleteApplePushKeyResult';
  id: Scalars['ID'];
};

export type CommonAppDataFragment = { __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: string | null, packageName: string, username: string, description: string, sdkVersion: string, privacy: string };

export type CommonSnackDataFragment = { __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean };

export type CurrentUserDataFragment = { __typename?: 'User', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, accounts: Array<{ __typename?: 'Account', id: string, name: string, owner?: { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> };

export type Home_AccountDataQueryVariables = Exact<{
  accountName: Scalars['String'];
  appLimit: Scalars['Int'];
  snackLimit: Scalars['Int'];
}>;


export type Home_AccountDataQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: string | null, packageName: string, username: string, description: string, sdkVersion: string, privacy: string }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } } };

export type BranchDetailsQueryVariables = Exact<{
  name: Scalars['String'];
  appId: Scalars['String'];
  platform: AppPlatform;
  runtimeVersions: Array<Scalars['String']> | Scalars['String'];
}>;


export type BranchDetailsQuery = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, slug: string, fullName: string, updateBranchByName?: { __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, platform: string, manifestPermalink: string }> } | null } } };

export type BranchesForProjectQueryVariables = Exact<{
  appId: Scalars['String'];
  platform: AppPlatform;
  runtimeVersions: Array<Scalars['String']> | Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type BranchesForProjectQuery = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, slug: string, fullName: string, username: string, published: boolean, description: string, githubUrl?: string | null, playStoreUrl?: string | null, appStoreUrl?: string | null, sdkVersion: string, iconUrl?: string | null, privacy: string, icon?: { __typename?: 'AppIcon', url: string } | null, updateBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, platform: string, manifestPermalink: string }> }> } } };

export type Home_CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type Home_CurrentUserQuery = { __typename?: 'RootQuery', viewer?: { __typename?: 'User', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, accounts: Array<{ __typename?: 'Account', id: string, name: string, owner?: { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> } | null };

export type Home_ProfileData2QueryVariables = Exact<{
  appLimit: Scalars['Int'];
  snackLimit: Scalars['Int'];
}>;


export type Home_ProfileData2Query = { __typename?: 'RootQuery', me?: { __typename?: 'User', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, appCount: number, accounts: Array<{ __typename?: 'Account', id: string, name: string }>, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: string | null, packageName: string, username: string, description: string, sdkVersion: string, privacy: string }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } | null };

export type Home_MyAppsQueryVariables = Exact<{
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_MyAppsQuery = { __typename?: 'RootQuery', me?: { __typename?: 'User', id: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: string | null, packageName: string, username: string, description: string, sdkVersion: string, privacy: string }> } | null };

export type Home_ProfileSnacksQueryVariables = Exact<{
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_ProfileSnacksQuery = { __typename?: 'RootQuery', me?: { __typename?: 'User', id: string, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } | null };

export type WebContainerProjectPage_QueryVariables = Exact<{
  appId: Scalars['String'];
  platform: AppPlatform;
  runtimeVersions: Array<Scalars['String']> | Scalars['String'];
}>;


export type WebContainerProjectPage_Query = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, slug: string, fullName: string, username: string, published: boolean, description: string, githubUrl?: string | null, playStoreUrl?: string | null, appStoreUrl?: string | null, sdkVersion: string, iconUrl?: string | null, privacy: string, icon?: { __typename?: 'AppIcon', url: string } | null, latestReleaseForReleaseChannel?: { __typename?: 'AppRelease', sdkVersion: string, runtimeVersion?: string | null } | null, updateBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, platform: string, manifestPermalink: string }> }> } } };

export type Home_AccountAppsQueryVariables = Exact<{
  accountName: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_AccountAppsQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: string | null, packageName: string, username: string, description: string, sdkVersion: string, privacy: string }> } } };

export type Home_AccountSnacksQueryVariables = Exact<{
  accountName: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_AccountSnacksQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } } };

export type Home_ViewerUsernameQueryVariables = Exact<{ [key: string]: never; }>;


export type Home_ViewerUsernameQuery = { __typename?: 'RootQuery', me?: { __typename?: 'User', id: string, username: string } | null };

export type DeleteAccountPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type DeleteAccountPermissionsQuery = { __typename?: 'RootQuery', me?: { __typename?: 'User', id: string, secondFactorDevices: Array<{ __typename?: 'UserSecondFactorDevice', id: string, name: string, isPrimary: boolean, isCertified: boolean, smsPhoneNumber?: string | null, method: SecondFactorMethod, createdAt: any }>, accounts: Array<{ __typename?: 'Account', id: string, name: string, users: Array<{ __typename?: 'UserPermission', permissions: Array<Permission>, user?: { __typename?: 'User', id: string, username: string } | null }> }> } | null };

export type UserSecondFactorDeviceDataFragment = { __typename?: 'UserSecondFactorDevice', id: string, name: string, isPrimary: boolean, isCertified: boolean, smsPhoneNumber?: string | null, method: SecondFactorMethod, createdAt: any };

export type SecondFactorDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type SecondFactorDevicesQuery = { __typename?: 'RootQuery', me?: { __typename?: 'User', id: string, emailVerified: boolean, secondFactorDevices: Array<{ __typename?: 'UserSecondFactorDevice', id: string, name: string, isPrimary: boolean, isCertified: boolean, smsPhoneNumber?: string | null, method: SecondFactorMethod, createdAt: any }> } | null };

export type ConfigurationResultsDataFragment = { __typename?: 'SecondFactorDeviceConfigurationResult', secret: string, keyURI: string, secondFactorDevice: { __typename?: 'UserSecondFactorDevice', id: string, name: string, isCertified: boolean, isPrimary: boolean, smsPhoneNumber?: string | null, method: SecondFactorMethod, createdAt: any } };

export type SecondFactorInitiationResultDataFragment = { __typename?: 'SecondFactorInitiationResult', plaintextBackupCodes: Array<string>, configurationResults: Array<{ __typename?: 'SecondFactorDeviceConfigurationResult', secret: string, keyURI: string, secondFactorDevice: { __typename?: 'UserSecondFactorDevice', id: string, name: string, isCertified: boolean, isPrimary: boolean, smsPhoneNumber?: string | null, method: SecondFactorMethod, createdAt: any } }> };

export type InitiateSecondFactorAuthenticationMutationVariables = Exact<{
  secondFactorDeviceConfigurations: Array<SecondFactorDeviceConfiguration> | SecondFactorDeviceConfiguration;
  recaptchaResponseToken?: InputMaybe<Scalars['String']>;
}>;


export type InitiateSecondFactorAuthenticationMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', initiateSecondFactorAuthentication: { __typename?: 'SecondFactorInitiationResult', plaintextBackupCodes: Array<string>, configurationResults: Array<{ __typename?: 'SecondFactorDeviceConfigurationResult', secret: string, keyURI: string, secondFactorDevice: { __typename?: 'UserSecondFactorDevice', id: string, name: string, isCertified: boolean, isPrimary: boolean, smsPhoneNumber?: string | null, method: SecondFactorMethod, createdAt: any } }> } } };

export type PurgeUnfinishedSecondFactorAuthenticationMutationVariables = Exact<{ [key: string]: never; }>;


export type PurgeUnfinishedSecondFactorAuthenticationMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', purgeUnfinishedSecondFactorAuthentication: { __typename?: 'SecondFactorBooleanResult', success: boolean } } };

export type CertifySecondFactorDeviceMutationVariables = Exact<{
  otp: Scalars['String'];
}>;


export type CertifySecondFactorDeviceMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', certifySecondFactorDevice: { __typename?: 'SecondFactorBooleanResult', success: boolean } } };

export type SendSmsotpToSecondFactorDeviceMutationVariables = Exact<{
  userSecondFactorDeviceId: Scalars['ID'];
}>;


export type SendSmsotpToSecondFactorDeviceMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', sendSMSOTPToSecondFactorDevice: { __typename?: 'SecondFactorBooleanResult', success: boolean } } };

export type DisableSecondFactorAuthenticationMutationVariables = Exact<{
  otp: Scalars['String'];
}>;


export type DisableSecondFactorAuthenticationMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', disableSecondFactorAuthentication: { __typename?: 'SecondFactorBooleanResult', success: boolean } } };

export type AddSecondFactorDeviceMutationVariables = Exact<{
  deviceConfiguration: SecondFactorDeviceConfiguration;
  otp: Scalars['String'];
}>;


export type AddSecondFactorDeviceMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', addSecondFactorDevice: { __typename?: 'SecondFactorDeviceConfigurationResult', secret: string, keyURI: string, secondFactorDevice: { __typename?: 'UserSecondFactorDevice', id: string, name: string, isCertified: boolean, isPrimary: boolean, smsPhoneNumber?: string | null, method: SecondFactorMethod, createdAt: any } } } };

export type SetPrimarySecondFactorDeviceMutationVariables = Exact<{
  userSecondFactorDeviceId: Scalars['ID'];
}>;


export type SetPrimarySecondFactorDeviceMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', setPrimarySecondFactorDevice: { __typename?: 'SecondFactorBooleanResult', success: boolean } } };

export type DeleteSecondFactorDeviceMutationVariables = Exact<{
  userSecondFactorDeviceId: Scalars['ID'];
  otp: Scalars['String'];
}>;


export type DeleteSecondFactorDeviceMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', deleteSecondFactorDevice: { __typename?: 'SecondFactorBooleanResult', success: boolean } } };

export type RegenerateSecondFactorBackupCodesMutationVariables = Exact<{
  otp: Scalars['String'];
}>;


export type RegenerateSecondFactorBackupCodesMutation = { __typename?: 'RootMutation', me: { __typename?: 'MeMutation', regenerateSecondFactorBackupCodes: { __typename?: 'SecondFactorRegenerateBackupCodesResult', plaintextBackupCodes: Array<string> } } };

export type UserPermissionDataFragment = { __typename?: 'UserPermission', permissions: Array<Permission>, role?: Role | null, user?: { __typename?: 'User', id: string, fullName?: string | null, profilePhoto: string, username: string, email?: string | null } | null };

export type HomeScreenDataQueryVariables = Exact<{
  accountName: Scalars['String'];
}>;


export type HomeScreenDataQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, isCurrent: boolean, appCount: number, owner?: { __typename?: 'User', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, accounts: Array<{ __typename?: 'Account', id: string, name: string, owner?: { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> } | null, apps: Array<{ __typename?: 'App', id: string, fullName: string, name: string, iconUrl?: string | null, packageName: string, username: string, description: string, sdkVersion: string, privacy: string }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean }> } } };

export const CommonAppDataFragmentDoc = gql`
    fragment CommonAppData on App {
  id
  fullName
  name
  iconUrl
  packageName
  username
  description
  sdkVersion
  privacy
}
    `;
export const CommonSnackDataFragmentDoc = gql`
    fragment CommonSnackData on Snack {
  id
  name
  description
  fullName
  slug
  isDraft
}
    `;
export const CurrentUserDataFragmentDoc = gql`
    fragment CurrentUserData on User {
  id
  username
  firstName
  lastName
  profilePhoto
  accounts {
    id
    name
    owner {
      id
      username
      profilePhoto
      firstName
      fullName
      lastName
    }
  }
}
    `;
export const UserSecondFactorDeviceDataFragmentDoc = gql`
    fragment UserSecondFactorDeviceData on UserSecondFactorDevice {
  id
  name
  isPrimary
  isCertified
  smsPhoneNumber
  method
  createdAt
}
    `;
export const ConfigurationResultsDataFragmentDoc = gql`
    fragment ConfigurationResultsData on SecondFactorDeviceConfigurationResult {
  secondFactorDevice {
    id
    name
    isCertified
    isPrimary
    smsPhoneNumber
    method
    createdAt
  }
  secret
  keyURI
}
    `;
export const SecondFactorInitiationResultDataFragmentDoc = gql`
    fragment SecondFactorInitiationResultData on SecondFactorInitiationResult {
  configurationResults {
    ...ConfigurationResultsData
  }
  plaintextBackupCodes
}
    ${ConfigurationResultsDataFragmentDoc}`;
export const UserPermissionDataFragmentDoc = gql`
    fragment UserPermissionData on UserPermission {
  permissions
  role
  user {
    id
    fullName
    profilePhoto
    username
    email
  }
}
    `;
export const Home_AccountDataDocument = gql`
    query Home_AccountData($accountName: String!, $appLimit: Int!, $snackLimit: Int!) {
  account {
    byName(accountName: $accountName) {
      id
      name
      appCount
      apps(limit: $appLimit, offset: 0, includeUnpublished: true) {
        ...CommonAppData
      }
      snacks(limit: $snackLimit, offset: 0) {
        ...CommonSnackData
      }
    }
  }
}
    ${CommonAppDataFragmentDoc}
${CommonSnackDataFragmentDoc}`;

/**
 * __useHome_AccountDataQuery__
 *
 * To run a query within a React component, call `useHome_AccountDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_AccountDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_AccountDataQuery({
 *   variables: {
 *      accountName: // value for 'accountName'
 *      appLimit: // value for 'appLimit'
 *      snackLimit: // value for 'snackLimit'
 *   },
 * });
 */
export function useHome_AccountDataQuery(baseOptions: Apollo.QueryHookOptions<Home_AccountDataQuery, Home_AccountDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_AccountDataQuery, Home_AccountDataQueryVariables>(Home_AccountDataDocument, options);
      }
export function useHome_AccountDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_AccountDataQuery, Home_AccountDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_AccountDataQuery, Home_AccountDataQueryVariables>(Home_AccountDataDocument, options);
        }
export type Home_AccountDataQueryHookResult = ReturnType<typeof useHome_AccountDataQuery>;
export type Home_AccountDataLazyQueryHookResult = ReturnType<typeof useHome_AccountDataLazyQuery>;
export type Home_AccountDataQueryResult = Apollo.QueryResult<Home_AccountDataQuery, Home_AccountDataQueryVariables>;
export function refetchHome_AccountDataQuery(variables: Home_AccountDataQueryVariables) {
      return { query: Home_AccountDataDocument, variables: variables }
    }
export const BranchDetailsDocument = gql`
    query BranchDetails($name: String!, $appId: String!, $platform: AppPlatform!, $runtimeVersions: [String!]!) {
  app {
    byId(appId: $appId) {
      id
      name
      slug
      fullName
      updateBranchByName(name: $name) {
        id
        name
        updates(
          limit: 100
          offset: 0
          filter: {platform: $platform, runtimeVersions: $runtimeVersions}
        ) {
          id
          group
          message
          createdAt
          runtimeVersion
          platform
          manifestPermalink
        }
      }
    }
  }
}
    `;

/**
 * __useBranchDetailsQuery__
 *
 * To run a query within a React component, call `useBranchDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useBranchDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBranchDetailsQuery({
 *   variables: {
 *      name: // value for 'name'
 *      appId: // value for 'appId'
 *      platform: // value for 'platform'
 *      runtimeVersions: // value for 'runtimeVersions'
 *   },
 * });
 */
export function useBranchDetailsQuery(baseOptions: Apollo.QueryHookOptions<BranchDetailsQuery, BranchDetailsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BranchDetailsQuery, BranchDetailsQueryVariables>(BranchDetailsDocument, options);
      }
export function useBranchDetailsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BranchDetailsQuery, BranchDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BranchDetailsQuery, BranchDetailsQueryVariables>(BranchDetailsDocument, options);
        }
export type BranchDetailsQueryHookResult = ReturnType<typeof useBranchDetailsQuery>;
export type BranchDetailsLazyQueryHookResult = ReturnType<typeof useBranchDetailsLazyQuery>;
export type BranchDetailsQueryResult = Apollo.QueryResult<BranchDetailsQuery, BranchDetailsQueryVariables>;
export function refetchBranchDetailsQuery(variables: BranchDetailsQueryVariables) {
      return { query: BranchDetailsDocument, variables: variables }
    }
export const BranchesForProjectDocument = gql`
    query BranchesForProject($appId: String!, $platform: AppPlatform!, $runtimeVersions: [String!]!, $limit: Int!, $offset: Int!) {
  app {
    byId(appId: $appId) {
      id
      name
      slug
      fullName
      username
      published
      description
      githubUrl
      playStoreUrl
      appStoreUrl
      sdkVersion
      iconUrl
      privacy
      icon {
        url
      }
      updateBranches(limit: $limit, offset: $offset) {
        id
        name
        updates(
          limit: 1
          offset: 0
          filter: {platform: $platform, runtimeVersions: $runtimeVersions}
        ) {
          id
          group
          message
          createdAt
          runtimeVersion
          platform
          manifestPermalink
        }
      }
    }
  }
}
    `;

/**
 * __useBranchesForProjectQuery__
 *
 * To run a query within a React component, call `useBranchesForProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useBranchesForProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBranchesForProjectQuery({
 *   variables: {
 *      appId: // value for 'appId'
 *      platform: // value for 'platform'
 *      runtimeVersions: // value for 'runtimeVersions'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useBranchesForProjectQuery(baseOptions: Apollo.QueryHookOptions<BranchesForProjectQuery, BranchesForProjectQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BranchesForProjectQuery, BranchesForProjectQueryVariables>(BranchesForProjectDocument, options);
      }
export function useBranchesForProjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BranchesForProjectQuery, BranchesForProjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BranchesForProjectQuery, BranchesForProjectQueryVariables>(BranchesForProjectDocument, options);
        }
export type BranchesForProjectQueryHookResult = ReturnType<typeof useBranchesForProjectQuery>;
export type BranchesForProjectLazyQueryHookResult = ReturnType<typeof useBranchesForProjectLazyQuery>;
export type BranchesForProjectQueryResult = Apollo.QueryResult<BranchesForProjectQuery, BranchesForProjectQueryVariables>;
export function refetchBranchesForProjectQuery(variables: BranchesForProjectQueryVariables) {
      return { query: BranchesForProjectDocument, variables: variables }
    }
export const Home_CurrentUserDocument = gql`
    query Home_CurrentUser {
  viewer {
    ...CurrentUserData
  }
}
    ${CurrentUserDataFragmentDoc}`;

/**
 * __useHome_CurrentUserQuery__
 *
 * To run a query within a React component, call `useHome_CurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_CurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_CurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useHome_CurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<Home_CurrentUserQuery, Home_CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_CurrentUserQuery, Home_CurrentUserQueryVariables>(Home_CurrentUserDocument, options);
      }
export function useHome_CurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_CurrentUserQuery, Home_CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_CurrentUserQuery, Home_CurrentUserQueryVariables>(Home_CurrentUserDocument, options);
        }
export type Home_CurrentUserQueryHookResult = ReturnType<typeof useHome_CurrentUserQuery>;
export type Home_CurrentUserLazyQueryHookResult = ReturnType<typeof useHome_CurrentUserLazyQuery>;
export type Home_CurrentUserQueryResult = Apollo.QueryResult<Home_CurrentUserQuery, Home_CurrentUserQueryVariables>;
export function refetchHome_CurrentUserQuery(variables?: Home_CurrentUserQueryVariables) {
      return { query: Home_CurrentUserDocument, variables: variables }
    }
export const Home_ProfileData2Document = gql`
    query Home_ProfileData2($appLimit: Int!, $snackLimit: Int!) {
  me {
    id
    username
    firstName
    lastName
    profilePhoto
    accounts {
      id
      name
    }
    appCount
    apps(limit: $appLimit, offset: 0, includeUnpublished: true) {
      ...CommonAppData
    }
    snacks(limit: $snackLimit, offset: 0) {
      ...CommonSnackData
    }
  }
}
    ${CommonAppDataFragmentDoc}
${CommonSnackDataFragmentDoc}`;

/**
 * __useHome_ProfileData2Query__
 *
 * To run a query within a React component, call `useHome_ProfileData2Query` and pass it any options that fit your needs.
 * When your component renders, `useHome_ProfileData2Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_ProfileData2Query({
 *   variables: {
 *      appLimit: // value for 'appLimit'
 *      snackLimit: // value for 'snackLimit'
 *   },
 * });
 */
export function useHome_ProfileData2Query(baseOptions: Apollo.QueryHookOptions<Home_ProfileData2Query, Home_ProfileData2QueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_ProfileData2Query, Home_ProfileData2QueryVariables>(Home_ProfileData2Document, options);
      }
export function useHome_ProfileData2LazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_ProfileData2Query, Home_ProfileData2QueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_ProfileData2Query, Home_ProfileData2QueryVariables>(Home_ProfileData2Document, options);
        }
export type Home_ProfileData2QueryHookResult = ReturnType<typeof useHome_ProfileData2Query>;
export type Home_ProfileData2LazyQueryHookResult = ReturnType<typeof useHome_ProfileData2LazyQuery>;
export type Home_ProfileData2QueryResult = Apollo.QueryResult<Home_ProfileData2Query, Home_ProfileData2QueryVariables>;
export function refetchHome_ProfileData2Query(variables: Home_ProfileData2QueryVariables) {
      return { query: Home_ProfileData2Document, variables: variables }
    }
export const Home_MyAppsDocument = gql`
    query Home_MyApps($limit: Int!, $offset: Int!) {
  me {
    id
    appCount
    apps(limit: $limit, offset: $offset, includeUnpublished: true) {
      ...CommonAppData
    }
  }
}
    ${CommonAppDataFragmentDoc}`;

/**
 * __useHome_MyAppsQuery__
 *
 * To run a query within a React component, call `useHome_MyAppsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_MyAppsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_MyAppsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useHome_MyAppsQuery(baseOptions: Apollo.QueryHookOptions<Home_MyAppsQuery, Home_MyAppsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_MyAppsQuery, Home_MyAppsQueryVariables>(Home_MyAppsDocument, options);
      }
export function useHome_MyAppsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_MyAppsQuery, Home_MyAppsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_MyAppsQuery, Home_MyAppsQueryVariables>(Home_MyAppsDocument, options);
        }
export type Home_MyAppsQueryHookResult = ReturnType<typeof useHome_MyAppsQuery>;
export type Home_MyAppsLazyQueryHookResult = ReturnType<typeof useHome_MyAppsLazyQuery>;
export type Home_MyAppsQueryResult = Apollo.QueryResult<Home_MyAppsQuery, Home_MyAppsQueryVariables>;
export function refetchHome_MyAppsQuery(variables: Home_MyAppsQueryVariables) {
      return { query: Home_MyAppsDocument, variables: variables }
    }
export const Home_ProfileSnacksDocument = gql`
    query Home_ProfileSnacks($limit: Int!, $offset: Int!) {
  me {
    id
    snacks(limit: $limit, offset: $offset) {
      ...CommonSnackData
    }
  }
}
    ${CommonSnackDataFragmentDoc}`;

/**
 * __useHome_ProfileSnacksQuery__
 *
 * To run a query within a React component, call `useHome_ProfileSnacksQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_ProfileSnacksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_ProfileSnacksQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useHome_ProfileSnacksQuery(baseOptions: Apollo.QueryHookOptions<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>(Home_ProfileSnacksDocument, options);
      }
export function useHome_ProfileSnacksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>(Home_ProfileSnacksDocument, options);
        }
export type Home_ProfileSnacksQueryHookResult = ReturnType<typeof useHome_ProfileSnacksQuery>;
export type Home_ProfileSnacksLazyQueryHookResult = ReturnType<typeof useHome_ProfileSnacksLazyQuery>;
export type Home_ProfileSnacksQueryResult = Apollo.QueryResult<Home_ProfileSnacksQuery, Home_ProfileSnacksQueryVariables>;
export function refetchHome_ProfileSnacksQuery(variables: Home_ProfileSnacksQueryVariables) {
      return { query: Home_ProfileSnacksDocument, variables: variables }
    }
export const WebContainerProjectPage_QueryDocument = gql`
    query WebContainerProjectPage_Query($appId: String!, $platform: AppPlatform!, $runtimeVersions: [String!]!) {
  app {
    byId(appId: $appId) {
      id
      name
      slug
      fullName
      username
      published
      description
      githubUrl
      playStoreUrl
      appStoreUrl
      sdkVersion
      iconUrl
      privacy
      icon {
        url
      }
      latestReleaseForReleaseChannel(platform: $platform, releaseChannel: "default") {
        sdkVersion
        runtimeVersion
      }
      updateBranches(limit: 100, offset: 0) {
        id
        name
        updates(
          limit: 1
          offset: 0
          filter: {platform: $platform, runtimeVersions: $runtimeVersions}
        ) {
          id
          group
          message
          createdAt
          runtimeVersion
          platform
          manifestPermalink
        }
      }
    }
  }
}
    `;

/**
 * __useWebContainerProjectPage_Query__
 *
 * To run a query within a React component, call `useWebContainerProjectPage_Query` and pass it any options that fit your needs.
 * When your component renders, `useWebContainerProjectPage_Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWebContainerProjectPage_Query({
 *   variables: {
 *      appId: // value for 'appId'
 *      platform: // value for 'platform'
 *      runtimeVersions: // value for 'runtimeVersions'
 *   },
 * });
 */
export function useWebContainerProjectPage_Query(baseOptions: Apollo.QueryHookOptions<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>(WebContainerProjectPage_QueryDocument, options);
      }
export function useWebContainerProjectPage_QueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>(WebContainerProjectPage_QueryDocument, options);
        }
export type WebContainerProjectPage_QueryHookResult = ReturnType<typeof useWebContainerProjectPage_Query>;
export type WebContainerProjectPage_QueryLazyQueryHookResult = ReturnType<typeof useWebContainerProjectPage_QueryLazyQuery>;
export type WebContainerProjectPage_QueryQueryResult = Apollo.QueryResult<WebContainerProjectPage_Query, WebContainerProjectPage_QueryVariables>;
export function refetchWebContainerProjectPage_Query(variables: WebContainerProjectPage_QueryVariables) {
      return { query: WebContainerProjectPage_QueryDocument, variables: variables }
    }
export const Home_AccountAppsDocument = gql`
    query Home_AccountApps($accountName: String!, $limit: Int!, $offset: Int!) {
  account {
    byName(accountName: $accountName) {
      id
      appCount
      apps(limit: $limit, offset: $offset, includeUnpublished: true) {
        ...CommonAppData
      }
    }
  }
}
    ${CommonAppDataFragmentDoc}`;

/**
 * __useHome_AccountAppsQuery__
 *
 * To run a query within a React component, call `useHome_AccountAppsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_AccountAppsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_AccountAppsQuery({
 *   variables: {
 *      accountName: // value for 'accountName'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useHome_AccountAppsQuery(baseOptions: Apollo.QueryHookOptions<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>(Home_AccountAppsDocument, options);
      }
export function useHome_AccountAppsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>(Home_AccountAppsDocument, options);
        }
export type Home_AccountAppsQueryHookResult = ReturnType<typeof useHome_AccountAppsQuery>;
export type Home_AccountAppsLazyQueryHookResult = ReturnType<typeof useHome_AccountAppsLazyQuery>;
export type Home_AccountAppsQueryResult = Apollo.QueryResult<Home_AccountAppsQuery, Home_AccountAppsQueryVariables>;
export function refetchHome_AccountAppsQuery(variables: Home_AccountAppsQueryVariables) {
      return { query: Home_AccountAppsDocument, variables: variables }
    }
export const Home_AccountSnacksDocument = gql`
    query Home_AccountSnacks($accountName: String!, $limit: Int!, $offset: Int!) {
  account {
    byName(accountName: $accountName) {
      id
      name
      snacks(limit: $limit, offset: $offset) {
        ...CommonSnackData
      }
    }
  }
}
    ${CommonSnackDataFragmentDoc}`;

/**
 * __useHome_AccountSnacksQuery__
 *
 * To run a query within a React component, call `useHome_AccountSnacksQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_AccountSnacksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_AccountSnacksQuery({
 *   variables: {
 *      accountName: // value for 'accountName'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useHome_AccountSnacksQuery(baseOptions: Apollo.QueryHookOptions<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>(Home_AccountSnacksDocument, options);
      }
export function useHome_AccountSnacksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>(Home_AccountSnacksDocument, options);
        }
export type Home_AccountSnacksQueryHookResult = ReturnType<typeof useHome_AccountSnacksQuery>;
export type Home_AccountSnacksLazyQueryHookResult = ReturnType<typeof useHome_AccountSnacksLazyQuery>;
export type Home_AccountSnacksQueryResult = Apollo.QueryResult<Home_AccountSnacksQuery, Home_AccountSnacksQueryVariables>;
export function refetchHome_AccountSnacksQuery(variables: Home_AccountSnacksQueryVariables) {
      return { query: Home_AccountSnacksDocument, variables: variables }
    }
export const Home_ViewerUsernameDocument = gql`
    query Home_ViewerUsername {
  me {
    id
    username
  }
}
    `;

/**
 * __useHome_ViewerUsernameQuery__
 *
 * To run a query within a React component, call `useHome_ViewerUsernameQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_ViewerUsernameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_ViewerUsernameQuery({
 *   variables: {
 *   },
 * });
 */
export function useHome_ViewerUsernameQuery(baseOptions?: Apollo.QueryHookOptions<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>(Home_ViewerUsernameDocument, options);
      }
export function useHome_ViewerUsernameLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>(Home_ViewerUsernameDocument, options);
        }
export type Home_ViewerUsernameQueryHookResult = ReturnType<typeof useHome_ViewerUsernameQuery>;
export type Home_ViewerUsernameLazyQueryHookResult = ReturnType<typeof useHome_ViewerUsernameLazyQuery>;
export type Home_ViewerUsernameQueryResult = Apollo.QueryResult<Home_ViewerUsernameQuery, Home_ViewerUsernameQueryVariables>;
export function refetchHome_ViewerUsernameQuery(variables?: Home_ViewerUsernameQueryVariables) {
      return { query: Home_ViewerUsernameDocument, variables: variables }
    }
export const DeleteAccountPermissionsDocument = gql`
    query DeleteAccountPermissions {
  me {
    id
    secondFactorDevices {
      ...UserSecondFactorDeviceData
    }
    accounts {
      id
      name
      users {
        permissions
        user {
          id
          username
        }
      }
    }
  }
}
    ${UserSecondFactorDeviceDataFragmentDoc}`;

/**
 * __useDeleteAccountPermissionsQuery__
 *
 * To run a query within a React component, call `useDeleteAccountPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useDeleteAccountPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDeleteAccountPermissionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useDeleteAccountPermissionsQuery(baseOptions?: Apollo.QueryHookOptions<DeleteAccountPermissionsQuery, DeleteAccountPermissionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DeleteAccountPermissionsQuery, DeleteAccountPermissionsQueryVariables>(DeleteAccountPermissionsDocument, options);
      }
export function useDeleteAccountPermissionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DeleteAccountPermissionsQuery, DeleteAccountPermissionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DeleteAccountPermissionsQuery, DeleteAccountPermissionsQueryVariables>(DeleteAccountPermissionsDocument, options);
        }
export type DeleteAccountPermissionsQueryHookResult = ReturnType<typeof useDeleteAccountPermissionsQuery>;
export type DeleteAccountPermissionsLazyQueryHookResult = ReturnType<typeof useDeleteAccountPermissionsLazyQuery>;
export type DeleteAccountPermissionsQueryResult = Apollo.QueryResult<DeleteAccountPermissionsQuery, DeleteAccountPermissionsQueryVariables>;
export function refetchDeleteAccountPermissionsQuery(variables?: DeleteAccountPermissionsQueryVariables) {
      return { query: DeleteAccountPermissionsDocument, variables: variables }
    }
export const SecondFactorDevicesQueryDocument = gql`
    query SecondFactorDevicesQuery {
  me {
    id
    emailVerified
    secondFactorDevices {
      ...UserSecondFactorDeviceData
    }
  }
}
    ${UserSecondFactorDeviceDataFragmentDoc}`;

/**
 * __useSecondFactorDevicesQuery__
 *
 * To run a query within a React component, call `useSecondFactorDevicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSecondFactorDevicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSecondFactorDevicesQuery({
 *   variables: {
 *   },
 * });
 */
export function useSecondFactorDevicesQuery(baseOptions?: Apollo.QueryHookOptions<SecondFactorDevicesQuery, SecondFactorDevicesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SecondFactorDevicesQuery, SecondFactorDevicesQueryVariables>(SecondFactorDevicesQueryDocument, options);
      }
export function useSecondFactorDevicesQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SecondFactorDevicesQuery, SecondFactorDevicesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SecondFactorDevicesQuery, SecondFactorDevicesQueryVariables>(SecondFactorDevicesQueryDocument, options);
        }
export type SecondFactorDevicesQueryHookResult = ReturnType<typeof useSecondFactorDevicesQuery>;
export type SecondFactorDevicesQueryLazyQueryHookResult = ReturnType<typeof useSecondFactorDevicesQueryLazyQuery>;
export type SecondFactorDevicesQueryQueryResult = Apollo.QueryResult<SecondFactorDevicesQuery, SecondFactorDevicesQueryVariables>;
export function refetchSecondFactorDevicesQuery(variables?: SecondFactorDevicesQueryVariables) {
      return { query: SecondFactorDevicesQueryDocument, variables: variables }
    }
export const InitiateSecondFactorAuthenticationMutationDocument = gql`
    mutation InitiateSecondFactorAuthenticationMutation($secondFactorDeviceConfigurations: [SecondFactorDeviceConfiguration!]!, $recaptchaResponseToken: String) {
  me {
    initiateSecondFactorAuthentication(
      deviceConfigurations: $secondFactorDeviceConfigurations
      recaptchaResponseToken: $recaptchaResponseToken
    ) {
      ...SecondFactorInitiationResultData
    }
  }
}
    ${SecondFactorInitiationResultDataFragmentDoc}`;
export type InitiateSecondFactorAuthenticationMutationMutationFn = Apollo.MutationFunction<InitiateSecondFactorAuthenticationMutation, InitiateSecondFactorAuthenticationMutationVariables>;

/**
 * __useInitiateSecondFactorAuthenticationMutation__
 *
 * To run a mutation, you first call `useInitiateSecondFactorAuthenticationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInitiateSecondFactorAuthenticationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [initiateSecondFactorAuthenticationMutation, { data, loading, error }] = useInitiateSecondFactorAuthenticationMutation({
 *   variables: {
 *      secondFactorDeviceConfigurations: // value for 'secondFactorDeviceConfigurations'
 *      recaptchaResponseToken: // value for 'recaptchaResponseToken'
 *   },
 * });
 */
export function useInitiateSecondFactorAuthenticationMutation(baseOptions?: Apollo.MutationHookOptions<InitiateSecondFactorAuthenticationMutation, InitiateSecondFactorAuthenticationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<InitiateSecondFactorAuthenticationMutation, InitiateSecondFactorAuthenticationMutationVariables>(InitiateSecondFactorAuthenticationMutationDocument, options);
      }
export type InitiateSecondFactorAuthenticationMutationHookResult = ReturnType<typeof useInitiateSecondFactorAuthenticationMutation>;
export type InitiateSecondFactorAuthenticationMutationMutationResult = Apollo.MutationResult<InitiateSecondFactorAuthenticationMutation>;
export type InitiateSecondFactorAuthenticationMutationMutationOptions = Apollo.BaseMutationOptions<InitiateSecondFactorAuthenticationMutation, InitiateSecondFactorAuthenticationMutationVariables>;
export const PurgeUnfinishedSecondFactorAuthenticationMutationDocument = gql`
    mutation PurgeUnfinishedSecondFactorAuthenticationMutation {
  me {
    purgeUnfinishedSecondFactorAuthentication {
      success
    }
  }
}
    `;
export type PurgeUnfinishedSecondFactorAuthenticationMutationMutationFn = Apollo.MutationFunction<PurgeUnfinishedSecondFactorAuthenticationMutation, PurgeUnfinishedSecondFactorAuthenticationMutationVariables>;

/**
 * __usePurgeUnfinishedSecondFactorAuthenticationMutation__
 *
 * To run a mutation, you first call `usePurgeUnfinishedSecondFactorAuthenticationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePurgeUnfinishedSecondFactorAuthenticationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [purgeUnfinishedSecondFactorAuthenticationMutation, { data, loading, error }] = usePurgeUnfinishedSecondFactorAuthenticationMutation({
 *   variables: {
 *   },
 * });
 */
export function usePurgeUnfinishedSecondFactorAuthenticationMutation(baseOptions?: Apollo.MutationHookOptions<PurgeUnfinishedSecondFactorAuthenticationMutation, PurgeUnfinishedSecondFactorAuthenticationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PurgeUnfinishedSecondFactorAuthenticationMutation, PurgeUnfinishedSecondFactorAuthenticationMutationVariables>(PurgeUnfinishedSecondFactorAuthenticationMutationDocument, options);
      }
export type PurgeUnfinishedSecondFactorAuthenticationMutationHookResult = ReturnType<typeof usePurgeUnfinishedSecondFactorAuthenticationMutation>;
export type PurgeUnfinishedSecondFactorAuthenticationMutationMutationResult = Apollo.MutationResult<PurgeUnfinishedSecondFactorAuthenticationMutation>;
export type PurgeUnfinishedSecondFactorAuthenticationMutationMutationOptions = Apollo.BaseMutationOptions<PurgeUnfinishedSecondFactorAuthenticationMutation, PurgeUnfinishedSecondFactorAuthenticationMutationVariables>;
export const CertifySecondFactorDeviceMutationDocument = gql`
    mutation CertifySecondFactorDeviceMutation($otp: String!) {
  me {
    certifySecondFactorDevice(otp: $otp) {
      success
    }
  }
}
    `;
export type CertifySecondFactorDeviceMutationMutationFn = Apollo.MutationFunction<CertifySecondFactorDeviceMutation, CertifySecondFactorDeviceMutationVariables>;

/**
 * __useCertifySecondFactorDeviceMutation__
 *
 * To run a mutation, you first call `useCertifySecondFactorDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCertifySecondFactorDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [certifySecondFactorDeviceMutation, { data, loading, error }] = useCertifySecondFactorDeviceMutation({
 *   variables: {
 *      otp: // value for 'otp'
 *   },
 * });
 */
export function useCertifySecondFactorDeviceMutation(baseOptions?: Apollo.MutationHookOptions<CertifySecondFactorDeviceMutation, CertifySecondFactorDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CertifySecondFactorDeviceMutation, CertifySecondFactorDeviceMutationVariables>(CertifySecondFactorDeviceMutationDocument, options);
      }
export type CertifySecondFactorDeviceMutationHookResult = ReturnType<typeof useCertifySecondFactorDeviceMutation>;
export type CertifySecondFactorDeviceMutationMutationResult = Apollo.MutationResult<CertifySecondFactorDeviceMutation>;
export type CertifySecondFactorDeviceMutationMutationOptions = Apollo.BaseMutationOptions<CertifySecondFactorDeviceMutation, CertifySecondFactorDeviceMutationVariables>;
export const SendSmsotpToSecondFactorDeviceMutationDocument = gql`
    mutation SendSMSOTPToSecondFactorDeviceMutation($userSecondFactorDeviceId: ID!) {
  me {
    sendSMSOTPToSecondFactorDevice(
      userSecondFactorDeviceId: $userSecondFactorDeviceId
    ) {
      success
    }
  }
}
    `;
export type SendSmsotpToSecondFactorDeviceMutationMutationFn = Apollo.MutationFunction<SendSmsotpToSecondFactorDeviceMutation, SendSmsotpToSecondFactorDeviceMutationVariables>;

/**
 * __useSendSmsotpToSecondFactorDeviceMutation__
 *
 * To run a mutation, you first call `useSendSmsotpToSecondFactorDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendSmsotpToSecondFactorDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendSmsotpToSecondFactorDeviceMutation, { data, loading, error }] = useSendSmsotpToSecondFactorDeviceMutation({
 *   variables: {
 *      userSecondFactorDeviceId: // value for 'userSecondFactorDeviceId'
 *   },
 * });
 */
export function useSendSmsotpToSecondFactorDeviceMutation(baseOptions?: Apollo.MutationHookOptions<SendSmsotpToSecondFactorDeviceMutation, SendSmsotpToSecondFactorDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendSmsotpToSecondFactorDeviceMutation, SendSmsotpToSecondFactorDeviceMutationVariables>(SendSmsotpToSecondFactorDeviceMutationDocument, options);
      }
export type SendSmsotpToSecondFactorDeviceMutationHookResult = ReturnType<typeof useSendSmsotpToSecondFactorDeviceMutation>;
export type SendSmsotpToSecondFactorDeviceMutationMutationResult = Apollo.MutationResult<SendSmsotpToSecondFactorDeviceMutation>;
export type SendSmsotpToSecondFactorDeviceMutationMutationOptions = Apollo.BaseMutationOptions<SendSmsotpToSecondFactorDeviceMutation, SendSmsotpToSecondFactorDeviceMutationVariables>;
export const DisableSecondFactorAuthenticationMutationDocument = gql`
    mutation DisableSecondFactorAuthenticationMutation($otp: String!) {
  me {
    disableSecondFactorAuthentication(otp: $otp) {
      success
    }
  }
}
    `;
export type DisableSecondFactorAuthenticationMutationMutationFn = Apollo.MutationFunction<DisableSecondFactorAuthenticationMutation, DisableSecondFactorAuthenticationMutationVariables>;

/**
 * __useDisableSecondFactorAuthenticationMutation__
 *
 * To run a mutation, you first call `useDisableSecondFactorAuthenticationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDisableSecondFactorAuthenticationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [disableSecondFactorAuthenticationMutation, { data, loading, error }] = useDisableSecondFactorAuthenticationMutation({
 *   variables: {
 *      otp: // value for 'otp'
 *   },
 * });
 */
export function useDisableSecondFactorAuthenticationMutation(baseOptions?: Apollo.MutationHookOptions<DisableSecondFactorAuthenticationMutation, DisableSecondFactorAuthenticationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DisableSecondFactorAuthenticationMutation, DisableSecondFactorAuthenticationMutationVariables>(DisableSecondFactorAuthenticationMutationDocument, options);
      }
export type DisableSecondFactorAuthenticationMutationHookResult = ReturnType<typeof useDisableSecondFactorAuthenticationMutation>;
export type DisableSecondFactorAuthenticationMutationMutationResult = Apollo.MutationResult<DisableSecondFactorAuthenticationMutation>;
export type DisableSecondFactorAuthenticationMutationMutationOptions = Apollo.BaseMutationOptions<DisableSecondFactorAuthenticationMutation, DisableSecondFactorAuthenticationMutationVariables>;
export const AddSecondFactorDeviceMutationDocument = gql`
    mutation AddSecondFactorDeviceMutation($deviceConfiguration: SecondFactorDeviceConfiguration!, $otp: String!) {
  me {
    addSecondFactorDevice(deviceConfiguration: $deviceConfiguration, otp: $otp) {
      ...ConfigurationResultsData
    }
  }
}
    ${ConfigurationResultsDataFragmentDoc}`;
export type AddSecondFactorDeviceMutationMutationFn = Apollo.MutationFunction<AddSecondFactorDeviceMutation, AddSecondFactorDeviceMutationVariables>;

/**
 * __useAddSecondFactorDeviceMutation__
 *
 * To run a mutation, you first call `useAddSecondFactorDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddSecondFactorDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addSecondFactorDeviceMutation, { data, loading, error }] = useAddSecondFactorDeviceMutation({
 *   variables: {
 *      deviceConfiguration: // value for 'deviceConfiguration'
 *      otp: // value for 'otp'
 *   },
 * });
 */
export function useAddSecondFactorDeviceMutation(baseOptions?: Apollo.MutationHookOptions<AddSecondFactorDeviceMutation, AddSecondFactorDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddSecondFactorDeviceMutation, AddSecondFactorDeviceMutationVariables>(AddSecondFactorDeviceMutationDocument, options);
      }
export type AddSecondFactorDeviceMutationHookResult = ReturnType<typeof useAddSecondFactorDeviceMutation>;
export type AddSecondFactorDeviceMutationMutationResult = Apollo.MutationResult<AddSecondFactorDeviceMutation>;
export type AddSecondFactorDeviceMutationMutationOptions = Apollo.BaseMutationOptions<AddSecondFactorDeviceMutation, AddSecondFactorDeviceMutationVariables>;
export const SetPrimarySecondFactorDeviceMutationDocument = gql`
    mutation SetPrimarySecondFactorDeviceMutation($userSecondFactorDeviceId: ID!) {
  me {
    setPrimarySecondFactorDevice(
      userSecondFactorDeviceId: $userSecondFactorDeviceId
    ) {
      success
    }
  }
}
    `;
export type SetPrimarySecondFactorDeviceMutationMutationFn = Apollo.MutationFunction<SetPrimarySecondFactorDeviceMutation, SetPrimarySecondFactorDeviceMutationVariables>;

/**
 * __useSetPrimarySecondFactorDeviceMutation__
 *
 * To run a mutation, you first call `useSetPrimarySecondFactorDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetPrimarySecondFactorDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setPrimarySecondFactorDeviceMutation, { data, loading, error }] = useSetPrimarySecondFactorDeviceMutation({
 *   variables: {
 *      userSecondFactorDeviceId: // value for 'userSecondFactorDeviceId'
 *   },
 * });
 */
export function useSetPrimarySecondFactorDeviceMutation(baseOptions?: Apollo.MutationHookOptions<SetPrimarySecondFactorDeviceMutation, SetPrimarySecondFactorDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetPrimarySecondFactorDeviceMutation, SetPrimarySecondFactorDeviceMutationVariables>(SetPrimarySecondFactorDeviceMutationDocument, options);
      }
export type SetPrimarySecondFactorDeviceMutationHookResult = ReturnType<typeof useSetPrimarySecondFactorDeviceMutation>;
export type SetPrimarySecondFactorDeviceMutationMutationResult = Apollo.MutationResult<SetPrimarySecondFactorDeviceMutation>;
export type SetPrimarySecondFactorDeviceMutationMutationOptions = Apollo.BaseMutationOptions<SetPrimarySecondFactorDeviceMutation, SetPrimarySecondFactorDeviceMutationVariables>;
export const DeleteSecondFactorDeviceMutationDocument = gql`
    mutation DeleteSecondFactorDeviceMutation($userSecondFactorDeviceId: ID!, $otp: String!) {
  me {
    deleteSecondFactorDevice(
      userSecondFactorDeviceId: $userSecondFactorDeviceId
      otp: $otp
    ) {
      success
    }
  }
}
    `;
export type DeleteSecondFactorDeviceMutationMutationFn = Apollo.MutationFunction<DeleteSecondFactorDeviceMutation, DeleteSecondFactorDeviceMutationVariables>;

/**
 * __useDeleteSecondFactorDeviceMutation__
 *
 * To run a mutation, you first call `useDeleteSecondFactorDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSecondFactorDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSecondFactorDeviceMutation, { data, loading, error }] = useDeleteSecondFactorDeviceMutation({
 *   variables: {
 *      userSecondFactorDeviceId: // value for 'userSecondFactorDeviceId'
 *      otp: // value for 'otp'
 *   },
 * });
 */
export function useDeleteSecondFactorDeviceMutation(baseOptions?: Apollo.MutationHookOptions<DeleteSecondFactorDeviceMutation, DeleteSecondFactorDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteSecondFactorDeviceMutation, DeleteSecondFactorDeviceMutationVariables>(DeleteSecondFactorDeviceMutationDocument, options);
      }
export type DeleteSecondFactorDeviceMutationHookResult = ReturnType<typeof useDeleteSecondFactorDeviceMutation>;
export type DeleteSecondFactorDeviceMutationMutationResult = Apollo.MutationResult<DeleteSecondFactorDeviceMutation>;
export type DeleteSecondFactorDeviceMutationMutationOptions = Apollo.BaseMutationOptions<DeleteSecondFactorDeviceMutation, DeleteSecondFactorDeviceMutationVariables>;
export const RegenerateSecondFactorBackupCodesMutationDocument = gql`
    mutation RegenerateSecondFactorBackupCodesMutation($otp: String!) {
  me {
    regenerateSecondFactorBackupCodes(otp: $otp) {
      plaintextBackupCodes
    }
  }
}
    `;
export type RegenerateSecondFactorBackupCodesMutationMutationFn = Apollo.MutationFunction<RegenerateSecondFactorBackupCodesMutation, RegenerateSecondFactorBackupCodesMutationVariables>;

/**
 * __useRegenerateSecondFactorBackupCodesMutation__
 *
 * To run a mutation, you first call `useRegenerateSecondFactorBackupCodesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegenerateSecondFactorBackupCodesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [regenerateSecondFactorBackupCodesMutation, { data, loading, error }] = useRegenerateSecondFactorBackupCodesMutation({
 *   variables: {
 *      otp: // value for 'otp'
 *   },
 * });
 */
export function useRegenerateSecondFactorBackupCodesMutation(baseOptions?: Apollo.MutationHookOptions<RegenerateSecondFactorBackupCodesMutation, RegenerateSecondFactorBackupCodesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegenerateSecondFactorBackupCodesMutation, RegenerateSecondFactorBackupCodesMutationVariables>(RegenerateSecondFactorBackupCodesMutationDocument, options);
      }
export type RegenerateSecondFactorBackupCodesMutationHookResult = ReturnType<typeof useRegenerateSecondFactorBackupCodesMutation>;
export type RegenerateSecondFactorBackupCodesMutationMutationResult = Apollo.MutationResult<RegenerateSecondFactorBackupCodesMutation>;
export type RegenerateSecondFactorBackupCodesMutationMutationOptions = Apollo.BaseMutationOptions<RegenerateSecondFactorBackupCodesMutation, RegenerateSecondFactorBackupCodesMutationVariables>;
export const HomeScreenDataDocument = gql`
    query HomeScreenData($accountName: String!) {
  account {
    byName(accountName: $accountName) {
      id
      name
      isCurrent
      owner {
        ...CurrentUserData
      }
      apps(limit: 5, offset: 0, includeUnpublished: true) {
        ...CommonAppData
      }
      snacks(limit: 5, offset: 0) {
        ...CommonSnackData
      }
      appCount
    }
  }
}
    ${CurrentUserDataFragmentDoc}
${CommonAppDataFragmentDoc}
${CommonSnackDataFragmentDoc}`;

/**
 * __useHomeScreenDataQuery__
 *
 * To run a query within a React component, call `useHomeScreenDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useHomeScreenDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHomeScreenDataQuery({
 *   variables: {
 *      accountName: // value for 'accountName'
 *   },
 * });
 */
export function useHomeScreenDataQuery(baseOptions: Apollo.QueryHookOptions<HomeScreenDataQuery, HomeScreenDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HomeScreenDataQuery, HomeScreenDataQueryVariables>(HomeScreenDataDocument, options);
      }
export function useHomeScreenDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HomeScreenDataQuery, HomeScreenDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HomeScreenDataQuery, HomeScreenDataQueryVariables>(HomeScreenDataDocument, options);
        }
export type HomeScreenDataQueryHookResult = ReturnType<typeof useHomeScreenDataQuery>;
export type HomeScreenDataLazyQueryHookResult = ReturnType<typeof useHomeScreenDataLazyQuery>;
export type HomeScreenDataQueryResult = Apollo.QueryResult<HomeScreenDataQuery, HomeScreenDataQueryVariables>;
export function refetchHomeScreenDataQuery(variables: HomeScreenDataQueryVariables) {
      return { query: HomeScreenDataDocument, variables: variables }
    }