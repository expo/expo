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
  DateTime: any;
  DevDomainName: any;
  JSON: any;
  JSONObject: any;
  WorkerDeploymentIdentifier: any;
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
  /** @deprecated Use appStoreConnectApiKeysPaginated */
  appStoreConnectApiKeys: Array<AppStoreConnectApiKey>;
  appStoreConnectApiKeysPaginated: AccountAppStoreConnectApiKeysConnection;
  appleAppIdentifiers: Array<AppleAppIdentifier>;
  /** @deprecated Use appleDevicesPaginated */
  appleDevices: Array<AppleDevice>;
  appleDevicesPaginated: AccountAppleDevicesConnection;
  /** @deprecated Use appleDistributionCertificatesPaginated */
  appleDistributionCertificates: Array<AppleDistributionCertificate>;
  appleDistributionCertificatesPaginated: AccountAppleDistributionCertificatesConnection;
  /** @deprecated Use appleProvisioningProfilesPaginated */
  appleProvisioningProfiles: Array<AppleProvisioningProfile>;
  appleProvisioningProfilesPaginated: AccountAppleProvisioningProfilesConnection;
  /** @deprecated Use applePushKeysPaginated */
  applePushKeys: Array<ApplePushKey>;
  applePushKeysPaginated: AccountApplePushKeysConnection;
  /** @deprecated Use appleTeamsPaginated */
  appleTeams: Array<AppleTeam>;
  /** iOS credentials for account */
  appleTeamsPaginated: AccountAppleTeamsConnection;
  /**
   * Apps associated with this account
   * @deprecated Use appsPaginated
   */
  apps: Array<App>;
  /** Paginated list of apps associated with this account. By default sorted by name. Use filter to adjust the sorting order. */
  appsPaginated: AccountAppsConnection;
  /** Audit logs for account */
  auditLogsPaginated: AuditLogConnection;
  /** @deprecated Build packs are no longer supported */
  availableBuilds?: Maybe<Scalars['Int']>;
  /** Billing information. Only visible to members with the ADMIN or OWNER role. */
  billing?: Maybe<Billing>;
  billingPeriod: BillingPeriod;
  /** (EAS Build) Builds associated with this account */
  builds: Array<Build>;
  createdAt: Scalars['DateTime'];
  /** Environment secrets for an account */
  environmentSecrets: Array<EnvironmentSecret>;
  /** Environment variables for an account */
  environmentVariables: Array<EnvironmentVariable>;
  /** Environment variables for an account with decrypted secret values */
  environmentVariablesIncludingSensitive: Array<EnvironmentVariableWithSecret>;
  /** GitHub App installations for an account */
  githubAppInstallations: Array<GitHubAppInstallation>;
  /** @deprecated Use googleServiceAccountKeysPaginated */
  googleServiceAccountKeys: Array<GoogleServiceAccountKey>;
  /** Android credentials for account */
  googleServiceAccountKeysPaginated: AccountGoogleServiceAccountKeysConnection;
  id: Scalars['ID'];
  isCurrent: Scalars['Boolean'];
  isDisabled: Scalars['Boolean'];
  /** Whether this account has SSO enabled. Can be queried by all members. */
  isSSOEnabled: Scalars['Boolean'];
  lastDeletionAttemptTime?: Maybe<Scalars['DateTime']>;
  name: Scalars['String'];
  /** Offers set on this account */
  offers?: Maybe<Array<Offer>>;
  /** Owning User of this account if personal account */
  owner?: Maybe<User>;
  /** Owning UserActor of this account if personal account */
  ownerUserActor?: Maybe<UserActor>;
  pushSecurityEnabled: Scalars['Boolean'];
  /** @deprecated Legacy access tokens are deprecated */
  requiresAccessTokenForPushSecurity: Scalars['Boolean'];
  /** Snacks associated with this account */
  snacks: Array<Snack>;
  /** SSO configuration for this account */
  ssoConfiguration?: Maybe<AccountSsoConfiguration>;
  /** Subscription info visible to members that have VIEWER role */
  subscription?: Maybe<SubscriptionDetails>;
  /** @deprecated No longer needed */
  subscriptionChangesPending?: Maybe<Scalars['Boolean']>;
  /** Coalesced project activity for an app using pagination */
  timelineActivity: TimelineActivityConnection;
  /** @deprecated See isCurrent */
  unlimitedBuilds: Scalars['Boolean'];
  updatedAt: Scalars['DateTime'];
  /** Account query object for querying EAS usage metrics */
  usageMetrics: AccountUsageMetrics;
  /**
   * Owning UserActor of this account if personal account
   * @deprecated Deprecated in favor of ownerUserActor
   */
  userActorOwner?: Maybe<UserActor>;
  /** Pending user invitations for this account */
  userInvitations: Array<UserInvitation>;
  /** Actors associated with this account and permissions they hold */
  users: Array<UserPermission>;
  /** Permission info for the viewer on this account */
  viewerUserPermission: UserPermission;
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
export type AccountAppStoreConnectApiKeysPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
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
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleDevicesPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<AppleDeviceFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleDistributionCertificatesPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
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
export type AccountAppleProvisioningProfilesPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountApplePushKeysPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleTeamsArgs = {
  appleTeamIdentifier?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAppleTeamsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<AppleTeamFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
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
export type AccountAppsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<AccountAppsFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountAuditLogsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<AuditLogFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
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
export type AccountEnvironmentVariablesArgs = {
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  filterNames?: InputMaybe<Array<Scalars['String']>>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountEnvironmentVariablesIncludingSensitiveArgs = {
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  filterNames?: InputMaybe<Array<Scalars['String']>>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountGoogleServiceAccountKeysPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountSnacksArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/**
 * An account is a container owning projects, credentials, billing and other organization
 * data and settings. Actors may own and be members of accounts.
 */
export type AccountTimelineActivityArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<TimelineActivityFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type AccountAppStoreConnectApiKeysConnection = {
  __typename?: 'AccountAppStoreConnectApiKeysConnection';
  edges: Array<AccountAppStoreConnectApiKeysEdge>;
  pageInfo: PageInfo;
};

export type AccountAppStoreConnectApiKeysEdge = {
  __typename?: 'AccountAppStoreConnectApiKeysEdge';
  cursor: Scalars['String'];
  node: AppStoreConnectApiKey;
};

export type AccountAppleDevicesConnection = {
  __typename?: 'AccountAppleDevicesConnection';
  edges: Array<AccountAppleDevicesEdge>;
  pageInfo: PageInfo;
};

export type AccountAppleDevicesEdge = {
  __typename?: 'AccountAppleDevicesEdge';
  cursor: Scalars['String'];
  node: AppleDevice;
};

export type AccountAppleDistributionCertificatesConnection = {
  __typename?: 'AccountAppleDistributionCertificatesConnection';
  edges: Array<AccountAppleDistributionCertificatesEdge>;
  pageInfo: PageInfo;
};

export type AccountAppleDistributionCertificatesEdge = {
  __typename?: 'AccountAppleDistributionCertificatesEdge';
  cursor: Scalars['String'];
  node: AppleDistributionCertificate;
};

export type AccountAppleProvisioningProfilesConnection = {
  __typename?: 'AccountAppleProvisioningProfilesConnection';
  edges: Array<AccountAppleProvisioningProfilesEdge>;
  pageInfo: PageInfo;
};

export type AccountAppleProvisioningProfilesEdge = {
  __typename?: 'AccountAppleProvisioningProfilesEdge';
  cursor: Scalars['String'];
  node: AppleProvisioningProfile;
};

export type AccountApplePushKeysConnection = {
  __typename?: 'AccountApplePushKeysConnection';
  edges: Array<AccountApplePushKeysEdge>;
  pageInfo: PageInfo;
};

export type AccountApplePushKeysEdge = {
  __typename?: 'AccountApplePushKeysEdge';
  cursor: Scalars['String'];
  node: ApplePushKey;
};

export type AccountAppleTeamsConnection = {
  __typename?: 'AccountAppleTeamsConnection';
  edges: Array<AccountAppleTeamsEdge>;
  pageInfo: PageInfo;
};

export type AccountAppleTeamsEdge = {
  __typename?: 'AccountAppleTeamsEdge';
  cursor: Scalars['String'];
  node: AppleTeam;
};

export type AccountAppsConnection = {
  __typename?: 'AccountAppsConnection';
  edges: Array<AccountAppsEdge>;
  pageInfo: PageInfo;
};

export type AccountAppsEdge = {
  __typename?: 'AccountAppsEdge';
  cursor: Scalars['String'];
  node: App;
};

export type AccountAppsFilterInput = {
  searchTerm?: InputMaybe<Scalars['String']>;
  sortByField: AccountAppsSortByField;
};

export enum AccountAppsSortByField {
  LatestActivityTime = 'LATEST_ACTIVITY_TIME',
  /**
   * Name prefers the display name but falls back to full_name with @account/
   * part stripped.
   */
  Name = 'NAME'
}

export type AccountDataInput = {
  name: Scalars['String'];
};

export type AccountGoogleServiceAccountKeysConnection = {
  __typename?: 'AccountGoogleServiceAccountKeysConnection';
  edges: Array<AccountGoogleServiceAccountKeysEdge>;
  pageInfo: PageInfo;
};

export type AccountGoogleServiceAccountKeysEdge = {
  __typename?: 'AccountGoogleServiceAccountKeysEdge';
  cursor: Scalars['String'];
  node: GoogleServiceAccountKey;
};

export type AccountMutation = {
  __typename?: 'AccountMutation';
  /** Cancels all subscriptions immediately */
  cancelAllSubscriptionsImmediately: Account;
  /** Cancel scheduled subscription change */
  cancelScheduledSubscriptionChange: Account;
  /** Buys or revokes account's additional concurrencies, charging the account the appropriate amount if needed. */
  changeAdditionalConcurrenciesCount: Account;
  /** Upgrades or downgrades the active subscription to the newPlanIdentifier, which must be one of the EAS plans (i.e., Production or Enterprise). */
  changePlan: Account;
  /** Add specified account Permissions for Actor. Actor must already have at least one permission on the account. */
  grantActorPermissions: Account;
  /** Rename this account and the primary user's username if this account is a personal account */
  rename: Account;
  /** Requests a refund for the specified charge by requesting a manual refund from support */
  requestRefund?: Maybe<Scalars['Boolean']>;
  /** Revoke specified Permissions for Actor. Actor must already have at least one permission on the account. */
  revokeActorPermissions: Account;
  /** Require authorization to send push notifications for experiences owned by this account */
  setPushSecurityEnabled: Account;
};


export type AccountMutationCancelAllSubscriptionsImmediatelyArgs = {
  accountID: Scalars['ID'];
};


export type AccountMutationCancelScheduledSubscriptionChangeArgs = {
  accountID: Scalars['ID'];
};


export type AccountMutationChangeAdditionalConcurrenciesCountArgs = {
  accountID: Scalars['ID'];
  newAdditionalConcurrenciesCount: Scalars['Int'];
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


export type AccountMutationSetPushSecurityEnabledArgs = {
  accountID: Scalars['ID'];
  pushSecurityEnabled: Scalars['Boolean'];
};

export type AccountNotificationSubscriptionInput = {
  accountId: Scalars['ID'];
  event: NotificationEvent;
  type: NotificationType;
  userId: Scalars['ID'];
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

/** Auth configuration data for an SSO account. */
export type AccountSsoConfiguration = {
  __typename?: 'AccountSSOConfiguration';
  authProtocol: AuthProtocolType;
  authProviderIdentifier: AuthProviderIdentifier;
  clientIdentifier: Scalars['String'];
  clientSecret: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  issuer: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type AccountSsoConfigurationData = {
  authProtocol: AuthProtocolType;
  authProviderIdentifier: AuthProviderIdentifier;
  clientIdentifier: Scalars['String'];
  clientSecret: Scalars['String'];
  issuer: Scalars['String'];
};

export type AccountSsoConfigurationMutation = {
  __typename?: 'AccountSSOConfigurationMutation';
  /** Create an AccountSSOConfiguration for an Account */
  createAccountSSOConfiguration: AccountSsoConfiguration;
  /** Delete an AccountSSOConfiguration */
  deleteAccountSSOConfiguration: DeleteAccountSsoConfigurationResult;
  /** Update an AccountSSOConfiguration */
  updateAccountSSOConfiguration: AccountSsoConfiguration;
};


export type AccountSsoConfigurationMutationCreateAccountSsoConfigurationArgs = {
  accountId: Scalars['ID'];
  accountSSOConfigurationData: AccountSsoConfigurationData;
};


export type AccountSsoConfigurationMutationDeleteAccountSsoConfigurationArgs = {
  id: Scalars['ID'];
};


export type AccountSsoConfigurationMutationUpdateAccountSsoConfigurationArgs = {
  accountSSOConfigurationData: AccountSsoConfigurationData;
  id: Scalars['ID'];
};

/** Public auth configuration data for an SSO account. */
export type AccountSsoConfigurationPublicData = {
  __typename?: 'AccountSSOConfigurationPublicData';
  authProtocol: AuthProtocolType;
  authProviderIdentifier: AuthProviderIdentifier;
  authorizationUrl: Scalars['String'];
  id: Scalars['ID'];
  issuer: Scalars['String'];
};

export type AccountSsoConfigurationPublicDataQuery = {
  __typename?: 'AccountSSOConfigurationPublicDataQuery';
  /** Get AccountSSOConfiguration public data by account name */
  publicDataByAccountName: AccountSsoConfigurationPublicData;
};


export type AccountSsoConfigurationPublicDataQueryPublicDataByAccountNameArgs = {
  accountName: Scalars['String'];
};

export enum AccountUploadSessionType {
  WorkflowsProjectSources = 'WORKFLOWS_PROJECT_SOURCES'
}

export type AccountUsageEasBuildMetadata = {
  __typename?: 'AccountUsageEASBuildMetadata';
  billingResourceClass?: Maybe<EasBuildBillingResourceClass>;
  platform?: Maybe<AppPlatform>;
  waiverType?: Maybe<EasBuildWaiverType>;
};

export type AccountUsageEasJobsMetadata = {
  __typename?: 'AccountUsageEASJobsMetadata';
  resourceClassDisplayName: Scalars['String'];
};

export type AccountUsageMetadata = AccountUsageEasBuildMetadata | AccountUsageEasJobsMetadata;

export type AccountUsageMetric = {
  __typename?: 'AccountUsageMetric';
  id: Scalars['ID'];
  metricType: UsageMetricType;
  serviceMetric: EasServiceMetric;
  timestamp: Scalars['DateTime'];
  value: Scalars['Float'];
};

export type AccountUsageMetrics = {
  __typename?: 'AccountUsageMetrics';
  byBillingPeriod: UsageMetricTotal;
  metricsForServiceMetric: Array<AccountUsageMetric>;
};


export type AccountUsageMetricsByBillingPeriodArgs = {
  date: Scalars['DateTime'];
  service?: InputMaybe<EasService>;
};


export type AccountUsageMetricsMetricsForServiceMetricArgs = {
  filterParams?: InputMaybe<Scalars['JSONObject']>;
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
  Submission = 'SUBMISSION',
  Update = 'UPDATE',
  Worker = 'WORKER'
}

/** A regular user, SSO user, or robot that can authenticate with Expo services and be a member of accounts. */
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
  /** Experiments associated with this actor */
  experiments: Array<ActorExperiment>;
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isExpoAdmin: Scalars['Boolean'];
  lastDeletionAttemptTime?: Maybe<Scalars['DateTime']>;
};


/** A regular user, SSO user, or robot that can authenticate with Expo services and be a member of accounts. */
export type ActorFeatureGatesArgs = {
  filter?: InputMaybe<Array<Scalars['String']>>;
};

export type ActorExperiment = {
  __typename?: 'ActorExperiment';
  createdAt: Scalars['DateTime'];
  enabled: Scalars['Boolean'];
  experiment: Experiment;
  id: Scalars['ID'];
  updatedAt: Scalars['DateTime'];
};

export type ActorExperimentMutation = {
  __typename?: 'ActorExperimentMutation';
  /** Create or update the value of a User Experiment */
  createOrUpdateActorExperiment: ActorExperiment;
};


export type ActorExperimentMutationCreateOrUpdateActorExperimentArgs = {
  enabled: Scalars['Boolean'];
  experiment: Experiment;
};

export type ActorQuery = {
  __typename?: 'ActorQuery';
  /**
   * Query an Actor by ID
   * @deprecated Public actor queries are no longer supported
   */
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
  quantity?: Maybe<Scalars['Int']>;
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
  googleServiceAccountKeyForFcmV1?: Maybe<GoogleServiceAccountKey>;
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
  googleServiceAccountKeyForFcmV1Id?: InputMaybe<Scalars['ID']>;
  googleServiceAccountKeyForSubmissionsId?: InputMaybe<Scalars['ID']>;
};

export type AndroidAppCredentialsMutation = {
  __typename?: 'AndroidAppCredentialsMutation';
  /** Create a set of credentials for an Android app */
  createAndroidAppCredentials: AndroidAppCredentials;
  /**
   * Create a GoogleServiceAccountKeyEntity to store credential and
   * connect it with an edge from AndroidAppCredential
   */
  createFcmV1Credential: AndroidAppCredentials;
  /** Delete a set of credentials for an Android app */
  deleteAndroidAppCredentials: DeleteAndroidAppCredentialsResult;
  /** Set the FCM push key to be used in an Android app */
  setFcm: AndroidAppCredentials;
  /** Set the Google Service Account Key to be used for Firebase Cloud Messaging V1 */
  setGoogleServiceAccountKeyForFcmV1: AndroidAppCredentials;
  /** Set the Google Service Account Key to be used for submitting an Android app */
  setGoogleServiceAccountKeyForSubmissions: AndroidAppCredentials;
};


export type AndroidAppCredentialsMutationCreateAndroidAppCredentialsArgs = {
  androidAppCredentialsInput: AndroidAppCredentialsInput;
  appId: Scalars['ID'];
  applicationIdentifier: Scalars['String'];
};


export type AndroidAppCredentialsMutationCreateFcmV1CredentialArgs = {
  accountId: Scalars['ID'];
  androidAppCredentialsId: Scalars['String'];
  credential: Scalars['String'];
};


export type AndroidAppCredentialsMutationDeleteAndroidAppCredentialsArgs = {
  id: Scalars['ID'];
};


export type AndroidAppCredentialsMutationSetFcmArgs = {
  fcmId: Scalars['ID'];
  id: Scalars['ID'];
};


export type AndroidAppCredentialsMutationSetGoogleServiceAccountKeyForFcmV1Args = {
  googleServiceAccountKeyId: Scalars['ID'];
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
  bun?: InputMaybe<Scalars['String']>;
  env?: InputMaybe<Scalars['JSONObject']>;
  expoCli?: InputMaybe<Scalars['String']>;
  image?: InputMaybe<Scalars['String']>;
  ndk?: InputMaybe<Scalars['String']>;
  node?: InputMaybe<Scalars['String']>;
  pnpm?: InputMaybe<Scalars['String']>;
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
  applicationArchivePath?: InputMaybe<Scalars['String']>;
  /** @deprecated */
  artifactPath?: InputMaybe<Scalars['String']>;
  buildArtifactPaths?: InputMaybe<Array<Scalars['String']>>;
  buildProfile?: InputMaybe<Scalars['String']>;
  buildType?: InputMaybe<AndroidBuildType>;
  builderEnvironment?: InputMaybe<AndroidBuilderEnvironmentInput>;
  cache?: InputMaybe<BuildCacheInput>;
  customBuildConfig?: InputMaybe<CustomBuildConfigInput>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
  gradleCommand?: InputMaybe<Scalars['String']>;
  loggerLevel?: InputMaybe<WorkerLoggerLevel>;
  mode?: InputMaybe<BuildMode>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: InputMaybe<Scalars['String']>;
  secrets?: InputMaybe<AndroidJobSecretsInput>;
  triggeredBy?: InputMaybe<BuildTrigger>;
  type: BuildWorkflow;
  updates?: InputMaybe<BuildUpdatesInput>;
  username?: InputMaybe<Scalars['String']>;
  version?: InputMaybe<AndroidJobVersionInput>;
};

export type AndroidJobKeystoreInput = {
  dataBase64: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: InputMaybe<Scalars['String']>;
  keystorePassword: Scalars['String'];
};

export type AndroidJobOverridesInput = {
  applicationArchivePath?: InputMaybe<Scalars['String']>;
  /** @deprecated */
  artifactPath?: InputMaybe<Scalars['String']>;
  buildArtifactPaths?: InputMaybe<Array<Scalars['String']>>;
  buildProfile?: InputMaybe<Scalars['String']>;
  buildType?: InputMaybe<AndroidBuildType>;
  builderEnvironment?: InputMaybe<AndroidBuilderEnvironmentInput>;
  cache?: InputMaybe<BuildCacheInput>;
  customBuildConfig?: InputMaybe<CustomBuildConfigInput>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
  gradleCommand?: InputMaybe<Scalars['String']>;
  loggerLevel?: InputMaybe<WorkerLoggerLevel>;
  mode?: InputMaybe<BuildMode>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  secrets?: InputMaybe<AndroidJobSecretsInput>;
  updates?: InputMaybe<BuildUpdatesInput>;
  username?: InputMaybe<Scalars['String']>;
  version?: InputMaybe<AndroidJobVersionInput>;
};

export type AndroidJobSecretsInput = {
  buildCredentials?: InputMaybe<AndroidJobBuildCredentialsInput>;
  robotAccessToken?: InputMaybe<Scalars['String']>;
};

export type AndroidJobVersionInput = {
  versionCode: Scalars['String'];
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
  rollout?: Maybe<Scalars['Float']>;
  track: SubmissionAndroidTrack;
};

export type AndroidSubmissionConfigInput = {
  applicationIdentifier?: InputMaybe<Scalars['String']>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  changesNotSentForReview?: InputMaybe<Scalars['Boolean']>;
  googleServiceAccountKeyId?: InputMaybe<Scalars['String']>;
  googleServiceAccountKeyJson?: InputMaybe<Scalars['String']>;
  isVerboseFastlaneEnabled?: InputMaybe<Scalars['Boolean']>;
  releaseStatus?: InputMaybe<SubmissionAndroidReleaseStatus>;
  rollout?: InputMaybe<Scalars['Float']>;
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
  /**
   * ios.appStoreUrl field from most recent classic update manifest
   * @deprecated Classic updates have been deprecated.
   */
  appStoreUrl?: Maybe<Scalars['String']>;
  assetLimitPerUpdateGroup: Scalars['Int'];
  branchesPaginated: AppBranchesConnection;
  /** (EAS Build) Builds associated with this app */
  builds: Array<Build>;
  buildsPaginated: AppBuildsConnection;
  /**
   * Classic update release channel names that have at least one build
   * @deprecated Classic updates have been deprecated.
   */
  buildsReleaseChannels: Array<Scalars['String']>;
  channelsPaginated: AppChannelsConnection;
  deployment?: Maybe<Deployment>;
  /** Deployments associated with this app */
  deployments: DeploymentsConnection;
  /** @deprecated Classic updates have been deprecated. */
  description: Scalars['String'];
  devDomainName?: Maybe<AppDevDomainName>;
  /** Environment secrets for an app */
  environmentSecrets: Array<EnvironmentSecret>;
  /** Environment variables for an app */
  environmentVariables: Array<EnvironmentVariable>;
  /** Environment variables for an app with decrypted secret values */
  environmentVariablesIncludingSensitive: Array<EnvironmentVariableWithSecret>;
  fullName: Scalars['String'];
  githubBuildTriggers: Array<GitHubBuildTrigger>;
  githubJobRunTriggers: Array<GitHubJobRunTrigger>;
  githubRepository?: Maybe<GitHubRepository>;
  githubRepositorySettings?: Maybe<GitHubRepositorySettings>;
  /**
   * githubUrl field from most recent classic update manifest
   * @deprecated Classic updates have been deprecated.
   */
  githubUrl?: Maybe<Scalars['String']>;
  /**
   * Info about the icon specified in the most recent classic update manifest
   * @deprecated Classic updates have been deprecated.
   */
  icon?: Maybe<AppIcon>;
  /** @deprecated No longer supported */
  iconUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** App query field for querying EAS Insights about this app */
  insights: AppInsights;
  internalDistributionBuildPrivacy: AppInternalDistributionBuildPrivacy;
  /** iOS app credentials for the project */
  iosAppCredentials: Array<IosAppCredentials>;
  /** @deprecated Use lastDeletionAttemptTime !== null instead */
  isDeleting: Scalars['Boolean'];
  /**
   * Whether the latest classic update publish is using a deprecated SDK version
   * @deprecated Classic updates have been deprecated.
   */
  isDeprecated: Scalars['Boolean'];
  /** @deprecated 'likes' have been deprecated. */
  isLikedByMe: Scalars['Boolean'];
  lastDeletionAttemptTime?: Maybe<Scalars['DateTime']>;
  /** @deprecated No longer supported */
  lastPublishedTime: Scalars['DateTime'];
  /** Time of the last user activity (update, branch, submission). */
  latestActivity: Scalars['DateTime'];
  latestAppVersionByPlatformAndApplicationIdentifier?: Maybe<AppVersion>;
  /** @deprecated Classic updates have been deprecated. */
  latestReleaseForReleaseChannel?: Maybe<AppRelease>;
  /**
   * ID of latest classic update release
   * @deprecated Classic updates have been deprecated.
   */
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
  /**
   * android.playStoreUrl field from most recent classic update manifest
   * @deprecated Classic updates have been deprecated.
   */
  playStoreUrl?: Maybe<Scalars['String']>;
  /** @deprecated Use 'privacySetting' instead. */
  privacy: Scalars['String'];
  privacySetting: AppPrivacy;
  /**
   * Whether there have been any classic update publishes
   * @deprecated Classic updates have been deprecated.
   */
  published: Scalars['Boolean'];
  /** App query field for querying details about an app's push notifications */
  pushNotifications: AppPushNotifications;
  pushSecurityEnabled: Scalars['Boolean'];
  /**
   * Classic update release channel names (to be removed)
   * @deprecated Classic updates have been deprecated.
   */
  releaseChannels: Array<Scalars['String']>;
  /** @deprecated Legacy access tokens are deprecated */
  requiresAccessTokenForPushSecurity: Scalars['Boolean'];
  resourceClassExperiment?: Maybe<ResourceClassExperiment>;
  /** Runtimes associated with this app */
  runtimes: RuntimesConnection;
  scopeKey: Scalars['String'];
  /**
   * SDK version of the latest classic update publish, 0.0.0 otherwise
   * @deprecated Classic updates have been deprecated.
   */
  sdkVersion: Scalars['String'];
  slug: Scalars['String'];
  /** EAS Submissions associated with this app */
  submissions: Array<Submission>;
  submissionsPaginated: AppSubmissionsConnection;
  suggestedDevDomainName: Scalars['String'];
  /** Coalesced project activity for an app using pagination */
  timelineActivity: TimelineActivityConnection;
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
  /** EAS updates owned by an app grouped by update group */
  updateGroups: Array<Array<Update>>;
  /**
   * Time of last classic update publish
   * @deprecated Classic updates have been deprecated.
   */
  updated: Scalars['DateTime'];
  /** EAS updates owned by an app */
  updates: Array<Update>;
  updatesPaginated: AppUpdatesConnection;
  /** @deprecated Use ownerAccount.name instead */
  username: Scalars['String'];
  /** @deprecated No longer supported */
  users?: Maybe<Array<Maybe<User>>>;
  /** Webhooks for an app */
  webhooks: Array<Webhook>;
  workerCustomDomain?: Maybe<WorkerCustomDomain>;
  workerDeployment?: Maybe<WorkerDeployment>;
  workerDeploymentAlias?: Maybe<WorkerDeploymentAlias>;
  workerDeploymentAliases: WorkerDeploymentAliasesConnection;
  workerDeployments: WorkerDeploymentsConnection;
  workerDeploymentsCrash: WorkerDeploymentCrashEdge;
  workerDeploymentsCrashes?: Maybe<WorkerDeploymentCrashes>;
  workerDeploymentsRequest: WorkerDeploymentRequestEdge;
  workerDeploymentsRequests?: Maybe<WorkerDeploymentRequests>;
  workflowRunsPaginated: AppWorkflowRunsConnection;
  workflows: Array<Workflow>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppActivityTimelineProjectActivitiesArgs = {
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  filterChannels?: InputMaybe<Array<Scalars['String']>>;
  filterPlatforms?: InputMaybe<Array<AppPlatform>>;
  filterTypes?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppAndroidAppCredentialsArgs = {
  filter?: InputMaybe<AndroidAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppBranchesPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<BranchFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
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
export type AppBuildsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<BuildFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppChannelsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<ChannelFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentArgs = {
  channel: Scalars['String'];
  runtimeVersion: Scalars['String'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<DeploymentFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppEnvironmentSecretsArgs = {
  filterNames?: InputMaybe<Array<Scalars['String']>>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppEnvironmentVariablesArgs = {
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  filterNames?: InputMaybe<Array<Scalars['String']>>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppEnvironmentVariablesIncludingSensitiveArgs = {
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  filterNames?: InputMaybe<Array<Scalars['String']>>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppIosAppCredentialsArgs = {
  filter?: InputMaybe<IosAppCredentialsFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppLatestAppVersionByPlatformAndApplicationIdentifierArgs = {
  applicationIdentifier: Scalars['String'];
  platform: AppPlatform;
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
export type AppRuntimesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppSubmissionsArgs = {
  filter: SubmissionFilter;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppSubmissionsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppTimelineActivityArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<TimelineActivityFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
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
export type AppUpdateGroupsArgs = {
  filter?: InputMaybe<UpdatesFilter>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdatesArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppUpdatesPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWebhooksArgs = {
  filter?: InputMaybe<WebhookFilter>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentArgs = {
  deploymentIdentifier: Scalars['WorkerDeploymentIdentifier'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentAliasArgs = {
  aliasName?: InputMaybe<Scalars['WorkerDeploymentIdentifier']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentAliasesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentsCrashArgs = {
  crashKey: Scalars['ID'];
  sampleFor?: InputMaybe<CrashSampleFor>;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentsCrashesArgs = {
  filters?: InputMaybe<CrashesFilters>;
  timespan: DatasetTimespan;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentsRequestArgs = {
  requestKey: Scalars['ID'];
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkerDeploymentsRequestsArgs = {
  filters?: InputMaybe<RequestsFilters>;
  timespan: DatasetTimespan;
};


/** Represents an Exponent App (or Experience in legacy terms) */
export type AppWorkflowRunsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type AppBranchEdge = {
  __typename?: 'AppBranchEdge';
  cursor: Scalars['String'];
  node: UpdateBranch;
};

export type AppBranchesConnection = {
  __typename?: 'AppBranchesConnection';
  edges: Array<AppBranchEdge>;
  pageInfo: PageInfo;
};

export type AppBuildEdge = {
  __typename?: 'AppBuildEdge';
  cursor: Scalars['String'];
  node: BuildOrBuildJob;
};

export type AppBuildsConnection = {
  __typename?: 'AppBuildsConnection';
  edges: Array<AppBuildEdge>;
  pageInfo: PageInfo;
};

export type AppChannelEdge = {
  __typename?: 'AppChannelEdge';
  cursor: Scalars['String'];
  node: UpdateChannel;
};

export type AppChannelsConnection = {
  __typename?: 'AppChannelsConnection';
  edges: Array<AppChannelEdge>;
  pageInfo: PageInfo;
};

export type AppDataInput = {
  id: Scalars['ID'];
  internalDistributionBuildPrivacy?: InputMaybe<AppInternalDistributionBuildPrivacy>;
  privacy?: InputMaybe<Scalars['String']>;
};

export type AppDevDomainName = {
  __typename?: 'AppDevDomainName';
  app?: Maybe<App>;
  id: Scalars['ID'];
  name: Scalars['DevDomainName'];
};

export type AppDevDomainNameMutation = {
  __typename?: 'AppDevDomainNameMutation';
  /** Creates a DevDomainName assigning it to an app */
  assignDevDomainName: AppDevDomainName;
  /** Updates a DevDomainName for a given app */
  changeDevDomainName: AppDevDomainName;
};


export type AppDevDomainNameMutationAssignDevDomainNameArgs = {
  appId: Scalars['ID'];
  name: Scalars['DevDomainName'];
};


export type AppDevDomainNameMutationChangeDevDomainNameArgs = {
  appId: Scalars['ID'];
  name: Scalars['DevDomainName'];
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

export type AppInsights = {
  __typename?: 'AppInsights';
  hasEventsFromExpoInsightsClientModule: Scalars['Boolean'];
  totalUniqueUsers?: Maybe<Scalars['Int']>;
  uniqueUsersByAppVersionOverTime: UniqueUsersOverTimeData;
  uniqueUsersByPlatformOverTime: UniqueUsersOverTimeData;
};


export type AppInsightsTotalUniqueUsersArgs = {
  timespan: InsightsTimespan;
};


export type AppInsightsUniqueUsersByAppVersionOverTimeArgs = {
  timespan: InsightsTimespan;
};


export type AppInsightsUniqueUsersByPlatformOverTimeArgs = {
  timespan: InsightsTimespan;
};

export enum AppInternalDistributionBuildPrivacy {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type AppMutation = {
  __typename?: 'AppMutation';
  /** Create an app */
  createApp: App;
  /** Create an app and GitHub repository if user desire to */
  createAppAndGithubRepository: CreateAppAndGithubRepositoryResponse;
  /** @deprecated No longer supported */
  grantAccess?: Maybe<App>;
  /** Delete an App. Returns the ID of the background job receipt. Use BackgroundJobReceiptQuery to get the status of the job. */
  scheduleAppDeletion: BackgroundJobReceipt;
  /** Set display info for app */
  setAppInfo: App;
  /** Require api token to send push notifs for experience */
  setPushSecurityEnabled: App;
  /** Set resource class experiment for app */
  setResourceClassExperiment: App;
};


export type AppMutationCreateAppArgs = {
  appInput: AppInput;
};


export type AppMutationCreateAppAndGithubRepositoryArgs = {
  appInput: AppWithGithubRepositoryInput;
};


export type AppMutationGrantAccessArgs = {
  accessLevel?: InputMaybe<Scalars['String']>;
  toUser: Scalars['ID'];
};


export type AppMutationScheduleAppDeletionArgs = {
  appId: Scalars['ID'];
};


export type AppMutationSetAppInfoArgs = {
  appId: Scalars['ID'];
  appInfo: AppInfoInput;
};


export type AppMutationSetPushSecurityEnabledArgs = {
  appId: Scalars['ID'];
  pushSecurityEnabled: Scalars['Boolean'];
};


export type AppMutationSetResourceClassExperimentArgs = {
  appId: Scalars['ID'];
  resourceClassExperiment?: InputMaybe<ResourceClassExperiment>;
};

export type AppNotificationSubscriptionInput = {
  appId: Scalars['ID'];
  event: NotificationEvent;
  type: NotificationType;
  userId: Scalars['ID'];
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

export type AppPushNotifications = {
  __typename?: 'AppPushNotifications';
  id: Scalars['ID'];
  insights: AppPushNotificationsInsights;
};

export type AppPushNotificationsInsights = {
  __typename?: 'AppPushNotificationsInsights';
  id: Scalars['ID'];
  notificationsSentOverTime: NotificationsSentOverTimeData;
  successFailureOverTime: NotificationsSentOverTimeData;
  totalNotificationsSent: Scalars['Int'];
};


export type AppPushNotificationsInsightsNotificationsSentOverTimeArgs = {
  timespan: InsightsTimespan;
};


export type AppPushNotificationsInsightsSuccessFailureOverTimeArgs = {
  timespan: InsightsTimespan;
};


export type AppPushNotificationsInsightsTotalNotificationsSentArgs = {
  filters?: InputMaybe<Array<Scalars['JSON']>>;
  timespan: InsightsTimespan;
};

export type AppQuery = {
  __typename?: 'AppQuery';
  /**
   * Public apps in the app directory
   * @deprecated App directory no longer supported
   */
  all: Array<App>;
  /** Look up app by dev domain name, if one has been created */
  byDevDomainName: App;
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


export type AppQueryByDevDomainNameArgs = {
  name: Scalars['DevDomainName'];
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
  keyP8: Scalars['String'];
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
  /** Update an App Store Connect Api Key for an Apple Team */
  updateAppStoreConnectApiKey: AppStoreConnectApiKey;
};


export type AppStoreConnectApiKeyMutationCreateAppStoreConnectApiKeyArgs = {
  accountId: Scalars['ID'];
  appStoreConnectApiKeyInput: AppStoreConnectApiKeyInput;
};


export type AppStoreConnectApiKeyMutationDeleteAppStoreConnectApiKeyArgs = {
  id: Scalars['ID'];
};


export type AppStoreConnectApiKeyMutationUpdateAppStoreConnectApiKeyArgs = {
  appStoreConnectApiKeyUpdateInput: AppStoreConnectApiKeyUpdateInput;
  id: Scalars['ID'];
};

export type AppStoreConnectApiKeyQuery = {
  __typename?: 'AppStoreConnectApiKeyQuery';
  byId: AppStoreConnectApiKey;
};


export type AppStoreConnectApiKeyQueryByIdArgs = {
  id: Scalars['ID'];
};

export type AppStoreConnectApiKeyUpdateInput = {
  appleTeamId?: InputMaybe<Scalars['ID']>;
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

export type AppSubmissionEdge = {
  __typename?: 'AppSubmissionEdge';
  cursor: Scalars['String'];
  node: Submission;
};

export type AppSubmissionsConnection = {
  __typename?: 'AppSubmissionsConnection';
  edges: Array<AppSubmissionEdge>;
  pageInfo: PageInfo;
};

export type AppUpdateEdge = {
  __typename?: 'AppUpdateEdge';
  cursor: Scalars['String'];
  node: Update;
};

export type AppUpdatesConnection = {
  __typename?: 'AppUpdatesConnection';
  edges: Array<AppUpdateEdge>;
  pageInfo: PageInfo;
};

/** Represents Play Store/App Store version of an application */
export type AppVersion = {
  __typename?: 'AppVersion';
  /**
   * Store identifier for an application
   *  - Android - applicationId
   *  - iOS - bundle identifier
   */
  applicationIdentifier: Scalars['String'];
  /**
   * Value that identifies build in a store (it's visible to developers, but not to end users)
   * - Android - versionCode in build.gradle ("android.versionCode" field in app.json)
   * - iOS - CFBundleVersion in Info.plist ("ios.buildNumber" field in app.json)
   */
  buildVersion: Scalars['String'];
  id: Scalars['ID'];
  platform: AppPlatform;
  runtimeVersion?: Maybe<Scalars['String']>;
  /**
   * User-facing version in a store
   * - Android - versionName in build.gradle ("version" field in app.json)
   * - iOS - CFBundleShortVersionString in Info.plist ("version" field in app.json)
   */
  storeVersion: Scalars['String'];
};

export type AppVersionInput = {
  appId: Scalars['ID'];
  applicationIdentifier: Scalars['String'];
  buildVersion: Scalars['String'];
  platform: AppPlatform;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  storeVersion: Scalars['String'];
};

export type AppVersionMutation = {
  __typename?: 'AppVersionMutation';
  /** Create an app version */
  createAppVersion: AppVersion;
};


export type AppVersionMutationCreateAppVersionArgs = {
  appVersionInput: AppVersionInput;
};

export type AppWithGithubRepositoryInput = {
  accountId: Scalars['ID'];
  appInfo?: InputMaybe<AppInfoInput>;
  installationIdentifier?: InputMaybe<Scalars['String']>;
  privacy: AppPrivacy;
  projectName: Scalars['String'];
};

export type AppWorkflowRunEdge = {
  __typename?: 'AppWorkflowRunEdge';
  cursor: Scalars['String'];
  node: WorkflowRun;
};

export type AppWorkflowRunsConnection = {
  __typename?: 'AppWorkflowRunsConnection';
  edges: Array<AppWorkflowRunEdge>;
  pageInfo: PageInfo;
};

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
  createdAt: Scalars['DateTime'];
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
  Iphone = 'IPHONE',
  Mac = 'MAC',
  Unknown = 'UNKNOWN'
}

export type AppleDeviceFilterInput = {
  appleTeamIdentifier?: InputMaybe<Scalars['String']>;
  class?: InputMaybe<AppleDeviceClass>;
  identifier?: InputMaybe<Scalars['String']>;
};

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
  /** Update an Apple Device */
  updateAppleDevice: AppleDevice;
};


export type AppleDeviceMutationCreateAppleDeviceArgs = {
  accountId: Scalars['ID'];
  appleDeviceInput: AppleDeviceInput;
};


export type AppleDeviceMutationDeleteAppleDeviceArgs = {
  id: Scalars['ID'];
};


export type AppleDeviceMutationUpdateAppleDeviceArgs = {
  appleDeviceUpdateInput: AppleDeviceUpdateInput;
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

export type AppleDeviceUpdateInput = {
  name?: InputMaybe<Scalars['String']>;
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
  appleTeamId: Scalars['ID'];
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
  appleTeamType?: Maybe<AppleTeamType>;
  id: Scalars['ID'];
};


export type AppleTeamAppleAppIdentifiersArgs = {
  bundleIdentifier?: InputMaybe<Scalars['String']>;
};


export type AppleTeamAppleDevicesArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type AppleTeamAppleProvisioningProfilesArgs = {
  appleAppIdentifierId?: InputMaybe<Scalars['ID']>;
};

export type AppleTeamFilterInput = {
  appleTeamIdentifier?: InputMaybe<Scalars['String']>;
};

export type AppleTeamInput = {
  appleTeamIdentifier: Scalars['String'];
  appleTeamName?: InputMaybe<Scalars['String']>;
  appleTeamType?: InputMaybe<AppleTeamType>;
};

export type AppleTeamMutation = {
  __typename?: 'AppleTeamMutation';
  /** Create an Apple Team */
  createAppleTeam: AppleTeam;
  /** Update an Apple Team */
  updateAppleTeam: AppleTeam;
};


export type AppleTeamMutationCreateAppleTeamArgs = {
  accountId: Scalars['ID'];
  appleTeamInput: AppleTeamInput;
};


export type AppleTeamMutationUpdateAppleTeamArgs = {
  appleTeamUpdateInput: AppleTeamUpdateInput;
  id: Scalars['ID'];
};

export type AppleTeamQuery = {
  __typename?: 'AppleTeamQuery';
  byAppleTeamIdentifier?: Maybe<AppleTeam>;
};


export type AppleTeamQueryByAppleTeamIdentifierArgs = {
  accountId: Scalars['ID'];
  identifier: Scalars['String'];
};

export enum AppleTeamType {
  CompanyOrOrganization = 'COMPANY_OR_ORGANIZATION',
  Individual = 'INDIVIDUAL',
  InHouse = 'IN_HOUSE'
}

export type AppleTeamUpdateInput = {
  appleTeamName?: InputMaybe<Scalars['String']>;
  appleTeamType?: InputMaybe<AppleTeamType>;
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

export type AuditLog = {
  __typename?: 'AuditLog';
  account?: Maybe<Account>;
  actor?: Maybe<Actor>;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  metadata?: Maybe<Scalars['JSONObject']>;
  targetEntityId: Scalars['ID'];
  targetEntityMutationType: TargetEntityMutationType;
  targetEntityTypeName: EntityTypeName;
  targetEntityTypePublicName: Scalars['String'];
  websiteMessage: Scalars['String'];
};

export type AuditLogConnection = {
  __typename?: 'AuditLogConnection';
  edges: Array<AuditLogEdge>;
  pageInfo: PageInfo;
};

export type AuditLogEdge = {
  __typename?: 'AuditLogEdge';
  cursor: Scalars['String'];
  node: AuditLog;
};

export type AuditLogExportInput = {
  accountId: Scalars['ID'];
  createdAfter: Scalars['String'];
  createdBefore: Scalars['String'];
  format: AuditLogsExportFormat;
  targetEntityMutationType?: InputMaybe<Array<TargetEntityMutationType>>;
  targetEntityTypeName?: InputMaybe<Array<EntityTypeName>>;
};

export type AuditLogFilterInput = {
  entityTypes?: InputMaybe<Array<EntityTypeName>>;
  mutationTypes?: InputMaybe<Array<TargetEntityMutationType>>;
};

export type AuditLogMutation = {
  __typename?: 'AuditLogMutation';
  /** Exports Audit Logs for an account. Returns the ID of the background job receipt. Use BackgroundJobReceiptQuery to get the status of the job. */
  exportAuditLogs: BackgroundJobReceipt;
};


export type AuditLogMutationExportAuditLogsArgs = {
  exportInput: AuditLogExportInput;
};

export type AuditLogQuery = {
  __typename?: 'AuditLogQuery';
  /** Audit logs for account */
  byId: AuditLog;
  typeNamesMap: Array<LogNameTypeMapping>;
};


export type AuditLogQueryByIdArgs = {
  auditLogId: Scalars['ID'];
};

export enum AuditLogsExportFormat {
  Csv = 'CSV',
  Json = 'JSON',
  Jsonl = 'JSONL'
}

export enum AuthProtocolType {
  Oidc = 'OIDC'
}

export enum AuthProviderIdentifier {
  GoogleWs = 'GOOGLE_WS',
  MsEntraId = 'MS_ENTRA_ID',
  Okta = 'OKTA',
  OneLogin = 'ONE_LOGIN',
  StubIdp = 'STUB_IDP'
}

export type BackgroundJobReceipt = {
  __typename?: 'BackgroundJobReceipt';
  account: Account;
  createdAt: Scalars['DateTime'];
  errorCode?: Maybe<Scalars['String']>;
  errorMessage?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  resultData?: Maybe<Scalars['JSONObject']>;
  resultId?: Maybe<Scalars['ID']>;
  resultType: BackgroundJobResultType;
  state: BackgroundJobState;
  tries: Scalars['Int'];
  updatedAt: Scalars['DateTime'];
  willRetry: Scalars['Boolean'];
};

export type BackgroundJobReceiptQuery = {
  __typename?: 'BackgroundJobReceiptQuery';
  /** Look up background job receipt by ID */
  byId: BackgroundJobReceipt;
};


export type BackgroundJobReceiptQueryByIdArgs = {
  id: Scalars['ID'];
};

export enum BackgroundJobResultType {
  AuditLogsExport = 'AUDIT_LOGS_EXPORT',
  GithubBuild = 'GITHUB_BUILD',
  UserAuditLogsExport = 'USER_AUDIT_LOGS_EXPORT',
  Void = 'VOID'
}

export enum BackgroundJobState {
  Failure = 'FAILURE',
  InProgress = 'IN_PROGRESS',
  Queued = 'QUEUED',
  Success = 'SUCCESS'
}

export type Billing = {
  __typename?: 'Billing';
  /** History of invoices */
  charges?: Maybe<Array<Maybe<Charge>>>;
  id: Scalars['ID'];
  /** @deprecated No longer used */
  payment?: Maybe<PaymentDetails>;
  subscription?: Maybe<SubscriptionDetails>;
};

export type BillingPeriod = {
  __typename?: 'BillingPeriod';
  anchor: Scalars['DateTime'];
  end: Scalars['DateTime'];
  id: Scalars['ID'];
  start: Scalars['DateTime'];
};

export type BranchFilterInput = {
  searchTerm?: InputMaybe<Scalars['String']>;
};

export type BranchQuery = {
  __typename?: 'BranchQuery';
  /** Query a Branch by ID */
  byId: UpdateBranch;
};


export type BranchQueryByIdArgs = {
  branchId: Scalars['ID'];
};

/** Represents an EAS Build */
export type Build = ActivityTimelineProjectActivity & BuildOrBuildJob & {
  __typename?: 'Build';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  app: App;
  appBuildVersion?: Maybe<Scalars['String']>;
  appIdentifier?: Maybe<Scalars['String']>;
  appVersion?: Maybe<Scalars['String']>;
  artifacts?: Maybe<BuildArtifacts>;
  buildMode?: Maybe<BuildMode>;
  buildProfile?: Maybe<Scalars['String']>;
  canRetry: Scalars['Boolean'];
  cancelingActor?: Maybe<Actor>;
  /** @deprecated Use 'updateChannel' field instead. */
  channel?: Maybe<Scalars['String']>;
  childBuild?: Maybe<Build>;
  completedAt?: Maybe<Scalars['DateTime']>;
  createdAt: Scalars['DateTime'];
  customNodeVersion?: Maybe<Scalars['String']>;
  customWorkflowName?: Maybe<Scalars['String']>;
  deployment?: Maybe<Deployment>;
  developmentClient?: Maybe<Scalars['Boolean']>;
  distribution?: Maybe<DistributionType>;
  enqueuedAt?: Maybe<Scalars['DateTime']>;
  error?: Maybe<BuildError>;
  estimatedWaitTimeLeftSeconds?: Maybe<Scalars['Int']>;
  expirationDate?: Maybe<Scalars['DateTime']>;
  gitCommitHash?: Maybe<Scalars['String']>;
  gitCommitMessage?: Maybe<Scalars['String']>;
  gitRef?: Maybe<Scalars['String']>;
  githubRepositoryOwnerAndName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** Queue position is 1-indexed */
  initialQueuePosition?: Maybe<Scalars['Int']>;
  initiatingActor?: Maybe<Actor>;
  /** @deprecated User type is deprecated */
  initiatingUser?: Maybe<User>;
  iosEnterpriseProvisioning?: Maybe<BuildIosEnterpriseProvisioning>;
  isForIosSimulator: Scalars['Boolean'];
  isGitWorkingTreeDirty?: Maybe<Scalars['Boolean']>;
  isWaived: Scalars['Boolean'];
  logFiles: Array<Scalars['String']>;
  maxBuildTimeSeconds: Scalars['Int'];
  /** Retry time starts after completedAt */
  maxRetryTimeMinutes?: Maybe<Scalars['Int']>;
  message?: Maybe<Scalars['String']>;
  metrics?: Maybe<BuildMetrics>;
  parentBuild?: Maybe<Build>;
  platform: AppPlatform;
  priority: BuildPriority;
  /** @deprecated Use app field instead */
  project: Project;
  projectMetadataFileUrl?: Maybe<Scalars['String']>;
  projectRootDirectory?: Maybe<Scalars['String']>;
  provisioningStartedAt?: Maybe<Scalars['DateTime']>;
  /** Queue position is 1-indexed */
  queuePosition?: Maybe<Scalars['Int']>;
  reactNativeVersion?: Maybe<Scalars['String']>;
  releaseChannel?: Maybe<Scalars['String']>;
  requiredPackageManager?: Maybe<Scalars['String']>;
  /**
   * The builder resource class requested by the developer
   * @deprecated Use resourceClassDisplayName instead
   */
  resourceClass: BuildResourceClass;
  /** String describing the resource class used to run the build */
  resourceClassDisplayName: Scalars['String'];
  retryDisabledReason?: Maybe<BuildRetryDisabledReason>;
  runFromCI?: Maybe<Scalars['Boolean']>;
  runtime?: Maybe<Runtime>;
  /** @deprecated Use 'runtime' field instead. */
  runtimeVersion?: Maybe<Scalars['String']>;
  sdkVersion?: Maybe<Scalars['String']>;
  selectedImage?: Maybe<Scalars['String']>;
  status: BuildStatus;
  submissions: Array<Submission>;
  updateChannel?: Maybe<UpdateChannel>;
  updatedAt: Scalars['DateTime'];
  workerStartedAt?: Maybe<Scalars['DateTime']>;
};


/** Represents an EAS Build */
export type BuildCanRetryArgs = {
  newMode?: InputMaybe<BuildMode>;
};


/** Represents an EAS Build */
export type BuildRetryDisabledReasonArgs = {
  newMode?: InputMaybe<BuildMode>;
};

export type BuildAnnotation = {
  __typename?: 'BuildAnnotation';
  authorUsername?: Maybe<Scalars['String']>;
  buildPhase: Scalars['String'];
  exampleBuildLog?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  internalNotes?: Maybe<Scalars['String']>;
  message: Scalars['String'];
  regexFlags?: Maybe<Scalars['String']>;
  regexString: Scalars['String'];
  title: Scalars['String'];
};

export type BuildAnnotationDataInput = {
  buildPhase: Scalars['String'];
  exampleBuildLog?: InputMaybe<Scalars['String']>;
  internalNotes?: InputMaybe<Scalars['String']>;
  message: Scalars['String'];
  regexFlags?: InputMaybe<Scalars['String']>;
  regexString: Scalars['String'];
  title: Scalars['String'];
};

export type BuildAnnotationFiltersInput = {
  buildPhases: Array<Scalars['String']>;
};

export type BuildAnnotationMutation = {
  __typename?: 'BuildAnnotationMutation';
  /** Create a Build Annotation */
  createBuildAnnotation: BuildAnnotation;
  /** Delete a Build Annotation */
  deleteBuildAnnotation: DeleteBuildAnnotationResult;
  /** Update a Build Annotation */
  updateBuildAnnotation: BuildAnnotation;
};


export type BuildAnnotationMutationCreateBuildAnnotationArgs = {
  buildAnnotationData: BuildAnnotationDataInput;
};


export type BuildAnnotationMutationDeleteBuildAnnotationArgs = {
  buildAnnotationId: Scalars['ID'];
};


export type BuildAnnotationMutationUpdateBuildAnnotationArgs = {
  buildAnnotationData: BuildAnnotationDataInput;
  buildAnnotationId: Scalars['ID'];
};

export type BuildAnnotationsQuery = {
  __typename?: 'BuildAnnotationsQuery';
  /** View build annotations */
  all: Array<BuildAnnotation>;
  /** Find a build annotation by ID */
  byId: BuildAnnotation;
};


export type BuildAnnotationsQueryAllArgs = {
  filters?: InputMaybe<BuildAnnotationFiltersInput>;
};


export type BuildAnnotationsQueryByIdArgs = {
  buildAnnotationId: Scalars['ID'];
};

export type BuildArtifacts = {
  __typename?: 'BuildArtifacts';
  applicationArchiveUrl?: Maybe<Scalars['String']>;
  buildArtifactsUrl?: Maybe<Scalars['String']>;
  buildUrl?: Maybe<Scalars['String']>;
  /** @deprecated Use 'runtime.fingerprintDebugInfoUrl' instead. */
  fingerprintUrl?: Maybe<Scalars['String']>;
  xcodeBuildLogsUrl?: Maybe<Scalars['String']>;
};

export type BuildCacheInput = {
  clear?: InputMaybe<Scalars['Boolean']>;
  disabled?: InputMaybe<Scalars['Boolean']>;
  key?: InputMaybe<Scalars['String']>;
  paths?: InputMaybe<Array<Scalars['String']>>;
};

export enum BuildCredentialsSource {
  Local = 'LOCAL',
  Remote = 'REMOTE'
}

export type BuildError = {
  __typename?: 'BuildError';
  buildPhase?: Maybe<BuildPhase>;
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
  simulator?: InputMaybe<Scalars['Boolean']>;
  status?: InputMaybe<BuildStatus>;
};

export type BuildFilterInput = {
  channel?: InputMaybe<Scalars['String']>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  distributions?: InputMaybe<Array<DistributionType>>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  simulator?: InputMaybe<Scalars['Boolean']>;
};

export enum BuildIosEnterpriseProvisioning {
  Adhoc = 'ADHOC',
  Universal = 'UNIVERSAL'
}

export type BuildLimitThresholdExceededMetadata = {
  __typename?: 'BuildLimitThresholdExceededMetadata';
  account: Account;
  thresholdsExceeded: Array<NotificationThresholdExceeded>;
};

export enum BuildLimitThresholdExceededMetadataType {
  Ios = 'IOS',
  Total = 'TOTAL'
}

export type BuildMetadataInput = {
  appBuildVersion?: InputMaybe<Scalars['String']>;
  appIdentifier?: InputMaybe<Scalars['String']>;
  appName?: InputMaybe<Scalars['String']>;
  appVersion?: InputMaybe<Scalars['String']>;
  buildProfile?: InputMaybe<Scalars['String']>;
  channel?: InputMaybe<Scalars['String']>;
  cliVersion?: InputMaybe<Scalars['String']>;
  credentialsSource?: InputMaybe<BuildCredentialsSource>;
  customNodeVersion?: InputMaybe<Scalars['String']>;
  customWorkflowName?: InputMaybe<Scalars['String']>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  distribution?: InputMaybe<DistributionType>;
  environment?: InputMaybe<Scalars['String']>;
  fingerprintSource?: InputMaybe<FingerprintSourceInput>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  gitCommitMessage?: InputMaybe<Scalars['String']>;
  iosEnterpriseProvisioning?: InputMaybe<BuildIosEnterpriseProvisioning>;
  isGitWorkingTreeDirty?: InputMaybe<Scalars['Boolean']>;
  message?: InputMaybe<Scalars['String']>;
  reactNativeVersion?: InputMaybe<Scalars['String']>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  requiredPackageManager?: InputMaybe<Scalars['String']>;
  runFromCI?: InputMaybe<Scalars['Boolean']>;
  runWithNoWaitFlag?: InputMaybe<Scalars['Boolean']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  sdkVersion?: InputMaybe<Scalars['String']>;
  selectedImage?: InputMaybe<Scalars['String']>;
  simulator?: InputMaybe<Scalars['Boolean']>;
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

export enum BuildMode {
  Build = 'BUILD',
  Custom = 'CUSTOM',
  Repack = 'REPACK',
  Resign = 'RESIGN'
}

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
  /** Retry an Android EAS Build */
  retryAndroidBuild: Build;
  /**
   * Retry an EAS Build build
   * @deprecated Use retryAndroidBuild and retryIosBuild instead
   */
  retryBuild: Build;
  /** Retry an iOS EAS Build */
  retryIosBuild: Build;
  /** Update metadata for EAS Build build */
  updateBuildMetadata: Build;
};


export type BuildMutationCancelBuildArgs = {
  buildId: Scalars['ID'];
};


export type BuildMutationCreateAndroidBuildArgs = {
  appId: Scalars['ID'];
  buildParams?: InputMaybe<BuildParamsInput>;
  job: AndroidJobInput;
  metadata?: InputMaybe<BuildMetadataInput>;
};


export type BuildMutationCreateIosBuildArgs = {
  appId: Scalars['ID'];
  buildParams?: InputMaybe<BuildParamsInput>;
  job: IosJobInput;
  metadata?: InputMaybe<BuildMetadataInput>;
};


export type BuildMutationDeleteBuildArgs = {
  buildId: Scalars['ID'];
};


export type BuildMutationRetryAndroidBuildArgs = {
  buildId: Scalars['ID'];
  jobOverrides?: InputMaybe<AndroidJobOverridesInput>;
};


export type BuildMutationRetryBuildArgs = {
  buildId: Scalars['ID'];
};


export type BuildMutationRetryIosBuildArgs = {
  buildId: Scalars['ID'];
  jobOverrides?: InputMaybe<IosJobOverridesInput>;
};


export type BuildMutationUpdateBuildMetadataArgs = {
  buildId: Scalars['ID'];
  metadata: BuildMetadataInput;
};

export type BuildOrBuildJob = {
  id: Scalars['ID'];
};

export type BuildParamsInput = {
  reactNativeVersion?: InputMaybe<Scalars['String']>;
  resourceClass: BuildResourceClass;
  sdkVersion?: InputMaybe<Scalars['String']>;
};

export enum BuildPhase {
  BuilderInfo = 'BUILDER_INFO',
  CleanUpCredentials = 'CLEAN_UP_CREDENTIALS',
  CompleteBuild = 'COMPLETE_BUILD',
  ConfigureExpoUpdates = 'CONFIGURE_EXPO_UPDATES',
  ConfigureXcodeProject = 'CONFIGURE_XCODE_PROJECT',
  Custom = 'CUSTOM',
  DownloadApplicationArchive = 'DOWNLOAD_APPLICATION_ARCHIVE',
  EasBuildInternal = 'EAS_BUILD_INTERNAL',
  FailBuild = 'FAIL_BUILD',
  FixGradlew = 'FIX_GRADLEW',
  InstallCustomTools = 'INSTALL_CUSTOM_TOOLS',
  InstallDependencies = 'INSTALL_DEPENDENCIES',
  InstallPods = 'INSTALL_PODS',
  OnBuildCancelHook = 'ON_BUILD_CANCEL_HOOK',
  OnBuildCompleteHook = 'ON_BUILD_COMPLETE_HOOK',
  OnBuildErrorHook = 'ON_BUILD_ERROR_HOOK',
  OnBuildSuccessHook = 'ON_BUILD_SUCCESS_HOOK',
  ParseCustomWorkflowConfig = 'PARSE_CUSTOM_WORKFLOW_CONFIG',
  PostInstallHook = 'POST_INSTALL_HOOK',
  Prebuild = 'PREBUILD',
  PrepareArtifacts = 'PREPARE_ARTIFACTS',
  PrepareCredentials = 'PREPARE_CREDENTIALS',
  PrepareProject = 'PREPARE_PROJECT',
  PreInstallHook = 'PRE_INSTALL_HOOK',
  PreUploadArtifactsHook = 'PRE_UPLOAD_ARTIFACTS_HOOK',
  Queue = 'QUEUE',
  ReadAppConfig = 'READ_APP_CONFIG',
  ReadPackageJson = 'READ_PACKAGE_JSON',
  RestoreCache = 'RESTORE_CACHE',
  RunExpoDoctor = 'RUN_EXPO_DOCTOR',
  RunFastlane = 'RUN_FASTLANE',
  RunGradlew = 'RUN_GRADLEW',
  SaveCache = 'SAVE_CACHE',
  SetUpBuildEnvironment = 'SET_UP_BUILD_ENVIRONMENT',
  SpinUpBuilder = 'SPIN_UP_BUILDER',
  StartBuild = 'START_BUILD',
  Unknown = 'UNKNOWN',
  UploadApplicationArchive = 'UPLOAD_APPLICATION_ARCHIVE',
  /** @deprecated No longer supported */
  UploadArtifacts = 'UPLOAD_ARTIFACTS',
  UploadBuildArtifacts = 'UPLOAD_BUILD_ARTIFACTS'
}

export type BuildPlanCreditThresholdExceededMetadata = {
  __typename?: 'BuildPlanCreditThresholdExceededMetadata';
  account: Account;
  buildCreditUsage: Scalars['Int'];
  planLimit: Scalars['Int'];
  threshold: Scalars['Int'];
};

export enum BuildPriority {
  High = 'HIGH',
  Normal = 'NORMAL',
  NormalPlus = 'NORMAL_PLUS'
}

/** Publicly visible data for a Build. */
export type BuildPublicData = {
  __typename?: 'BuildPublicData';
  artifacts: PublicArtifacts;
  distribution?: Maybe<DistributionType>;
  id: Scalars['ID'];
  isForIosSimulator: Scalars['Boolean'];
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

export type BuildResignInput = {
  applicationArchiveSource?: InputMaybe<ProjectArchiveSourceInput>;
};

export enum BuildResourceClass {
  AndroidDefault = 'ANDROID_DEFAULT',
  AndroidLarge = 'ANDROID_LARGE',
  AndroidMedium = 'ANDROID_MEDIUM',
  IosDefault = 'IOS_DEFAULT',
  /** @deprecated No longer available. Use IOS_M_LARGE instead. */
  IosIntelLarge = 'IOS_INTEL_LARGE',
  /** @deprecated No longer available. Use IOS_M_MEDIUM instead. */
  IosIntelMedium = 'IOS_INTEL_MEDIUM',
  IosLarge = 'IOS_LARGE',
  /** @deprecated Use IOS_M_MEDIUM instead */
  IosM1Large = 'IOS_M1_LARGE',
  /** @deprecated Use IOS_M_MEDIUM instead */
  IosM1Medium = 'IOS_M1_MEDIUM',
  IosMedium = 'IOS_MEDIUM',
  IosMLarge = 'IOS_M_LARGE',
  IosMMedium = 'IOS_M_MEDIUM',
  Legacy = 'LEGACY',
  LinuxLarge = 'LINUX_LARGE',
  LinuxMedium = 'LINUX_MEDIUM'
}

export enum BuildRetryDisabledReason {
  AlreadyRetried = 'ALREADY_RETRIED',
  InvalidStatus = 'INVALID_STATUS',
  IsGithubBuild = 'IS_GITHUB_BUILD',
  NotCompletedYet = 'NOT_COMPLETED_YET',
  TooMuchTimeElapsed = 'TOO_MUCH_TIME_ELAPSED'
}

export enum BuildStatus {
  Canceled = 'CANCELED',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  InQueue = 'IN_QUEUE',
  New = 'NEW',
  PendingCancel = 'PENDING_CANCEL'
}

export enum BuildTrigger {
  EasCli = 'EAS_CLI',
  GitBasedIntegration = 'GIT_BASED_INTEGRATION'
}

export type BuildUpdatesInput = {
  channel?: InputMaybe<Scalars['String']>;
};

export enum BuildWorkflow {
  Generic = 'GENERIC',
  Managed = 'MANAGED',
  Unknown = 'UNKNOWN'
}

export type Card = {
  __typename?: 'Card';
  brand?: Maybe<Scalars['String']>;
  cardHolder?: Maybe<Scalars['String']>;
  expMonth?: Maybe<Scalars['Int']>;
  expYear?: Maybe<Scalars['Int']>;
  last4?: Maybe<Scalars['String']>;
};

export type ChannelFilterInput = {
  searchTerm?: InputMaybe<Scalars['String']>;
};

export type ChannelQuery = {
  __typename?: 'ChannelQuery';
  /** Query a Channel by ID */
  byId: UpdateChannel;
};


export type ChannelQueryByIdArgs = {
  channelId: Scalars['ID'];
};

export type Charge = {
  __typename?: 'Charge';
  amount: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  invoiceId?: Maybe<Scalars['String']>;
  paid: Scalars['Boolean'];
  receiptUrl?: Maybe<Scalars['String']>;
  wasRefunded: Scalars['Boolean'];
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

export enum ContinentCode {
  Af = 'AF',
  An = 'AN',
  As = 'AS',
  Eu = 'EU',
  Na = 'NA',
  Oc = 'OC',
  Sa = 'SA',
  T1 = 'T1'
}

export enum CrashSampleFor {
  Newest = 'NEWEST',
  Oldest = 'OLDEST'
}

export type CrashesFilters = {
  name?: InputMaybe<Array<Scalars['String']>>;
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
  archiveSource?: InputMaybe<SubmissionArchiveSourceInput>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  config: AndroidSubmissionConfigInput;
  submittedBuildId?: InputMaybe<Scalars['ID']>;
};

export type CreateAppAndGithubRepositoryResponse = {
  __typename?: 'CreateAppAndGithubRepositoryResponse';
  app: App;
  cloneUrl?: Maybe<Scalars['String']>;
};

export type CreateBuildResult = {
  __typename?: 'CreateBuildResult';
  build: Build;
  deprecationInfo?: Maybe<EasBuildDeprecationInfo>;
};

export type CreateEnvironmentSecretInput = {
  name: Scalars['String'];
  type?: InputMaybe<EnvironmentSecretType>;
  value: Scalars['String'];
};

export type CreateEnvironmentVariableInput = {
  environments?: InputMaybe<Array<EnvironmentVariableEnvironment>>;
  fileName?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  overwrite?: InputMaybe<Scalars['Boolean']>;
  type?: InputMaybe<EnvironmentSecretType>;
  value: Scalars['String'];
  visibility: EnvironmentVariableVisibility;
};

export type CreateGitHubAppInstallationInput = {
  accountId: Scalars['ID'];
  installationIdentifier: Scalars['Int'];
};

export type CreateGitHubBuildTriggerInput = {
  appId: Scalars['ID'];
  autoSubmit: Scalars['Boolean'];
  buildProfile: Scalars['String'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  executionBehavior: GitHubBuildTriggerExecutionBehavior;
  isActive: Scalars['Boolean'];
  platform: AppPlatform;
  /** A branch or tag name, or a wildcard pattern where the code change originates from. For example, `main` or `release/*`. */
  sourcePattern: Scalars['String'];
  submitProfile?: InputMaybe<Scalars['String']>;
  /** A branch name or a wildcard pattern that the pull request targets. For example, `main` or `release/*`. */
  targetPattern?: InputMaybe<Scalars['String']>;
  type: GitHubBuildTriggerType;
};

export type CreateGitHubJobRunTriggerInput = {
  appId: Scalars['ID'];
  isActive: Scalars['Boolean'];
  jobType: GitHubJobRunJobType;
  sourcePattern: Scalars['String'];
  targetPattern?: InputMaybe<Scalars['String']>;
  triggerType: GitHubJobRunTriggerType;
};

export type CreateGitHubRepositoryInput = {
  appId: Scalars['ID'];
  githubAppInstallationId: Scalars['ID'];
  githubRepositoryIdentifier: Scalars['Int'];
  nodeIdentifier: Scalars['String'];
};

export type CreateGitHubRepositorySettingsInput = {
  appId: Scalars['ID'];
  /** The base directory is the directory to change to before starting a build. This string should be a properly formatted POSIX path starting with '/', './', or the name of the directory relative to the root of the repository. Valid examples include: '/apps/expo-app', './apps/expo-app', and 'apps/expo-app'. This is intended for monorepos or apps that live in a subdirectory of a repository. */
  baseDirectory: Scalars['String'];
};

export type CreateIosSubmissionInput = {
  appId: Scalars['ID'];
  archiveSource?: InputMaybe<SubmissionArchiveSourceInput>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  config: IosSubmissionConfigInput;
  submittedBuildId?: InputMaybe<Scalars['ID']>;
};

export type CreateServerlessFunctionUploadUrlResult = {
  __typename?: 'CreateServerlessFunctionUploadUrlResult';
  formDataFields: Scalars['JSONObject'];
  url: Scalars['String'];
};

export type CreateSharedEnvironmentVariableInput = {
  environments?: InputMaybe<Array<EnvironmentVariableEnvironment>>;
  fileName?: InputMaybe<Scalars['String']>;
  isGlobal?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
  overwrite?: InputMaybe<Scalars['Boolean']>;
  type?: InputMaybe<EnvironmentSecretType>;
  value: Scalars['String'];
  visibility: EnvironmentVariableVisibility;
};

export type CreateSubmissionResult = {
  __typename?: 'CreateSubmissionResult';
  /** Created submission */
  submission: Submission;
};

export type CumulativeMetrics = {
  __typename?: 'CumulativeMetrics';
  data: UpdatesMetricsData;
  metricsAtLastTimestamp: CumulativeMetricsTotals;
};

export type CumulativeMetricsOverTimeData = {
  __typename?: 'CumulativeMetricsOverTimeData';
  data: LineChartData;
  metricsAtLastTimestamp: Array<LineDatapoint>;
};

export type CumulativeMetricsTotals = {
  __typename?: 'CumulativeMetricsTotals';
  totalFailedInstalls: Scalars['Int'];
  totalInstalls: Scalars['Int'];
};

export type CumulativeUpdatesDataset = {
  __typename?: 'CumulativeUpdatesDataset';
  cumulative: Array<Scalars['Int']>;
  difference: Array<Scalars['Int']>;
  id: Scalars['String'];
  label: Scalars['String'];
};

export type CustomBuildConfigInput = {
  path: Scalars['String'];
};

export type CustomDomainDnsRecord = {
  __typename?: 'CustomDomainDNSRecord';
  dnsContent: Scalars['String'];
  dnsName: Scalars['String'];
  dnsType: CustomDomainDnsRecordType;
  isConfigured: Scalars['Boolean'];
};

export enum CustomDomainDnsRecordType {
  A = 'A',
  Cname = 'CNAME',
  Txt = 'TXT'
}

export type CustomDomainMutation = {
  __typename?: 'CustomDomainMutation';
  deleteCustomDomain: DeleteCustomDomainResult;
  refreshCustomDomain: WorkerCustomDomain;
  registerCustomDomain: WorkerCustomDomain;
};


export type CustomDomainMutationDeleteCustomDomainArgs = {
  customDomainId: Scalars['ID'];
};


export type CustomDomainMutationRefreshCustomDomainArgs = {
  customDomainId: Scalars['ID'];
};


export type CustomDomainMutationRegisterCustomDomainArgs = {
  aliasName?: InputMaybe<Scalars['WorkerDeploymentIdentifier']>;
  appId: Scalars['ID'];
  hostname: Scalars['String'];
};

export type CustomDomainSetup = {
  __typename?: 'CustomDomainSetup';
  sslErrors?: Maybe<Array<Scalars['String']>>;
  sslStatus?: Maybe<CustomDomainStatus>;
  status: CustomDomainStatus;
  verificationErrors?: Maybe<Array<Scalars['String']>>;
  verificationStatus?: Maybe<CustomDomainStatus>;
};

export enum CustomDomainStatus {
  Active = 'ACTIVE',
  Error = 'ERROR',
  Pending = 'PENDING',
  TimedOut = 'TIMED_OUT'
}

export type DatasetTimespan = {
  end: Scalars['DateTime'];
  start: Scalars['DateTime'];
};

export type DeleteAccessTokenResult = {
  __typename?: 'DeleteAccessTokenResult';
  id: Scalars['ID'];
};

export type DeleteAccountResult = {
  __typename?: 'DeleteAccountResult';
  id: Scalars['ID'];
};

export type DeleteAccountSsoConfigurationResult = {
  __typename?: 'DeleteAccountSSOConfigurationResult';
  id: Scalars['ID'];
};

export type DeleteAliasResult = {
  __typename?: 'DeleteAliasResult';
  aliasName?: Maybe<Scalars['WorkerDeploymentIdentifier']>;
  id: Scalars['ID'];
};

export type DeleteAndroidAppCredentialsResult = {
  __typename?: 'DeleteAndroidAppCredentialsResult';
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

export type DeleteBuildAnnotationResult = {
  __typename?: 'DeleteBuildAnnotationResult';
  buildAnnotationId: Scalars['ID'];
};

export type DeleteCustomDomainResult = {
  __typename?: 'DeleteCustomDomainResult';
  appId: Scalars['ID'];
  hostname: Scalars['String'];
  id: Scalars['ID'];
};

export type DeleteDiscordUserResult = {
  __typename?: 'DeleteDiscordUserResult';
  id: Scalars['ID'];
};

export type DeleteEnvironmentSecretResult = {
  __typename?: 'DeleteEnvironmentSecretResult';
  id: Scalars['ID'];
};

export type DeleteEnvironmentVariableResult = {
  __typename?: 'DeleteEnvironmentVariableResult';
  id: Scalars['ID'];
};

export type DeleteGitHubUserResult = {
  __typename?: 'DeleteGitHubUserResult';
  id: Scalars['ID'];
};

export type DeleteGoogleServiceAccountKeyResult = {
  __typename?: 'DeleteGoogleServiceAccountKeyResult';
  id: Scalars['ID'];
};

export type DeleteIosAppBuildCredentialsResult = {
  __typename?: 'DeleteIosAppBuildCredentialsResult';
  id: Scalars['ID'];
};

export type DeleteIosAppCredentialsResult = {
  __typename?: 'DeleteIosAppCredentialsResult';
  id: Scalars['ID'];
};

export type DeleteRobotResult = {
  __typename?: 'DeleteRobotResult';
  id: Scalars['ID'];
};

export type DeleteSsoUserResult = {
  __typename?: 'DeleteSSOUserResult';
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

export type DeleteWorkerDeploymentResult = {
  __typename?: 'DeleteWorkerDeploymentResult';
  deploymentIdentifier: Scalars['WorkerDeploymentIdentifier'];
  id: Scalars['ID'];
};

export type DeployServerlessFunctionResult = {
  __typename?: 'DeployServerlessFunctionResult';
  url: Scalars['String'];
};

/** Represents a Deployment - a set of Builds with the same Runtime Version and Channel */
export type Deployment = {
  __typename?: 'Deployment';
  buildCount: Scalars['Int'];
  builds: DeploymentBuildsConnection;
  channel: UpdateChannel;
  id: Scalars['ID'];
  /** Deployment query field */
  insights: DeploymentInsights;
  /** Ordered the same way as 'updateBranches' in UpdateChannel */
  latestUpdatesPerBranch: Array<LatestUpdateOnBranch>;
  runtime: Runtime;
};


/** Represents a Deployment - a set of Builds with the same Runtime Version and Channel */
export type DeploymentBuildCountArgs = {
  statuses?: InputMaybe<Array<BuildStatus>>;
};


/** Represents a Deployment - a set of Builds with the same Runtime Version and Channel */
export type DeploymentBuildsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


/** Represents a Deployment - a set of Builds with the same Runtime Version and Channel */
export type DeploymentLatestUpdatesPerBranchArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type DeploymentBuildEdge = {
  __typename?: 'DeploymentBuildEdge';
  cursor: Scalars['String'];
  node: Build;
};

/** Represents the connection over the builds edge of a Deployment */
export type DeploymentBuildsConnection = {
  __typename?: 'DeploymentBuildsConnection';
  edges: Array<DeploymentBuildEdge>;
  pageInfo: PageInfo;
};

export type DeploymentCumulativeMetricsOverTimeData = {
  __typename?: 'DeploymentCumulativeMetricsOverTimeData';
  data: LineChartData;
  metricsAtLastTimestamp: Array<LineDatapoint>;
  mostPopularUpdates: Array<Update>;
};

export type DeploymentEdge = {
  __typename?: 'DeploymentEdge';
  cursor: Scalars['String'];
  node: Deployment;
};

export type DeploymentFilterInput = {
  channel?: InputMaybe<Scalars['String']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
};

export type DeploymentInsights = {
  __typename?: 'DeploymentInsights';
  cumulativeMetricsOverTime: DeploymentCumulativeMetricsOverTimeData;
  embeddedUpdateTotalUniqueUsers: Scalars['Int'];
  embeddedUpdateUniqueUsersOverTime: UniqueUsersOverTimeData;
  id: Scalars['ID'];
  mostPopularUpdates: Array<Update>;
  uniqueUsersOverTime: UniqueUsersOverTimeData;
};


export type DeploymentInsightsCumulativeMetricsOverTimeArgs = {
  timespan: InsightsTimespan;
};


export type DeploymentInsightsEmbeddedUpdateTotalUniqueUsersArgs = {
  timespan: InsightsTimespan;
};


export type DeploymentInsightsEmbeddedUpdateUniqueUsersOverTimeArgs = {
  timespan: InsightsTimespan;
};


export type DeploymentInsightsMostPopularUpdatesArgs = {
  timespan: InsightsTimespan;
};


export type DeploymentInsightsUniqueUsersOverTimeArgs = {
  timespan: InsightsTimespan;
};

export type DeploymentQuery = {
  __typename?: 'DeploymentQuery';
  /** Query a Deployment by ID */
  byId: Deployment;
};


export type DeploymentQueryByIdArgs = {
  deploymentId: Scalars['ID'];
};

export type DeploymentResult = {
  __typename?: 'DeploymentResult';
  data?: Maybe<UpdateDeploymentsConnection>;
  error?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type DeploymentSignedUrlResult = {
  __typename?: 'DeploymentSignedUrlResult';
  deploymentIdentifier: Scalars['ID'];
  pendingWorkerDeploymentId: Scalars['ID'];
  url: Scalars['String'];
};

/** Represents the connection over the deployments edge of an App */
export type DeploymentsConnection = {
  __typename?: 'DeploymentsConnection';
  edges: Array<DeploymentEdge>;
  pageInfo: PageInfo;
};

export type DeploymentsMutation = {
  __typename?: 'DeploymentsMutation';
  assignAlias: WorkerDeploymentAlias;
  /** Create a signed deployment URL */
  createSignedDeploymentUrl: DeploymentSignedUrlResult;
  deleteAlias: DeleteAliasResult;
  deleteWorkerDeployment: DeleteWorkerDeploymentResult;
};


export type DeploymentsMutationAssignAliasArgs = {
  aliasName?: InputMaybe<Scalars['WorkerDeploymentIdentifier']>;
  appId: Scalars['ID'];
  deploymentIdentifier: Scalars['ID'];
};


export type DeploymentsMutationCreateSignedDeploymentUrlArgs = {
  appId: Scalars['ID'];
  deploymentIdentifier?: InputMaybe<Scalars['ID']>;
};


export type DeploymentsMutationDeleteAliasArgs = {
  aliasName?: InputMaybe<Scalars['WorkerDeploymentIdentifier']>;
  appId: Scalars['ID'];
};


export type DeploymentsMutationDeleteWorkerDeploymentArgs = {
  workerDeploymentId: Scalars['ID'];
};

export type DiscordUser = {
  __typename?: 'DiscordUser';
  discordIdentifier: Scalars['String'];
  id: Scalars['ID'];
  metadata?: Maybe<DiscordUserMetadata>;
  userActor: UserActor;
};

export type DiscordUserMetadata = {
  __typename?: 'DiscordUserMetadata';
  discordAvatarUrl: Scalars['String'];
  discordDiscriminator: Scalars['String'];
  discordUsername: Scalars['String'];
};

export type DiscordUserMutation = {
  __typename?: 'DiscordUserMutation';
  /** Delete a Discord User by ID */
  deleteDiscordUser: DeleteDiscordUserResult;
};


export type DiscordUserMutationDeleteDiscordUserArgs = {
  id: Scalars['ID'];
};

export enum DistributionType {
  Internal = 'INTERNAL',
  Simulator = 'SIMULATOR',
  Store = 'STORE'
}

export enum EasBuildBillingResourceClass {
  Large = 'LARGE',
  Medium = 'MEDIUM'
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

export enum EasBuildWaiverType {
  FastFailedBuild = 'FAST_FAILED_BUILD',
  SystemError = 'SYSTEM_ERROR'
}

export enum EasService {
  Builds = 'BUILDS',
  Jobs = 'JOBS',
  Updates = 'UPDATES'
}

export enum EasServiceMetric {
  AssetsRequests = 'ASSETS_REQUESTS',
  BandwidthUsage = 'BANDWIDTH_USAGE',
  Builds = 'BUILDS',
  ManifestRequests = 'MANIFEST_REQUESTS',
  RunTime = 'RUN_TIME',
  UniqueUpdaters = 'UNIQUE_UPDATERS',
  UniqueUsers = 'UNIQUE_USERS'
}

export type EasTotalPlanEnablement = {
  __typename?: 'EASTotalPlanEnablement';
  total: Scalars['Int'];
  unit?: Maybe<EasTotalPlanEnablementUnit>;
};

export enum EasTotalPlanEnablementUnit {
  Build = 'BUILD',
  Byte = 'BYTE',
  Concurrency = 'CONCURRENCY',
  Request = 'REQUEST',
  Updater = 'UPDATER',
  User = 'USER'
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

export enum EntityTypeName {
  AccountEntity = 'AccountEntity',
  AccountSsoConfigurationEntity = 'AccountSSOConfigurationEntity',
  AndroidAppCredentialsEntity = 'AndroidAppCredentialsEntity',
  AndroidKeystoreEntity = 'AndroidKeystoreEntity',
  AppEntity = 'AppEntity',
  AppStoreConnectApiKeyEntity = 'AppStoreConnectApiKeyEntity',
  AppleDeviceEntity = 'AppleDeviceEntity',
  AppleDistributionCertificateEntity = 'AppleDistributionCertificateEntity',
  AppleProvisioningProfileEntity = 'AppleProvisioningProfileEntity',
  AppleTeamEntity = 'AppleTeamEntity',
  BranchEntity = 'BranchEntity',
  ChannelEntity = 'ChannelEntity',
  CustomerEntity = 'CustomerEntity',
  GoogleServiceAccountKeyEntity = 'GoogleServiceAccountKeyEntity',
  IosAppCredentialsEntity = 'IosAppCredentialsEntity',
  UserInvitationEntity = 'UserInvitationEntity',
  UserPermissionEntity = 'UserPermissionEntity',
  WorkflowEntity = 'WorkflowEntity',
  WorkflowRevisionEntity = 'WorkflowRevisionEntity'
}

export type EnvironmentSecret = {
  __typename?: 'EnvironmentSecret';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  name: Scalars['String'];
  type: EnvironmentSecretType;
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

export enum EnvironmentSecretType {
  FileBase64 = 'FILE_BASE64',
  String = 'STRING'
}

export type EnvironmentVariable = {
  __typename?: 'EnvironmentVariable';
  apps: Array<App>;
  createdAt: Scalars['DateTime'];
  environments?: Maybe<Array<EnvironmentVariableEnvironment>>;
  fileName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isGlobal?: Maybe<Scalars['Boolean']>;
  linkedEnvironments?: Maybe<Array<EnvironmentVariableEnvironment>>;
  name: Scalars['String'];
  scope: EnvironmentVariableScope;
  type: EnvironmentSecretType;
  updatedAt: Scalars['DateTime'];
  value?: Maybe<Scalars['String']>;
  visibility?: Maybe<EnvironmentVariableVisibility>;
};


export type EnvironmentVariableLinkedEnvironmentsArgs = {
  appFullName?: InputMaybe<Scalars['String']>;
  appId?: InputMaybe<Scalars['String']>;
};


export type EnvironmentVariableValueArgs = {
  includeFileContent?: InputMaybe<Scalars['Boolean']>;
};

export enum EnvironmentVariableEnvironment {
  Development = 'DEVELOPMENT',
  Preview = 'PREVIEW',
  Production = 'PRODUCTION'
}

export type EnvironmentVariableMutation = {
  __typename?: 'EnvironmentVariableMutation';
  /** Create bulk env variables for an Account */
  createBulkEnvironmentVariablesForAccount: Array<EnvironmentVariable>;
  /** Create bulk env variables for an App */
  createBulkEnvironmentVariablesForApp: Array<EnvironmentVariable>;
  /** Create an environment variable for an Account */
  createEnvironmentVariableForAccount: EnvironmentVariable;
  /** Create an environment variable for an App */
  createEnvironmentVariableForApp: EnvironmentVariable;
  /** Delete an environment variable */
  deleteEnvironmentVariable: DeleteEnvironmentVariableResult;
  /** Bulk link shared environment variables */
  linkBulkSharedEnvironmentVariables: Array<EnvironmentVariable>;
  /** Link shared environment variable */
  linkSharedEnvironmentVariable: EnvironmentVariable;
  /** Unlink shared environment variable */
  unlinkSharedEnvironmentVariable: EnvironmentVariable;
  /** Update an environment variable */
  updateEnvironmentVariable: EnvironmentVariable;
};


export type EnvironmentVariableMutationCreateBulkEnvironmentVariablesForAccountArgs = {
  accountId: Scalars['ID'];
  environmentVariablesData: Array<CreateSharedEnvironmentVariableInput>;
};


export type EnvironmentVariableMutationCreateBulkEnvironmentVariablesForAppArgs = {
  appId: Scalars['ID'];
  environmentVariablesData: Array<CreateEnvironmentVariableInput>;
};


export type EnvironmentVariableMutationCreateEnvironmentVariableForAccountArgs = {
  accountId: Scalars['ID'];
  environmentVariableData: CreateSharedEnvironmentVariableInput;
};


export type EnvironmentVariableMutationCreateEnvironmentVariableForAppArgs = {
  appId: Scalars['ID'];
  environmentVariableData: CreateEnvironmentVariableInput;
};


export type EnvironmentVariableMutationDeleteEnvironmentVariableArgs = {
  id: Scalars['ID'];
};


export type EnvironmentVariableMutationLinkBulkSharedEnvironmentVariablesArgs = {
  linkData: Array<LinkSharedEnvironmentVariableInput>;
};


export type EnvironmentVariableMutationLinkSharedEnvironmentVariableArgs = {
  appId: Scalars['ID'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  environmentVariableId: Scalars['ID'];
};


export type EnvironmentVariableMutationUnlinkSharedEnvironmentVariableArgs = {
  appId: Scalars['ID'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  environmentVariableId: Scalars['ID'];
};


export type EnvironmentVariableMutationUpdateEnvironmentVariableArgs = {
  environmentVariableData: UpdateEnvironmentVariableInput;
};

export enum EnvironmentVariableScope {
  Project = 'PROJECT',
  Shared = 'SHARED'
}

export enum EnvironmentVariableVisibility {
  Public = 'PUBLIC',
  Secret = 'SECRET',
  Sensitive = 'SENSITIVE'
}

export type EnvironmentVariableWithSecret = {
  __typename?: 'EnvironmentVariableWithSecret';
  apps: Array<App>;
  createdAt: Scalars['DateTime'];
  environments?: Maybe<Array<EnvironmentVariableEnvironment>>;
  fileName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isGlobal: Scalars['Boolean'];
  linkedEnvironments?: Maybe<Array<EnvironmentVariableEnvironment>>;
  name: Scalars['String'];
  scope: EnvironmentVariableScope;
  sensitive: Scalars['Boolean'];
  type: EnvironmentSecretType;
  updatedAt: Scalars['DateTime'];
  value?: Maybe<Scalars['String']>;
  visibility: EnvironmentVariableVisibility;
};


export type EnvironmentVariableWithSecretLinkedEnvironmentsArgs = {
  appFullName?: InputMaybe<Scalars['String']>;
  appId?: InputMaybe<Scalars['String']>;
};


export type EnvironmentVariableWithSecretValueArgs = {
  includeFileContent?: InputMaybe<Scalars['Boolean']>;
};

export type EstimatedOverageAndCost = {
  __typename?: 'EstimatedOverageAndCost';
  id: Scalars['ID'];
  /** The limit, in units, allowed by this plan */
  limit: Scalars['Float'];
  metadata?: Maybe<AccountUsageMetadata>;
  metricType: UsageMetricType;
  service: EasService;
  serviceMetric: EasServiceMetric;
  /** Total cost of this particular metric, in cents */
  totalCost: Scalars['Int'];
  value: Scalars['Float'];
};

export type EstimatedUsage = {
  __typename?: 'EstimatedUsage';
  id: Scalars['ID'];
  limit: Scalars['Float'];
  metricType: UsageMetricType;
  service: EasService;
  serviceMetric: EasServiceMetric;
  value: Scalars['Float'];
};

export enum Experiment {
  Orbit = 'ORBIT'
}

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

export type FingerprintSourceInput = {
  bucketKey?: InputMaybe<Scalars['String']>;
  isDebugFingerprint?: InputMaybe<Scalars['Boolean']>;
  type?: InputMaybe<FingerprintSourceType>;
};

export enum FingerprintSourceType {
  Gcs = 'GCS'
}

export type FutureSubscription = {
  __typename?: 'FutureSubscription';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  meteredBillingStatus: MeteredBillingStatus;
  planId: Scalars['String'];
  recurringCents?: Maybe<Scalars['Int']>;
  startDate: Scalars['DateTime'];
};

export type GetSignedAssetUploadSpecificationsResult = {
  __typename?: 'GetSignedAssetUploadSpecificationsResult';
  specifications: Array<Scalars['String']>;
};

export enum GitHubAppEnvironment {
  Development = 'DEVELOPMENT',
  Production = 'PRODUCTION',
  Staging = 'STAGING'
}

export type GitHubAppInstallation = {
  __typename?: 'GitHubAppInstallation';
  account: Account;
  actor?: Maybe<Actor>;
  id: Scalars['ID'];
  installationIdentifier: Scalars['Int'];
  metadata: GitHubAppInstallationMetadata;
};

export type GitHubAppInstallationAccessibleRepository = {
  __typename?: 'GitHubAppInstallationAccessibleRepository';
  defaultBranch?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['Int'];
  name: Scalars['String'];
  nodeId: Scalars['String'];
  owner: GitHubRepositoryOwner;
  private: Scalars['Boolean'];
  url: Scalars['String'];
};

export type GitHubAppInstallationMetadata = {
  __typename?: 'GitHubAppInstallationMetadata';
  githubAccountAvatarUrl?: Maybe<Scalars['String']>;
  githubAccountName?: Maybe<Scalars['String']>;
  installationStatus: GitHubAppInstallationStatus;
};

export type GitHubAppInstallationMutation = {
  __typename?: 'GitHubAppInstallationMutation';
  /** Create a GitHub App installation for an Account */
  createGitHubAppInstallationForAccount: GitHubAppInstallation;
  /** Delete a GitHub App installation by ID */
  deleteGitHubAppInstallation: GitHubAppInstallation;
};


export type GitHubAppInstallationMutationCreateGitHubAppInstallationForAccountArgs = {
  githubAppInstallationData: CreateGitHubAppInstallationInput;
};


export type GitHubAppInstallationMutationDeleteGitHubAppInstallationArgs = {
  githubAppInstallationId: Scalars['ID'];
};

export enum GitHubAppInstallationStatus {
  Active = 'ACTIVE',
  NotInstalled = 'NOT_INSTALLED',
  Suspended = 'SUSPENDED'
}

export type GitHubAppMutation = {
  __typename?: 'GitHubAppMutation';
  /** Create a GitHub build for an app. Returns the ID of the background job receipt. Use BackgroundJobReceiptQuery to get the status of the job. */
  createGitHubBuild: BackgroundJobReceipt;
};


export type GitHubAppMutationCreateGitHubBuildArgs = {
  buildInput: GitHubBuildInput;
};

export type GitHubAppQuery = {
  __typename?: 'GitHubAppQuery';
  appIdentifier: Scalars['String'];
  clientIdentifier: Scalars['String'];
  environment: GitHubAppEnvironment;
  installation: GitHubAppInstallation;
  name: Scalars['String'];
};


export type GitHubAppQueryInstallationArgs = {
  id: Scalars['ID'];
};

export type GitHubBuildInput = {
  appId: Scalars['ID'];
  autoSubmit?: InputMaybe<Scalars['Boolean']>;
  baseDirectory?: InputMaybe<Scalars['String']>;
  buildProfile: Scalars['String'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  gitRef: Scalars['String'];
  platform: AppPlatform;
  /** Repack the golden dev client build instead of running full build process. Used for onboarding. Do not use outside of onboarding flow, as for now it's only created with this specific use case in mind. */
  repack?: InputMaybe<Scalars['Boolean']>;
  submitProfile?: InputMaybe<Scalars['String']>;
};

export type GitHubBuildTrigger = {
  __typename?: 'GitHubBuildTrigger';
  app: App;
  autoSubmit: Scalars['Boolean'];
  buildProfile: Scalars['String'];
  createdAt: Scalars['DateTime'];
  environment?: Maybe<EnvironmentVariableEnvironment>;
  executionBehavior: GitHubBuildTriggerExecutionBehavior;
  id: Scalars['ID'];
  isActive: Scalars['Boolean'];
  lastRunAt?: Maybe<Scalars['DateTime']>;
  lastRunBuild?: Maybe<Build>;
  lastRunErrorCode?: Maybe<Scalars['String']>;
  lastRunErrorMessage?: Maybe<Scalars['String']>;
  lastRunStatus?: Maybe<GitHubBuildTriggerRunStatus>;
  platform: AppPlatform;
  sourcePattern: Scalars['String'];
  submitProfile?: Maybe<Scalars['String']>;
  targetPattern?: Maybe<Scalars['String']>;
  type: GitHubBuildTriggerType;
  updatedAt: Scalars['DateTime'];
};

export enum GitHubBuildTriggerExecutionBehavior {
  Always = 'ALWAYS',
  BaseDirectoryChanged = 'BASE_DIRECTORY_CHANGED'
}

export type GitHubBuildTriggerMutation = {
  __typename?: 'GitHubBuildTriggerMutation';
  /** Create GitHub build trigger for an App */
  createGitHubBuildTrigger: GitHubBuildTrigger;
  /** Delete GitHub build trigger by ID */
  deleteGitHubBuildTrigger: GitHubBuildTrigger;
  /** Update a GitHub build trigger by ID */
  updateGitHubBuildTrigger: GitHubBuildTrigger;
};


export type GitHubBuildTriggerMutationCreateGitHubBuildTriggerArgs = {
  githubBuildTriggerData: CreateGitHubBuildTriggerInput;
};


export type GitHubBuildTriggerMutationDeleteGitHubBuildTriggerArgs = {
  githubBuildTriggerId: Scalars['ID'];
};


export type GitHubBuildTriggerMutationUpdateGitHubBuildTriggerArgs = {
  githubBuildTriggerData: UpdateGitHubBuildTriggerInput;
  githubBuildTriggerId: Scalars['ID'];
};

export enum GitHubBuildTriggerRunStatus {
  Errored = 'ERRORED',
  Success = 'SUCCESS'
}

export enum GitHubBuildTriggerType {
  PullRequestUpdated = 'PULL_REQUEST_UPDATED',
  PushToBranch = 'PUSH_TO_BRANCH',
  TagUpdated = 'TAG_UPDATED'
}

export enum GitHubJobRunJobType {
  PublishUpdate = 'PUBLISH_UPDATE'
}

export type GitHubJobRunTrigger = {
  __typename?: 'GitHubJobRunTrigger';
  app: App;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  isActive: Scalars['Boolean'];
  jobType?: Maybe<GitHubJobRunJobType>;
  lastRunAt?: Maybe<Scalars['DateTime']>;
  lastRunErrorCode?: Maybe<Scalars['String']>;
  lastRunErrorMessage?: Maybe<Scalars['String']>;
  lastRunStatus?: Maybe<GitHubJobRunTriggerRunStatus>;
  sourcePattern: Scalars['String'];
  targetPattern?: Maybe<Scalars['String']>;
  triggerType: GitHubJobRunTriggerType;
};

export type GitHubJobRunTriggerMutation = {
  __typename?: 'GitHubJobRunTriggerMutation';
  createGitHubJobRunTrigger: GitHubJobRunTrigger;
  deleteGitHubJobRunTrigger: GitHubJobRunTrigger;
  updateGitHubJobRunTrigger: GitHubJobRunTrigger;
};


export type GitHubJobRunTriggerMutationCreateGitHubJobRunTriggerArgs = {
  gitHubJobRunTriggerData: CreateGitHubJobRunTriggerInput;
};


export type GitHubJobRunTriggerMutationDeleteGitHubJobRunTriggerArgs = {
  gitHubJobRunTriggerId: Scalars['ID'];
};


export type GitHubJobRunTriggerMutationUpdateGitHubJobRunTriggerArgs = {
  gitHubJobRunTriggerData: UpdateGitHubJobRunTriggerInput;
  gitHubJobRunTriggerId: Scalars['ID'];
};

export enum GitHubJobRunTriggerRunStatus {
  Errored = 'ERRORED',
  Success = 'SUCCESS'
}

export enum GitHubJobRunTriggerType {
  PullRequestUpdated = 'PULL_REQUEST_UPDATED',
  PushToBranch = 'PUSH_TO_BRANCH'
}

export type GitHubRepository = {
  __typename?: 'GitHubRepository';
  app: App;
  createdAt: Scalars['DateTime'];
  githubAppInstallation: GitHubAppInstallation;
  githubRepositoryIdentifier: Scalars['Int'];
  githubRepositoryUrl?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  metadata: GitHubRepositoryMetadata;
  nodeIdentifier: Scalars['String'];
};

export type GitHubRepositoryMetadata = {
  __typename?: 'GitHubRepositoryMetadata';
  defaultBranch?: Maybe<Scalars['String']>;
  githubRepoDescription?: Maybe<Scalars['String']>;
  githubRepoName: Scalars['String'];
  githubRepoOwnerName: Scalars['String'];
  githubRepoUrl: Scalars['String'];
  lastPushed: Scalars['DateTime'];
  lastUpdated: Scalars['DateTime'];
  private: Scalars['Boolean'];
};

export type GitHubRepositoryMutation = {
  __typename?: 'GitHubRepositoryMutation';
  /** Configure EAS by pushing a commit to the default branch which updates or creates app.json, eas.json, and installs necessary dependencies. */
  configureEAS: BackgroundJobReceipt;
  /** Create a GitHub repository for an App */
  createGitHubRepository: GitHubRepository;
  /** Delete a GitHub repository by ID */
  deleteGitHubRepository: GitHubRepository;
};


export type GitHubRepositoryMutationConfigureEasArgs = {
  githubRepositoryId: Scalars['ID'];
};


export type GitHubRepositoryMutationCreateGitHubRepositoryArgs = {
  githubRepositoryData: CreateGitHubRepositoryInput;
};


export type GitHubRepositoryMutationDeleteGitHubRepositoryArgs = {
  githubRepositoryId: Scalars['ID'];
};

export type GitHubRepositoryOwner = {
  __typename?: 'GitHubRepositoryOwner';
  avatarUrl: Scalars['String'];
  id: Scalars['Int'];
  login: Scalars['String'];
  url: Scalars['String'];
};

export type GitHubRepositoryPaginationResult = {
  __typename?: 'GitHubRepositoryPaginationResult';
  repositories: Array<GitHubAppInstallationAccessibleRepository>;
  totalCount: Scalars['Int'];
};

export type GitHubRepositorySettings = {
  __typename?: 'GitHubRepositorySettings';
  app: App;
  baseDirectory: Scalars['String'];
  id: Scalars['ID'];
};

export type GitHubRepositorySettingsMutation = {
  __typename?: 'GitHubRepositorySettingsMutation';
  /** Create GitHub repository settings for an App */
  createGitHubRepositorySettings: GitHubRepositorySettings;
  /** Delete GitHub repository settings by ID */
  deleteGitHubRepositorySettings: GitHubRepositorySettings;
  /** Update GitHub repository settings */
  updateGitHubRepositorySettings: GitHubRepositorySettings;
};


export type GitHubRepositorySettingsMutationCreateGitHubRepositorySettingsArgs = {
  githubRepositorySettingsData: CreateGitHubRepositorySettingsInput;
};


export type GitHubRepositorySettingsMutationDeleteGitHubRepositorySettingsArgs = {
  githubRepositorySettingsId: Scalars['ID'];
};


export type GitHubRepositorySettingsMutationUpdateGitHubRepositorySettingsArgs = {
  githubRepositorySettingsData: UpdateGitHubRepositorySettingsInput;
  githubRepositorySettingsId: Scalars['ID'];
};

export type GitHubUser = {
  __typename?: 'GitHubUser';
  githubUserIdentifier: Scalars['String'];
  id: Scalars['ID'];
  metadata?: Maybe<GitHubUserMetadata>;
  userActor: UserActor;
};

export type GitHubUserMetadata = {
  __typename?: 'GitHubUserMetadata';
  avatarUrl: Scalars['String'];
  login: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  url: Scalars['String'];
};

export type GitHubUserMutation = {
  __typename?: 'GitHubUserMutation';
  /** Delete a GitHub User by ID */
  deleteGitHubUser: DeleteGitHubUserResult;
  /** Generate a GitHub User Access Token */
  generateGitHubUserAccessToken?: Maybe<Scalars['String']>;
};


export type GitHubUserMutationDeleteGitHubUserArgs = {
  id: Scalars['ID'];
};

export type GoogleServiceAccountKey = {
  __typename?: 'GoogleServiceAccountKey';
  account: Account;
  clientEmail: Scalars['String'];
  clientIdentifier: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  keyJson: Scalars['String'];
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

export type GoogleServiceAccountKeyQuery = {
  __typename?: 'GoogleServiceAccountKeyQuery';
  byId: GoogleServiceAccountKey;
};


export type GoogleServiceAccountKeyQueryByIdArgs = {
  id: Scalars['ID'];
};

/**
 * The value field is always sent from the client as a string,
 * and then it's parsed server-side according to the filterType
 */
export type InsightsFilter = {
  filterType: InsightsFilterType;
  value: Scalars['String'];
};

export enum InsightsFilterType {
  Platform = 'PLATFORM'
}

export type InsightsTimespan = {
  end: Scalars['DateTime'];
  start: Scalars['DateTime'];
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
  metadata: Scalars['JSONObject'];
  period: InvoicePeriod;
  /** @deprecated Use 'price' instead */
  plan: InvoiceLineItemPlan;
  price?: Maybe<StripePrice>;
  proration: Scalars['Boolean'];
  quantity: Scalars['Int'];
  /** The unit amount excluding tax, in cents */
  unitAmountExcludingTax?: Maybe<Scalars['Float']>;
};

export type InvoiceLineItemPlan = {
  __typename?: 'InvoiceLineItemPlan';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};

export type InvoicePeriod = {
  __typename?: 'InvoicePeriod';
  end: Scalars['DateTime'];
  start: Scalars['DateTime'];
};

export type InvoiceQuery = {
  __typename?: 'InvoiceQuery';
  /**
   * Previews the invoice for the specified number of additional concurrencies.
   * This is the total number of concurrencies the customer wishes to purchase
   * on top of their base plan, not the relative change in concurrencies
   * the customer wishes to make. For example, specify "3" if the customer has
   * two add-on concurrencies and wishes to purchase one more.
   */
  previewInvoiceForAdditionalConcurrenciesCountUpdate?: Maybe<Invoice>;
  /** Preview an upgrade subscription invoice, with proration */
  previewInvoiceForSubscriptionUpdate: Invoice;
};


export type InvoiceQueryPreviewInvoiceForAdditionalConcurrenciesCountUpdateArgs = {
  accountID: Scalars['ID'];
  additionalConcurrenciesCount: Scalars['Int'];
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
  /** Disassociate the build credentials from an iOS app */
  deleteIosAppBuildCredentials: DeleteIosAppBuildCredentialsResult;
  /** Set the distribution certificate to be used for an iOS app */
  setDistributionCertificate: IosAppBuildCredentials;
  /** Set the provisioning profile to be used for an iOS app */
  setProvisioningProfile: IosAppBuildCredentials;
};


export type IosAppBuildCredentialsMutationCreateIosAppBuildCredentialsArgs = {
  iosAppBuildCredentialsInput: IosAppBuildCredentialsInput;
  iosAppCredentialsId: Scalars['ID'];
};


export type IosAppBuildCredentialsMutationDeleteIosAppBuildCredentialsArgs = {
  id: Scalars['ID'];
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
  appStoreConnectApiKeyForBuilds?: Maybe<AppStoreConnectApiKey>;
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
  appStoreConnectApiKeyForBuildsId?: InputMaybe<Scalars['ID']>;
  appStoreConnectApiKeyForSubmissionsId?: InputMaybe<Scalars['ID']>;
  appleTeamId?: InputMaybe<Scalars['ID']>;
  pushKeyId?: InputMaybe<Scalars['ID']>;
};

export type IosAppCredentialsMutation = {
  __typename?: 'IosAppCredentialsMutation';
  /** Create a set of credentials for an iOS app */
  createIosAppCredentials: IosAppCredentials;
  /** Delete a set of credentials for an iOS app */
  deleteIosAppCredentials: DeleteIosAppCredentialsResult;
  /** Set the App Store Connect Api Key to be used for submitting an iOS app */
  setAppStoreConnectApiKeyForSubmissions: IosAppCredentials;
  /** Set the push key to be used in an iOS app */
  setPushKey: IosAppCredentials;
  /** Update a set of credentials for an iOS app */
  updateIosAppCredentials: IosAppCredentials;
};


export type IosAppCredentialsMutationCreateIosAppCredentialsArgs = {
  appId: Scalars['ID'];
  appleAppIdentifierId: Scalars['ID'];
  iosAppCredentialsInput: IosAppCredentialsInput;
};


export type IosAppCredentialsMutationDeleteIosAppCredentialsArgs = {
  id: Scalars['ID'];
};


export type IosAppCredentialsMutationSetAppStoreConnectApiKeyForSubmissionsArgs = {
  ascApiKeyId: Scalars['ID'];
  id: Scalars['ID'];
};


export type IosAppCredentialsMutationSetPushKeyArgs = {
  id: Scalars['ID'];
  pushKeyId: Scalars['ID'];
};


export type IosAppCredentialsMutationUpdateIosAppCredentialsArgs = {
  id: Scalars['ID'];
  iosAppCredentialsInput: IosAppCredentialsInput;
};

/** @deprecated Use developmentClient option instead. */
export enum IosBuildType {
  DevelopmentClient = 'DEVELOPMENT_CLIENT',
  Release = 'RELEASE'
}

export type IosBuilderEnvironmentInput = {
  bun?: InputMaybe<Scalars['String']>;
  bundler?: InputMaybe<Scalars['String']>;
  cocoapods?: InputMaybe<Scalars['String']>;
  env?: InputMaybe<Scalars['JSONObject']>;
  expoCli?: InputMaybe<Scalars['String']>;
  fastlane?: InputMaybe<Scalars['String']>;
  image?: InputMaybe<Scalars['String']>;
  node?: InputMaybe<Scalars['String']>;
  pnpm?: InputMaybe<Scalars['String']>;
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
  applicationArchivePath?: InputMaybe<Scalars['String']>;
  /** @deprecated */
  artifactPath?: InputMaybe<Scalars['String']>;
  buildArtifactPaths?: InputMaybe<Array<Scalars['String']>>;
  buildConfiguration?: InputMaybe<Scalars['String']>;
  buildProfile?: InputMaybe<Scalars['String']>;
  /** @deprecated */
  buildType?: InputMaybe<IosBuildType>;
  builderEnvironment?: InputMaybe<IosBuilderEnvironmentInput>;
  cache?: InputMaybe<BuildCacheInput>;
  customBuildConfig?: InputMaybe<CustomBuildConfigInput>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  /** @deprecated */
  distribution?: InputMaybe<DistributionType>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
  loggerLevel?: InputMaybe<WorkerLoggerLevel>;
  mode?: InputMaybe<BuildMode>;
  projectArchive: ProjectArchiveSourceInput;
  projectRootDirectory: Scalars['String'];
  releaseChannel?: InputMaybe<Scalars['String']>;
  scheme?: InputMaybe<Scalars['String']>;
  secrets?: InputMaybe<IosJobSecretsInput>;
  simulator?: InputMaybe<Scalars['Boolean']>;
  triggeredBy?: InputMaybe<BuildTrigger>;
  type: BuildWorkflow;
  updates?: InputMaybe<BuildUpdatesInput>;
  username?: InputMaybe<Scalars['String']>;
  version?: InputMaybe<IosJobVersionInput>;
};

export type IosJobOverridesInput = {
  applicationArchivePath?: InputMaybe<Scalars['String']>;
  /** @deprecated */
  artifactPath?: InputMaybe<Scalars['String']>;
  buildArtifactPaths?: InputMaybe<Array<Scalars['String']>>;
  buildConfiguration?: InputMaybe<Scalars['String']>;
  buildProfile?: InputMaybe<Scalars['String']>;
  /** @deprecated */
  buildType?: InputMaybe<IosBuildType>;
  builderEnvironment?: InputMaybe<IosBuilderEnvironmentInput>;
  cache?: InputMaybe<BuildCacheInput>;
  customBuildConfig?: InputMaybe<CustomBuildConfigInput>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  /** @deprecated */
  distribution?: InputMaybe<DistributionType>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
  loggerLevel?: InputMaybe<WorkerLoggerLevel>;
  mode?: InputMaybe<BuildMode>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  resign?: InputMaybe<BuildResignInput>;
  scheme?: InputMaybe<Scalars['String']>;
  secrets?: InputMaybe<IosJobSecretsInput>;
  simulator?: InputMaybe<Scalars['Boolean']>;
  type?: InputMaybe<BuildWorkflow>;
  updates?: InputMaybe<BuildUpdatesInput>;
  username?: InputMaybe<Scalars['String']>;
  version?: InputMaybe<IosJobVersionInput>;
};

export type IosJobSecretsInput = {
  buildCredentials?: InputMaybe<Array<InputMaybe<IosJobTargetCredentialsInput>>>;
  robotAccessToken?: InputMaybe<Scalars['String']>;
};

export type IosJobTargetCredentialsInput = {
  distributionCertificate: IosJobDistributionCertificateInput;
  provisioningProfileBase64: Scalars['String'];
  targetName: Scalars['String'];
};

export type IosJobVersionInput = {
  buildNumber: Scalars['String'];
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
  isVerboseFastlaneEnabled?: InputMaybe<Scalars['Boolean']>;
};

/** Represents a Turtle Job Run */
export type JobRun = {
  __typename?: 'JobRun';
  app: App;
  /** @deprecated No longer supported */
  childJobRun?: Maybe<JobRun>;
  createdAt: Scalars['DateTime'];
  displayName?: Maybe<Scalars['String']>;
  endedAt?: Maybe<Scalars['DateTime']>;
  expiresAt: Scalars['DateTime'];
  gitCommitHash?: Maybe<Scalars['String']>;
  gitCommitMessage?: Maybe<Scalars['String']>;
  gitRef?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  initiatingActor?: Maybe<Actor>;
  isWaived: Scalars['Boolean'];
  logFileUrls: Array<Scalars['String']>;
  name: Scalars['String'];
  priority: JobRunPriority;
  startedAt?: Maybe<Scalars['DateTime']>;
  status: JobRunStatus;
  updateGroups: Array<Array<Update>>;
};

export type JobRunMutation = {
  __typename?: 'JobRunMutation';
  /** Cancel an EAS Job Run */
  cancelJobRun: JobRun;
};


export type JobRunMutationCancelJobRunArgs = {
  jobRunId: Scalars['ID'];
};

export enum JobRunPriority {
  High = 'HIGH',
  Normal = 'NORMAL'
}

export type JobRunQuery = {
  __typename?: 'JobRunQuery';
  /** Look up EAS Job Run by ID */
  byId: JobRun;
};


export type JobRunQueryByIdArgs = {
  jobRunId: Scalars['ID'];
};

export enum JobRunStatus {
  Canceled = 'CANCELED',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  InQueue = 'IN_QUEUE',
  New = 'NEW',
  PendingCancel = 'PENDING_CANCEL'
}

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

export type LatestUpdateOnBranch = {
  __typename?: 'LatestUpdateOnBranch';
  branchId: Scalars['String'];
  update?: Maybe<Update>;
};

export type LeaveAccountResult = {
  __typename?: 'LeaveAccountResult';
  success: Scalars['Boolean'];
};

export type LineChartData = {
  __typename?: 'LineChartData';
  datasets: Array<LineDataset>;
  labels: Array<Scalars['String']>;
};

export type LineDatapoint = {
  __typename?: 'LineDatapoint';
  data: Scalars['Int'];
  id: Scalars['ID'];
  label: Scalars['String'];
};

export type LineDataset = {
  __typename?: 'LineDataset';
  data: Array<Maybe<Scalars['Int']>>;
  id: Scalars['ID'];
  label: Scalars['String'];
};

export type LinkSharedEnvironmentVariableInput = {
  appId: Scalars['ID'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  environmentVariableId: Scalars['ID'];
};

export type LogNameTypeMapping = {
  __typename?: 'LogNameTypeMapping';
  publicName: Scalars['String'];
  typeName: EntityTypeName;
};

export type LogsTimespan = {
  end: Scalars['DateTime'];
  start?: InputMaybe<Scalars['DateTime']>;
};

export enum MailchimpAudience {
  ExpoDevelopers = 'EXPO_DEVELOPERS',
  ExpoDeveloperOnboarding = 'EXPO_DEVELOPER_ONBOARDING',
  LaunchParty_2024 = 'LAUNCH_PARTY_2024',
  NonprodExpoDevelopers = 'NONPROD_EXPO_DEVELOPERS'
}

export enum MailchimpTag {
  DevClientUsers = 'DEV_CLIENT_USERS',
  DidSubscribeToEasAtLeastOnce = 'DID_SUBSCRIBE_TO_EAS_AT_LEAST_ONCE',
  EasMasterList = 'EAS_MASTER_LIST',
  NewsletterSignupList = 'NEWSLETTER_SIGNUP_LIST'
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
  /** Schedule deletion for Account created via createAccount */
  scheduleAccountDeletion: BackgroundJobReceipt;
  /** Schedule deletion of the current regular user */
  scheduleCurrentUserDeletion: BackgroundJobReceipt;
  /** Schedule deletion of a SSO user. Actor must be an owner on the SSO user's SSO account. */
  scheduleSSOUserDeletionAsSSOAccountOwner: BackgroundJobReceipt;
  /** Send SMS OTP to a second factor device for use during device setup or during change confirmation */
  sendSMSOTPToSecondFactorDevice: SecondFactorBooleanResult;
  /**
   * Sets user preferences. This is a key-value store for user-specific settings. Provided values are
   * key-level merged with existing values.
   */
  setPreferences: UserPreferences;
  /** Set the user's primary second factor device */
  setPrimarySecondFactorDevice: SecondFactorBooleanResult;
  /** Transfer project to a different Account */
  transferApp: App;
  /** Update an App that the current user owns */
  updateApp: App;
  /** Update the current regular user's data */
  updateProfile: User;
  /** Update the current SSO user's data */
  updateSSOProfile: SsoUser;
};


export type MeMutationAddSecondFactorDeviceArgs = {
  deviceConfiguration: SecondFactorDeviceConfiguration;
  otp?: InputMaybe<Scalars['String']>;
};


export type MeMutationCertifySecondFactorDeviceArgs = {
  otp: Scalars['String'];
};


export type MeMutationCreateAccountArgs = {
  accountData: AccountDataInput;
};


export type MeMutationDeleteSecondFactorDeviceArgs = {
  otp?: InputMaybe<Scalars['String']>;
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationDeleteSnackArgs = {
  snackId: Scalars['ID'];
};


export type MeMutationDisableSecondFactorAuthenticationArgs = {
  otp?: InputMaybe<Scalars['String']>;
};


export type MeMutationInitiateSecondFactorAuthenticationArgs = {
  deviceConfigurations: Array<SecondFactorDeviceConfiguration>;
  recaptchaResponseToken?: InputMaybe<Scalars['String']>;
};


export type MeMutationLeaveAccountArgs = {
  accountId: Scalars['ID'];
};


export type MeMutationRegenerateSecondFactorBackupCodesArgs = {
  otp?: InputMaybe<Scalars['String']>;
};


export type MeMutationScheduleAccountDeletionArgs = {
  accountId: Scalars['ID'];
};


export type MeMutationScheduleSsoUserDeletionAsSsoAccountOwnerArgs = {
  ssoUserId: Scalars['ID'];
};


export type MeMutationSendSmsotpToSecondFactorDeviceArgs = {
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationSetPreferencesArgs = {
  preferences: UserPreferencesInput;
};


export type MeMutationSetPrimarySecondFactorDeviceArgs = {
  userSecondFactorDeviceId: Scalars['ID'];
};


export type MeMutationTransferAppArgs = {
  appId: Scalars['ID'];
  destinationAccountId: Scalars['ID'];
};


export type MeMutationUpdateAppArgs = {
  appData: AppDataInput;
};


export type MeMutationUpdateProfileArgs = {
  userData: UserDataInput;
};


export type MeMutationUpdateSsoProfileArgs = {
  userData: SsoUserDataInput;
};

export type MeteredBillingStatus = {
  __typename?: 'MeteredBillingStatus';
  EAS_BUILD: Scalars['Boolean'];
  EAS_UPDATE: Scalars['Boolean'];
};

export type Notification = {
  __typename?: 'Notification';
  accountName: Scalars['String'];
  createdAt: Scalars['DateTime'];
  event: NotificationEvent;
  id: Scalars['ID'];
  isRead: Scalars['Boolean'];
  metadata?: Maybe<NotificationMetadata>;
  type: NotificationType;
  updatedAt: Scalars['DateTime'];
  websiteMessage: Scalars['String'];
};

export enum NotificationEvent {
  BuildComplete = 'BUILD_COMPLETE',
  BuildErrored = 'BUILD_ERRORED',
  BuildLimitThresholdExceeded = 'BUILD_LIMIT_THRESHOLD_EXCEEDED',
  BuildPlanCreditThresholdExceeded = 'BUILD_PLAN_CREDIT_THRESHOLD_EXCEEDED',
  SubmissionComplete = 'SUBMISSION_COMPLETE',
  SubmissionErrored = 'SUBMISSION_ERRORED',
  Test = 'TEST'
}

export type NotificationMetadata = BuildLimitThresholdExceededMetadata | BuildPlanCreditThresholdExceededMetadata | TestNotificationMetadata;

export type NotificationSubscription = {
  __typename?: 'NotificationSubscription';
  account?: Maybe<Account>;
  actor?: Maybe<Actor>;
  app?: Maybe<App>;
  createdAt: Scalars['DateTime'];
  event: NotificationEvent;
  id: Scalars['ID'];
  type: NotificationType;
};

export type NotificationSubscriptionFilter = {
  accountId?: InputMaybe<Scalars['ID']>;
  appId?: InputMaybe<Scalars['ID']>;
  event?: InputMaybe<NotificationEvent>;
  type?: InputMaybe<NotificationType>;
};

export type NotificationSubscriptionMutation = {
  __typename?: 'NotificationSubscriptionMutation';
  subscribeToEventForAccount: SubscribeToNotificationResult;
  subscribeToEventForApp: SubscribeToNotificationResult;
  unsubscribe: UnsubscribeFromNotificationResult;
};


export type NotificationSubscriptionMutationSubscribeToEventForAccountArgs = {
  input: AccountNotificationSubscriptionInput;
};


export type NotificationSubscriptionMutationSubscribeToEventForAppArgs = {
  input: AppNotificationSubscriptionInput;
};


export type NotificationSubscriptionMutationUnsubscribeArgs = {
  id: Scalars['ID'];
};

export type NotificationThresholdExceeded = {
  __typename?: 'NotificationThresholdExceeded';
  count: Scalars['Int'];
  limit: Scalars['Int'];
  threshold: Scalars['Int'];
  type: BuildLimitThresholdExceededMetadataType;
};

export enum NotificationType {
  Email = 'EMAIL',
  Web = 'WEB'
}

export type NotificationsSentOverTimeData = {
  __typename?: 'NotificationsSentOverTimeData';
  data: LineChartData;
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

export enum OnboardingDeviceType {
  Device = 'DEVICE',
  Simulator = 'SIMULATOR'
}

export enum OnboardingEnvironment {
  DevBuild = 'DEV_BUILD',
  ExpoGo = 'EXPO_GO'
}

export enum Order {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['String']>;
};

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

export type PlanEnablement = Concurrencies | EasTotalPlanEnablement;

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
  gitRef?: InputMaybe<Scalars['String']>;
  metadataLocation?: InputMaybe<Scalars['String']>;
  repositoryUrl?: InputMaybe<Scalars['String']>;
  type: ProjectArchiveSourceType;
  url?: InputMaybe<Scalars['String']>;
};

export enum ProjectArchiveSourceType {
  Gcs = 'GCS',
  Git = 'GIT',
  None = 'NONE',
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
  /** @deprecated See byAccountNameAndSlug */
  byUsernameAndSlug: Project;
};


export type ProjectQueryByUsernameAndSlugArgs = {
  platform?: InputMaybe<Scalars['String']>;
  sdkVersions?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  slug: Scalars['String'];
  username: Scalars['String'];
};

export type PublicArtifacts = {
  __typename?: 'PublicArtifacts';
  applicationArchiveUrl?: Maybe<Scalars['String']>;
  buildUrl?: Maybe<Scalars['String']>;
};

export type PublishUpdateGroupInput = {
  awaitingCodeSigningInfo?: InputMaybe<Scalars['Boolean']>;
  branchId: Scalars['String'];
  excludedAssets?: InputMaybe<Array<PartialManifestAsset>>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  isGitWorkingTreeDirty?: InputMaybe<Scalars['Boolean']>;
  message?: InputMaybe<Scalars['String']>;
  rollBackToEmbeddedInfoGroup?: InputMaybe<UpdateRollBackToEmbeddedGroup>;
  rolloutInfoGroup?: InputMaybe<UpdateRolloutInfoGroup>;
  runtimeFingerprintSource?: InputMaybe<FingerprintSourceInput>;
  runtimeVersion: Scalars['String'];
  turtleJobRunId?: InputMaybe<Scalars['String']>;
  updateInfoGroup?: InputMaybe<UpdateInfoGroup>;
};

export enum RequestMethod {
  Delete = 'DELETE',
  Get = 'GET',
  Head = 'HEAD',
  Options = 'OPTIONS',
  Patch = 'PATCH',
  Post = 'POST',
  Put = 'PUT'
}

export type RequestsFilters = {
  cacheStatus?: InputMaybe<Array<ResponseCacheStatus>>;
  continent?: InputMaybe<Array<ContinentCode>>;
  hasCustomDomainOrigin?: InputMaybe<Scalars['Boolean']>;
  isAsset?: InputMaybe<Scalars['Boolean']>;
  isCrash?: InputMaybe<Scalars['Boolean']>;
  isVerifiedBot?: InputMaybe<Scalars['Boolean']>;
  method?: InputMaybe<Array<RequestMethod>>;
  os?: InputMaybe<Array<UserAgentOs>>;
  pathname?: InputMaybe<Scalars['String']>;
  responseType?: InputMaybe<Array<ResponseType>>;
  status?: InputMaybe<Array<Scalars['Int']>>;
  statusType?: InputMaybe<Array<ResponseStatusType>>;
};

export type RequestsOrderBy = {
  direction?: InputMaybe<RequestsOrderByDirection>;
  field: RequestsOrderByField;
};

export enum RequestsOrderByDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export enum RequestsOrderByField {
  AssetsSum = 'ASSETS_SUM',
  CacheHitRatio = 'CACHE_HIT_RATIO',
  CachePassRatio = 'CACHE_PASS_RATIO',
  CrashesSum = 'CRASHES_SUM',
  Duration = 'DURATION',
  RequestsSum = 'REQUESTS_SUM'
}

export type RescindUserInvitationResult = {
  __typename?: 'RescindUserInvitationResult';
  id: Scalars['ID'];
};

export enum ResourceClassExperiment {
  C3D = 'C3D',
  N2 = 'N2'
}

export enum ResponseCacheStatus {
  Hit = 'HIT',
  Miss = 'MISS',
  Pass = 'PASS'
}

export enum ResponseStatusType {
  ClientError = 'CLIENT_ERROR',
  None = 'NONE',
  Redirect = 'REDIRECT',
  ServerError = 'SERVER_ERROR',
  Successful = 'SUCCESSFUL'
}

export enum ResponseType {
  Asset = 'ASSET',
  Crash = 'CRASH',
  Rejected = 'REJECTED',
  Route = 'ROUTE'
}

/** Represents a robot (not human) actor. */
export type Robot = Actor & {
  __typename?: 'Robot';
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  /** Associated accounts */
  accounts: Array<Account>;
  created: Scalars['DateTime'];
  displayName: Scalars['String'];
  /** Experiments associated with this actor */
  experiments: Array<ActorExperiment>;
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isExpoAdmin: Scalars['Boolean'];
  lastDeletionAttemptTime?: Maybe<Scalars['DateTime']>;
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
  /** Schedule deletion of a Robot */
  scheduleRobotDeletion: BackgroundJobReceipt;
  /** Update a Robot */
  updateRobot: Robot;
};


export type RobotMutationCreateRobotForAccountArgs = {
  accountID: Scalars['String'];
  permissions: Array<InputMaybe<Permission>>;
  robotData?: InputMaybe<RobotDataInput>;
};


export type RobotMutationScheduleRobotDeletionArgs = {
  id: Scalars['ID'];
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
  /** Mutations that create, update, and delete an AccountSSOConfiguration */
  accountSSOConfiguration: AccountSsoConfigurationMutation;
  /** Mutations for Actor experiments */
  actorExperiment: ActorExperimentMutation;
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
  /** Mutations that modify an AppVersion */
  appVersion: AppVersionMutation;
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
  auditLog: AuditLogMutation;
  /** Mutations that modify an EAS Build */
  build: BuildMutation;
  /** Mutations that create, update, and delete Build Annotations */
  buildAnnotation: BuildAnnotationMutation;
  customDomain: CustomDomainMutation;
  deployments: DeploymentsMutation;
  /** Mutations that assign or modify DevDomainNames for apps */
  devDomainName: AppDevDomainNameMutation;
  /** Mutations for Discord users */
  discordUser: DiscordUserMutation;
  /** Mutations that modify an EmailSubscription */
  emailSubscription: EmailSubscriptionMutation;
  /** Mutations that create and delete EnvironmentSecrets */
  environmentSecret: EnvironmentSecretMutation;
  /** Mutations that create and delete EnvironmentVariables */
  environmentVariable: EnvironmentVariableMutation;
  /** Mutations that utilize services facilitated by the GitHub App */
  githubApp: GitHubAppMutation;
  /** Mutations for GitHub App installations */
  githubAppInstallation: GitHubAppInstallationMutation;
  /** Mutations for GitHub build triggers */
  githubBuildTrigger: GitHubBuildTriggerMutation;
  githubJobRunTrigger: GitHubJobRunTriggerMutation;
  /** Mutations for GitHub repositories */
  githubRepository: GitHubRepositoryMutation;
  /** Mutations for GitHub repository settings */
  githubRepositorySettings: GitHubRepositorySettingsMutation;
  /** Mutations for GitHub users */
  githubUser: GitHubUserMutation;
  /** Mutations that modify a Google Service Account Key */
  googleServiceAccountKey: GoogleServiceAccountKeyMutation;
  /** Mutations that modify the build credentials for an iOS app */
  iosAppBuildCredentials: IosAppBuildCredentialsMutation;
  /** Mutations that modify the credentials for an iOS app */
  iosAppCredentials: IosAppCredentialsMutation;
  /** Mutations that modify an EAS Build */
  jobRun: JobRunMutation;
  keystoreGenerationUrl: KeystoreGenerationUrlMutation;
  /** Mutations that modify the currently authenticated User */
  me: MeMutation;
  /** Mutations that modify a NotificationSubscription */
  notificationSubscription: NotificationSubscriptionMutation;
  /** Mutations that create, update, and delete Robots */
  robot: RobotMutation;
  serverlessFunction: ServerlessFunctionMutation;
  /** Mutations that modify an EAS Submit submission */
  submission: SubmissionMutation;
  update: UpdateMutation;
  updateBranch: UpdateBranchMutation;
  updateChannel: UpdateChannelMutation;
  uploadSession: UploadSession;
  /** Mutations that create, update, and delete pinned apps */
  userAppPins: UserAppPinMutation;
  userAuditLog: UserAuditLogMutation;
  /** Mutations that create, delete, and accept UserInvitations */
  userInvitation: UserInvitationMutation;
  /** Mutations that create, delete, update Webhooks */
  webhook: WebhookMutation;
  /** Mutations that modify a websiteNotification */
  websiteNotifications: WebsiteNotificationMutation;
  workflowJob: WorkflowJobMutation;
};


export type RootMutationAccountArgs = {
  accountName?: InputMaybe<Scalars['ID']>;
};


export type RootMutationAppArgs = {
  appId?: InputMaybe<Scalars['ID']>;
};


export type RootMutationBuildArgs = {
  buildId?: InputMaybe<Scalars['ID']>;
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
  /** Top-level query object for querying AccountSSOConfigurationPublicData */
  accountSSOConfigurationPublicData: AccountSsoConfigurationPublicDataQuery;
  /**
   * Top-level query object for querying Actors.
   * @deprecated Public actor queries are no longer supported
   */
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
  /** Top-level query object for querying App Store Connect API Keys. */
  appStoreConnectApiKey: AppStoreConnectApiKeyQuery;
  /** Top-level query object for querying Apple Device registration requests. */
  appleDeviceRegistrationRequest: AppleDeviceRegistrationRequestQuery;
  /** Top-level query object for querying Apple Teams. */
  appleTeam: AppleTeamQuery;
  asset: AssetQuery;
  /** Top-level query object for querying Account Audit Logs. */
  auditLogs: AuditLogQuery;
  backgroundJobReceipt: BackgroundJobReceiptQuery;
  /** Top-level query object for querying Branchs. */
  branches: BranchQuery;
  /** Top-level query object for querying annotations. */
  buildAnnotations: BuildAnnotationsQuery;
  /** Top-level query object for querying BuildPublicData publicly. */
  buildPublicData: BuildPublicDataQuery;
  builds: BuildQuery;
  /** Top-level query object for querying Channels. */
  channels: ChannelQuery;
  /** Top-level query object for querying Deployments. */
  deployments: DeploymentQuery;
  /** Top-level query object for querying Experimentation configuration. */
  experimentation: ExperimentationQuery;
  /** Top-level query object for querying GitHub App information and resources it has access to. */
  githubApp: GitHubAppQuery;
  /** Top-level query object for querying Google Service Account Keys. */
  googleServiceAccountKey: GoogleServiceAccountKeyQuery;
  /** Top-level query object for querying Stripe Invoices. */
  invoice: InvoiceQuery;
  jobRun: JobRunQuery;
  /**
   * If authenticated as a typical end user, this is the appropriate top-level
   * query object
   */
  me?: Maybe<User>;
  /**
   * If authenticated as any type of Actor, this is the appropriate top-level
   * query object
   */
  meActor?: Maybe<Actor>;
  /**
   * If authenticated as any type of human end user (Actor types User or SSOUser),
   * this is the appropriate top-level query object
   */
  meUserActor?: Maybe<UserActor>;
  /** @deprecated Snacks and apps should be queried separately */
  project: ProjectQuery;
  /** Top-level query object for querying Runtimes. */
  runtimes: RuntimeQuery;
  snack: SnackQuery;
  /** Top-level query object for querying Expo status page services. */
  statuspageService: StatuspageServiceQuery;
  submissions: SubmissionQuery;
  /** Top-level query object for querying Updates. */
  updates: UpdateQuery;
  /** fetch all updates in a group */
  updatesByGroup: Array<Update>;
  /**
   * Top-level query object for querying Users.
   * @deprecated Public user queries are no longer supported
   */
  user: UserQuery;
  /**
   * Top-level query object for querying UserActors.
   * @deprecated Public user queries are no longer supported
   */
  userActor: UserActorQuery;
  /** Top-level query object for querying UserActorPublicData publicly. */
  userActorPublicData: UserActorPublicDataQuery;
  /** Top-level query object for querying User Audit Logs. */
  userAuditLogs: UserAuditLogQuery;
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
  workerDeployment: WorkerDeploymentQuery;
  workflowJobs: WorkflowJobQuery;
  workflowRevisions: WorkflowRevisionQuery;
  workflowRuns: WorkflowRunQuery;
  workflows: WorkflowQuery;
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

export type Runtime = {
  __typename?: 'Runtime';
  app: App;
  builds: AppBuildsConnection;
  createdAt: Scalars['DateTime'];
  deployments: DeploymentsConnection;
  fingerprintDebugInfoUrl?: Maybe<Scalars['String']>;
  firstBuildCreatedAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  updatedAt: Scalars['DateTime'];
  updates: AppUpdatesConnection;
  version: Scalars['String'];
};


export type RuntimeBuildsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<RuntimeBuildsFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type RuntimeDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<RuntimeDeploymentsFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type RuntimeUpdatesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type RuntimeBuildsFilterInput = {
  channel?: InputMaybe<Scalars['String']>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  distributions?: InputMaybe<Array<DistributionType>>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  simulator?: InputMaybe<Scalars['Boolean']>;
};

export type RuntimeDeploymentsFilterInput = {
  channel?: InputMaybe<Scalars['String']>;
};

export type RuntimeEdge = {
  __typename?: 'RuntimeEdge';
  cursor: Scalars['String'];
  node: Runtime;
};

export type RuntimeFilterInput = {
  /** Only return runtimes shared with this branch */
  branchId?: InputMaybe<Scalars['String']>;
};

export type RuntimeQuery = {
  __typename?: 'RuntimeQuery';
  /** Query a Runtime by ID */
  byId: Runtime;
};


export type RuntimeQueryByIdArgs = {
  runtimeId: Scalars['ID'];
};

/** Represents the connection over the runtime edge of an App */
export type RuntimesConnection = {
  __typename?: 'RuntimesConnection';
  edges: Array<RuntimeEdge>;
  pageInfo: PageInfo;
};

/** Represents a human SSO (not robot) actor. */
export type SsoUser = Actor & UserActor & {
  __typename?: 'SSOUser';
  /** Access Tokens belonging to this actor, none at present */
  accessTokens: Array<AccessToken>;
  accounts: Array<Account>;
  /** Coalesced project activity for all apps belonging to all accounts this user belongs to. Only resolves for the viewer. */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  appCount: Scalars['Int'];
  /** @deprecated No longer supported */
  appetizeCode?: Maybe<Scalars['String']>;
  /** Apps this user has published. If this user is the viewer, this field returns the apps the user has access to. */
  apps: Array<App>;
  bestContactEmail?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  /** Discord account linked to a user */
  discordUser?: Maybe<DiscordUser>;
  displayName: Scalars['String'];
  /** Experiments associated with this actor */
  experiments: Array<ActorExperiment>;
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  /** GitHub account linked to a user */
  githubUser?: Maybe<GitHubUser>;
  /** @deprecated No longer supported */
  githubUsername?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** @deprecated No longer supported */
  industry?: Maybe<Scalars['String']>;
  isExpoAdmin: Scalars['Boolean'];
  lastDeletionAttemptTime?: Maybe<Scalars['DateTime']>;
  lastName?: Maybe<Scalars['String']>;
  /** @deprecated No longer supported */
  location?: Maybe<Scalars['String']>;
  notificationSubscriptions: Array<NotificationSubscription>;
  pinnedApps: Array<App>;
  preferences: UserPreferences;
  /** Associated accounts */
  primaryAccount: Account;
  profilePhoto: Scalars['String'];
  /** Snacks associated with this account */
  snacks: Array<Snack>;
  /** @deprecated No longer supported */
  twitterUsername?: Maybe<Scalars['String']>;
  username: Scalars['String'];
  websiteNotificationsPaginated: WebsiteNotificationsConnection;
};


/** Represents a human SSO (not robot) actor. */
export type SsoUserActivityTimelineProjectActivitiesArgs = {
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  filterTypes?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/** Represents a human SSO (not robot) actor. */
export type SsoUserAppsArgs = {
  includeUnpublished?: InputMaybe<Scalars['Boolean']>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents a human SSO (not robot) actor. */
export type SsoUserFeatureGatesArgs = {
  filter?: InputMaybe<Array<Scalars['String']>>;
};


/** Represents a human SSO (not robot) actor. */
export type SsoUserNotificationSubscriptionsArgs = {
  filter?: InputMaybe<NotificationSubscriptionFilter>;
};


/** Represents a human SSO (not robot) actor. */
export type SsoUserSnacksArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents a human SSO (not robot) actor. */
export type SsoUserWebsiteNotificationsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type SsoUserDataInput = {
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
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

export type ServerlessFunctionIdentifierInput = {
  gitCommitSHA1: Scalars['String'];
};

export type ServerlessFunctionMutation = {
  __typename?: 'ServerlessFunctionMutation';
  createDeployment: DeployServerlessFunctionResult;
  createUploadPresignedUrl: CreateServerlessFunctionUploadUrlResult;
};


export type ServerlessFunctionMutationCreateDeploymentArgs = {
  appId: Scalars['ID'];
  serverlessFunctionIdentifierInput: ServerlessFunctionIdentifierInput;
};


export type ServerlessFunctionMutationCreateUploadPresignedUrlArgs = {
  appId: Scalars['ID'];
  serverlessFunctionIdentifierInput: ServerlessFunctionIdentifierInput;
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
  /** SDK version of the snack */
  sdkVersion: Scalars['String'];
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

/** Incident for a given component from Expo status page API. */
export type StatuspageIncident = {
  __typename?: 'StatuspageIncident';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  /** Impact of an incident from Expo status page. */
  impact: StatuspageIncidentImpact;
  name: Scalars['String'];
  resolvedAt?: Maybe<Scalars['DateTime']>;
  /** Shortlink to the incident from Expo status page. */
  shortlink: Scalars['String'];
  /** Current status of an incident from Expo status page. */
  status: StatuspageIncidentStatus;
  updatedAt: Scalars['DateTime'];
  /** List of all updates for an incident from Expo status page. */
  updates: Array<StatuspageIncidentUpdate>;
};

/** Possible Incident impact values from Expo status page API. */
export enum StatuspageIncidentImpact {
  Critical = 'CRITICAL',
  Maintenance = 'MAINTENANCE',
  Major = 'MAJOR',
  Minor = 'MINOR',
  None = 'NONE'
}

/** Possible Incident statuses from Expo status page API. */
export enum StatuspageIncidentStatus {
  Completed = 'COMPLETED',
  Identified = 'IDENTIFIED',
  Investigating = 'INVESTIGATING',
  InProgress = 'IN_PROGRESS',
  Monitoring = 'MONITORING',
  Resolved = 'RESOLVED',
  Scheduled = 'SCHEDULED',
  Verifying = 'VERIFYING'
}

/** Update for an Incident from Expo status page API. */
export type StatuspageIncidentUpdate = {
  __typename?: 'StatuspageIncidentUpdate';
  /** Text of an update from Expo status page. */
  body: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  /** Status set at the moment of update. */
  status: StatuspageIncidentStatus;
};

/** Service monitored by Expo status page. */
export type StatuspageService = {
  __typename?: 'StatuspageService';
  /** Description of a service from Expo status page. */
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /**
   * List of last inicdents for a service from Expo status page (we always query for 50 latest incidents for all services)
   * sorted by createdAt field in descending order.
   */
  incidents: Array<StatuspageIncident>;
  /** Name of a service monitored by Expo status page. */
  name: StatuspageServiceName;
  /** Current status of a service from Expo status page. */
  status: StatuspageServiceStatus;
};

/** Name of a service monitored by Expo status page. */
export enum StatuspageServiceName {
  EasBuild = 'EAS_BUILD',
  EasSubmit = 'EAS_SUBMIT',
  EasUpdate = 'EAS_UPDATE',
  GithubApiRequests = 'GITHUB_API_REQUESTS',
  GithubWebhooks = 'GITHUB_WEBHOOKS'
}

export type StatuspageServiceQuery = {
  __typename?: 'StatuspageServiceQuery';
  /** Query services from Expo status page by names. */
  byServiceNames: Array<StatuspageService>;
};


export type StatuspageServiceQueryByServiceNamesArgs = {
  serviceNames: Array<StatuspageServiceName>;
};

/** Possible statuses for a service. */
export enum StatuspageServiceStatus {
  DegradedPerformance = 'DEGRADED_PERFORMANCE',
  MajorOutage = 'MAJOR_OUTAGE',
  Operational = 'OPERATIONAL',
  PartialOutage = 'PARTIAL_OUTAGE',
  UnderMaintenance = 'UNDER_MAINTENANCE'
}

export type StripeCoupon = {
  __typename?: 'StripeCoupon';
  amountOff?: Maybe<Scalars['String']>;
  appliesTo?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  percentOff?: Maybe<Scalars['Float']>;
  valid: Scalars['Boolean'];
};

export type StripePrice = {
  __typename?: 'StripePrice';
  id: Scalars['ID'];
};

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
  childSubmission?: Maybe<Submission>;
  completedAt?: Maybe<Scalars['DateTime']>;
  createdAt: Scalars['DateTime'];
  error?: Maybe<SubmissionError>;
  id: Scalars['ID'];
  initiatingActor?: Maybe<Actor>;
  iosConfig?: Maybe<IosSubmissionConfig>;
  logFiles: Array<Scalars['String']>;
  /** @deprecated Use logFiles instead */
  logsUrl?: Maybe<Scalars['String']>;
  /** Retry time starts after completedAt */
  maxRetryTimeMinutes: Scalars['Int'];
  parentSubmission?: Maybe<Submission>;
  platform: AppPlatform;
  priority?: Maybe<SubmissionPriority>;
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

export type SubmissionArchiveSourceInput = {
  /** Required if the archive source type is GCS_BUILD_APPLICATION_ARCHIVE or GCS_SUBMIT_ARCHIVE */
  bucketKey?: InputMaybe<Scalars['String']>;
  type: SubmissionArchiveSourceType;
  /** Required if the archive source type is URL */
  url?: InputMaybe<Scalars['String']>;
};

export enum SubmissionArchiveSourceType {
  GcsBuildApplicationArchive = 'GCS_BUILD_APPLICATION_ARCHIVE',
  GcsSubmitArchive = 'GCS_SUBMIT_ARCHIVE',
  Url = 'URL'
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

export enum SubmissionPriority {
  High = 'HIGH',
  Normal = 'NORMAL'
}

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

export type SubscribeToNotificationResult = {
  __typename?: 'SubscribeToNotificationResult';
  notificationSubscription: NotificationSubscription;
};

export type SubscriptionDetails = {
  __typename?: 'SubscriptionDetails';
  addons: Array<AddonDetails>;
  cancelAt?: Maybe<Scalars['DateTime']>;
  concurrencies?: Maybe<Concurrencies>;
  coupon?: Maybe<StripeCoupon>;
  endedAt?: Maybe<Scalars['DateTime']>;
  futureSubscription?: Maybe<FutureSubscription>;
  id: Scalars['ID'];
  isDowngrading?: Maybe<Scalars['Boolean']>;
  meteredBillingStatus: MeteredBillingStatus;
  name?: Maybe<Scalars['String']>;
  nextInvoice?: Maybe<Scalars['DateTime']>;
  nextInvoiceAmountDueCents?: Maybe<Scalars['Int']>;
  planEnablement?: Maybe<PlanEnablement>;
  planId?: Maybe<Scalars['String']>;
  price: Scalars['Int'];
  recurringCents?: Maybe<Scalars['Int']>;
  status?: Maybe<Scalars['String']>;
  trialEnd?: Maybe<Scalars['DateTime']>;
  upcomingInvoice?: Maybe<Invoice>;
  willCancel?: Maybe<Scalars['Boolean']>;
};


export type SubscriptionDetailsPlanEnablementArgs = {
  serviceMetric: EasServiceMetric;
};

export enum TargetEntityMutationType {
  Create = 'CREATE',
  Delete = 'DELETE',
  Update = 'UPDATE'
}

export type TestNotificationMetadata = {
  __typename?: 'TestNotificationMetadata';
  message: Scalars['String'];
};

export type TimelineActivityConnection = {
  __typename?: 'TimelineActivityConnection';
  edges: Array<TimelineActivityEdge>;
  pageInfo: PageInfo;
};

export type TimelineActivityEdge = {
  __typename?: 'TimelineActivityEdge';
  cursor: Scalars['String'];
  node: ActivityTimelineProjectActivity;
};

export type TimelineActivityFilterInput = {
  channels?: InputMaybe<Array<Scalars['String']>>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannels?: InputMaybe<Array<Scalars['String']>>;
  types?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
};

export type UniqueUsersOverTimeData = {
  __typename?: 'UniqueUsersOverTimeData';
  data: LineChartData;
};

export type UnsubscribeFromNotificationResult = {
  __typename?: 'UnsubscribeFromNotificationResult';
  notificationSubscription: NotificationSubscription;
};

export type Update = ActivityTimelineProjectActivity & {
  __typename?: 'Update';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  app: App;
  awaitingCodeSigningInfo: Scalars['Boolean'];
  branch: UpdateBranch;
  branchId: Scalars['ID'];
  codeSigningInfo?: Maybe<CodeSigningInfo>;
  createdAt: Scalars['DateTime'];
  deployments: DeploymentResult;
  expoGoSDKVersion?: Maybe<Scalars['String']>;
  gitCommitHash?: Maybe<Scalars['String']>;
  group: Scalars['String'];
  id: Scalars['ID'];
  /** Update query field */
  insights: UpdateInsights;
  isGitWorkingTreeDirty: Scalars['Boolean'];
  isRollBackToEmbedded: Scalars['Boolean'];
  jobRun?: Maybe<JobRun>;
  manifestFragment: Scalars['String'];
  manifestPermalink: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  platform: Scalars['String'];
  rolloutControlUpdate?: Maybe<Update>;
  rolloutPercentage?: Maybe<Scalars['Int']>;
  runtime: Runtime;
  /** @deprecated Use 'runtime' field . */
  runtimeVersion: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};


export type UpdateDeploymentsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type UpdateBranch = {
  __typename?: 'UpdateBranch';
  app: App;
  appId: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  latestActivity: Scalars['DateTime'];
  name: Scalars['String'];
  runtimes: RuntimesConnection;
  updateGroups: Array<Array<Update>>;
  updatedAt: Scalars['DateTime'];
  updates: Array<Update>;
};


export type UpdateBranchRuntimesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<RuntimeFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type UpdateBranchUpdateGroupsArgs = {
  filter?: InputMaybe<UpdatesFilter>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
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
  app: App;
  appId: Scalars['ID'];
  branchMapping: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  isPaused: Scalars['Boolean'];
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
  /** Pause updates for an EAS channel. */
  pauseUpdateChannel: UpdateChannel;
  /** Resume updates for an EAS channel. */
  resumeUpdateChannel: UpdateChannel;
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


export type UpdateChannelMutationPauseUpdateChannelArgs = {
  channelId: Scalars['ID'];
};


export type UpdateChannelMutationResumeUpdateChannelArgs = {
  channelId: Scalars['ID'];
};

export type UpdateDeploymentEdge = {
  __typename?: 'UpdateDeploymentEdge';
  cursor: Scalars['String'];
  node: Deployment;
};

export type UpdateDeploymentsConnection = {
  __typename?: 'UpdateDeploymentsConnection';
  edges: Array<UpdateDeploymentEdge>;
  pageInfo: PageInfo;
};

export type UpdateEnvironmentVariableInput = {
  environments?: InputMaybe<Array<EnvironmentVariableEnvironment>>;
  fileName?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  isGlobal?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<EnvironmentSecretType>;
  value?: InputMaybe<Scalars['String']>;
  visibility?: InputMaybe<EnvironmentVariableVisibility>;
};

export type UpdateGitHubBuildTriggerInput = {
  autoSubmit: Scalars['Boolean'];
  buildProfile: Scalars['String'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  executionBehavior: GitHubBuildTriggerExecutionBehavior;
  isActive: Scalars['Boolean'];
  platform: AppPlatform;
  sourcePattern: Scalars['String'];
  submitProfile?: InputMaybe<Scalars['String']>;
  targetPattern?: InputMaybe<Scalars['String']>;
  type: GitHubBuildTriggerType;
};

export type UpdateGitHubJobRunTriggerInput = {
  isActive: Scalars['Boolean'];
  sourcePattern: Scalars['String'];
  targetPattern?: InputMaybe<Scalars['String']>;
};

export type UpdateGitHubRepositorySettingsInput = {
  baseDirectory: Scalars['String'];
};

export type UpdateInfoGroup = {
  android?: InputMaybe<PartialManifest>;
  ios?: InputMaybe<PartialManifest>;
  web?: InputMaybe<PartialManifest>;
};

export type UpdateInsights = {
  __typename?: 'UpdateInsights';
  cumulativeMetrics: CumulativeMetrics;
  id: Scalars['ID'];
  totalUniqueUsers: Scalars['Int'];
};


export type UpdateInsightsCumulativeMetricsArgs = {
  timespan: InsightsTimespan;
};


export type UpdateInsightsTotalUniqueUsersArgs = {
  timespan: InsightsTimespan;
};

export type UpdateMutation = {
  __typename?: 'UpdateMutation';
  /** Delete an EAS update group */
  deleteUpdateGroup: DeleteUpdateGroupResult;
  /** Set code signing info for an update */
  setCodeSigningInfo: Update;
  /** Set rollout percentage for an update */
  setRolloutPercentage: Update;
};


export type UpdateMutationDeleteUpdateGroupArgs = {
  group: Scalars['ID'];
};


export type UpdateMutationSetCodeSigningInfoArgs = {
  codeSigningInfo: CodeSigningInfoInput;
  updateId: Scalars['ID'];
};


export type UpdateMutationSetRolloutPercentageArgs = {
  percentage: Scalars['Int'];
  updateId: Scalars['ID'];
};

export type UpdateQuery = {
  __typename?: 'UpdateQuery';
  /** Query an Update by ID */
  byId: Update;
};


export type UpdateQueryByIdArgs = {
  updateId: Scalars['ID'];
};

export type UpdateRollBackToEmbeddedGroup = {
  android?: InputMaybe<Scalars['Boolean']>;
  ios?: InputMaybe<Scalars['Boolean']>;
  web?: InputMaybe<Scalars['Boolean']>;
};

export type UpdateRolloutInfo = {
  rolloutControlUpdateId: Scalars['ID'];
  rolloutPercentage: Scalars['Int'];
};

export type UpdateRolloutInfoGroup = {
  android?: InputMaybe<UpdateRolloutInfo>;
  ios?: InputMaybe<UpdateRolloutInfo>;
  web?: InputMaybe<UpdateRolloutInfo>;
};

export type UpdatesFilter = {
  platform?: InputMaybe<AppPlatform>;
  runtimeVersions?: InputMaybe<Array<Scalars['String']>>;
  sdkVersions?: InputMaybe<Array<Scalars['String']>>;
};

export type UpdatesMetricsData = {
  __typename?: 'UpdatesMetricsData';
  failedInstallsDataset: CumulativeUpdatesDataset;
  installsDataset: CumulativeUpdatesDataset;
  labels: Array<Scalars['String']>;
};

export type UploadSession = {
  __typename?: 'UploadSession';
  /** Create an Upload Session for a specific account */
  createAccountScopedUploadSession: Scalars['JSONObject'];
  /** Create an Upload Session */
  createUploadSession: Scalars['JSONObject'];
};


export type UploadSessionCreateAccountScopedUploadSessionArgs = {
  accountID: Scalars['ID'];
  type: AccountUploadSessionType;
};


export type UploadSessionCreateUploadSessionArgs = {
  type: UploadSessionType;
};

export enum UploadSessionType {
  EasBuildGcsProjectMetadata = 'EAS_BUILD_GCS_PROJECT_METADATA',
  EasBuildGcsProjectSources = 'EAS_BUILD_GCS_PROJECT_SOURCES',
  /** @deprecated Use EAS_BUILD_GCS_PROJECT_SOURCES instead. */
  EasBuildProjectSources = 'EAS_BUILD_PROJECT_SOURCES',
  /** @deprecated Use EAS_SUBMIT_GCS_APP_ARCHIVE instead. */
  EasSubmitAppArchive = 'EAS_SUBMIT_APP_ARCHIVE',
  EasSubmitGcsAppArchive = 'EAS_SUBMIT_GCS_APP_ARCHIVE',
  EasUpdateFingerprint = 'EAS_UPDATE_FINGERPRINT'
}

export type UsageMetricTotal = {
  __typename?: 'UsageMetricTotal';
  billingPeriod: BillingPeriod;
  id: Scalars['ID'];
  overageMetrics: Array<EstimatedOverageAndCost>;
  planMetrics: Array<EstimatedUsage>;
  /** Total cost of overages, in cents */
  totalCost: Scalars['Float'];
};

export enum UsageMetricType {
  Bandwidth = 'BANDWIDTH',
  Build = 'BUILD',
  Minute = 'MINUTE',
  Request = 'REQUEST',
  Update = 'UPDATE',
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
export type User = Actor & UserActor & {
  __typename?: 'User';
  /** Access Tokens belonging to this actor */
  accessTokens: Array<AccessToken>;
  accounts: Array<Account>;
  /** Coalesced project activity for all apps belonging to all accounts this user belongs to. Only resolves for the viewer. */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  appCount: Scalars['Int'];
  /** @deprecated No longer supported */
  appetizeCode?: Maybe<Scalars['String']>;
  /** Apps this user has published */
  apps: Array<App>;
  bestContactEmail?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  /** Discord account linked to a user */
  discordUser?: Maybe<DiscordUser>;
  displayName: Scalars['String'];
  email: Scalars['String'];
  emailVerified: Scalars['Boolean'];
  /** Experiments associated with this actor */
  experiments: Array<ActorExperiment>;
  /**
   * Server feature gate values for this actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  /** GitHub account linked to a user */
  githubUser?: Maybe<GitHubUser>;
  /** @deprecated No longer supported */
  githubUsername?: Maybe<Scalars['String']>;
  /** Whether this user has any pending user invitations. Only resolves for the viewer. */
  hasPendingUserInvitations: Scalars['Boolean'];
  id: Scalars['ID'];
  /** @deprecated No longer supported */
  industry?: Maybe<Scalars['String']>;
  isExpoAdmin: Scalars['Boolean'];
  /** @deprecated No longer supported */
  isLegacy: Scalars['Boolean'];
  isSecondFactorAuthenticationEnabled: Scalars['Boolean'];
  lastDeletionAttemptTime?: Maybe<Scalars['DateTime']>;
  lastName?: Maybe<Scalars['String']>;
  /** @deprecated No longer supported */
  location?: Maybe<Scalars['String']>;
  notificationSubscriptions: Array<NotificationSubscription>;
  /** Pending UserInvitations for this user. Only resolves for the viewer. */
  pendingUserInvitations: Array<UserInvitation>;
  pinnedApps: Array<App>;
  preferences: UserPreferences;
  /** Associated accounts */
  primaryAccount: Account;
  profilePhoto: Scalars['String'];
  /** Get all certified second factor authentication methods */
  secondFactorDevices: Array<UserSecondFactorDevice>;
  /** Snacks associated with this account */
  snacks: Array<Snack>;
  /** @deprecated No longer supported */
  twitterUsername?: Maybe<Scalars['String']>;
  username: Scalars['String'];
  websiteNotificationsPaginated: WebsiteNotificationsConnection;
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
export type UserNotificationSubscriptionsArgs = {
  filter?: InputMaybe<NotificationSubscriptionFilter>;
};


/** Represents a human (not robot) actor. */
export type UserSnacksArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** Represents a human (not robot) actor. */
export type UserWebsiteNotificationsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActor = {
  /** Access Tokens belonging to this user actor */
  accessTokens: Array<AccessToken>;
  accounts: Array<Account>;
  /**
   * Coalesced project activity for all apps belonging to all accounts this user actor belongs to.
   * Only resolves for the viewer.
   */
  activityTimelineProjectActivities: Array<ActivityTimelineProjectActivity>;
  appCount: Scalars['Int'];
  /** @deprecated No longer supported */
  appetizeCode?: Maybe<Scalars['String']>;
  /** Apps this user has published */
  apps: Array<App>;
  bestContactEmail?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  /** Discord account linked to a user */
  discordUser?: Maybe<DiscordUser>;
  /**
   * Best-effort human readable name for this human actor for use in user interfaces during action attribution.
   * For example, when displaying a sentence indicating that actor X created a build or published an update.
   */
  displayName: Scalars['String'];
  /** Experiments associated with this actor */
  experiments: Array<ActorExperiment>;
  /**
   * Server feature gate values for this user actor, optionally filtering by desired gates.
   * Only resolves for the viewer.
   */
  featureGates: Scalars['JSONObject'];
  firstName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  /** GitHub account linked to a user */
  githubUser?: Maybe<GitHubUser>;
  /** @deprecated No longer supported */
  githubUsername?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  /** @deprecated No longer supported */
  industry?: Maybe<Scalars['String']>;
  isExpoAdmin: Scalars['Boolean'];
  lastDeletionAttemptTime?: Maybe<Scalars['DateTime']>;
  lastName?: Maybe<Scalars['String']>;
  /** @deprecated No longer supported */
  location?: Maybe<Scalars['String']>;
  notificationSubscriptions: Array<NotificationSubscription>;
  pinnedApps: Array<App>;
  preferences: UserPreferences;
  /** Associated accounts */
  primaryAccount: Account;
  profilePhoto: Scalars['String'];
  /** Snacks associated with this user's personal account */
  snacks: Array<Snack>;
  /** @deprecated No longer supported */
  twitterUsername?: Maybe<Scalars['String']>;
  username: Scalars['String'];
  websiteNotificationsPaginated: WebsiteNotificationsConnection;
};


/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorActivityTimelineProjectActivitiesArgs = {
  createdBefore?: InputMaybe<Scalars['DateTime']>;
  filterTypes?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
  limit: Scalars['Int'];
};


/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorAppsArgs = {
  includeUnpublished?: InputMaybe<Scalars['Boolean']>;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorFeatureGatesArgs = {
  filter?: InputMaybe<Array<Scalars['String']>>;
};


/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorNotificationSubscriptionsArgs = {
  filter?: InputMaybe<NotificationSubscriptionFilter>;
};


/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorSnacksArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};


/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorWebsiteNotificationsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorPublicData = {
  __typename?: 'UserActorPublicData';
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lastName?: Maybe<Scalars['String']>;
  profilePhoto: Scalars['String'];
  /** Snacks associated with this user's personal account */
  snacks: Array<Snack>;
  username: Scalars['String'];
};


/** A human user (type User or SSOUser) that can login to the Expo website, use Expo services, and be a member of accounts. */
export type UserActorPublicDataSnacksArgs = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type UserActorPublicDataQuery = {
  __typename?: 'UserActorPublicDataQuery';
  /** Get UserActorPublicData by username */
  byUsername: UserActorPublicData;
};


export type UserActorPublicDataQueryByUsernameArgs = {
  username: Scalars['String'];
};

export type UserActorQuery = {
  __typename?: 'UserActorQuery';
  /**
   * Query a UserActor by ID
   * @deprecated Public user actor queries are no longer supported
   */
  byId: UserActor;
  /**
   * Query a UserActor by username
   * @deprecated Public user actor queries are no longer supported
   */
  byUsername: UserActor;
};


export type UserActorQueryByIdArgs = {
  id: Scalars['ID'];
};


export type UserActorQueryByUsernameArgs = {
  username: Scalars['String'];
};

export enum UserAgentBrowser {
  AndroidMobile = 'ANDROID_MOBILE',
  Chrome = 'CHROME',
  ChromeIos = 'CHROME_IOS',
  Edge = 'EDGE',
  FacebookMobile = 'FACEBOOK_MOBILE',
  Firefox = 'FIREFOX',
  FirefoxIos = 'FIREFOX_IOS',
  InternetExplorer = 'INTERNET_EXPLORER',
  Konqueror = 'KONQUEROR',
  Mozilla = 'MOZILLA',
  Opera = 'OPERA',
  Safari = 'SAFARI',
  SafariMobile = 'SAFARI_MOBILE',
  SamsungInternet = 'SAMSUNG_INTERNET',
  UcBrowser = 'UC_BROWSER'
}

export enum UserAgentOs {
  Android = 'ANDROID',
  ChromeOs = 'CHROME_OS',
  Ios = 'IOS',
  IpadOs = 'IPAD_OS',
  Linux = 'LINUX',
  MacOs = 'MAC_OS',
  Windows = 'WINDOWS'
}

export type UserAppPinMutation = {
  __typename?: 'UserAppPinMutation';
  pinApp: Scalars['ID'];
  unpinApp?: Maybe<Scalars['ID']>;
};


export type UserAppPinMutationPinAppArgs = {
  appId: Scalars['ID'];
};


export type UserAppPinMutationUnpinAppArgs = {
  appId: Scalars['ID'];
};

export type UserAuditLog = {
  __typename?: 'UserAuditLog';
  actor: Actor;
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  ip?: Maybe<Scalars['String']>;
  metadata?: Maybe<Scalars['JSONObject']>;
  targetEntityId: Scalars['ID'];
  targetEntityMutationType: TargetEntityMutationType;
  targetEntityTypeName: UserEntityTypeName;
  targetEntityTypePublicName: Scalars['String'];
  user: User;
  websiteMessage: Scalars['String'];
};

export type UserAuditLogConnection = {
  __typename?: 'UserAuditLogConnection';
  edges: Array<UserAuditLogEdge>;
  pageInfo: PageInfo;
};

export type UserAuditLogEdge = {
  __typename?: 'UserAuditLogEdge';
  cursor: Scalars['String'];
  node: UserAuditLog;
};

export type UserAuditLogExportInput = {
  createdAfter: Scalars['String'];
  createdBefore: Scalars['String'];
  format: AuditLogsExportFormat;
  targetEntityMutationType?: InputMaybe<Array<TargetEntityMutationType>>;
  targetEntityTypeName?: InputMaybe<Array<UserEntityTypeName>>;
  userId: Scalars['ID'];
};

export type UserAuditLogFilterInput = {
  entityTypes?: InputMaybe<Array<UserEntityTypeName>>;
  mutationTypes?: InputMaybe<Array<TargetEntityMutationType>>;
};

export type UserAuditLogMutation = {
  __typename?: 'UserAuditLogMutation';
  /** Exports User Audit Logs for an user. Returns the ID of the background job receipt. Use BackgroundJobReceiptQuery to get the status of the job. */
  exportUserAuditLogs: BackgroundJobReceipt;
};


export type UserAuditLogMutationExportUserAuditLogsArgs = {
  exportInput: UserAuditLogExportInput;
};

export type UserAuditLogQuery = {
  __typename?: 'UserAuditLogQuery';
  /** Audit logs for user */
  byId: UserAuditLog;
  byUserIdPaginated: UserAuditLogConnection;
  typeNamesMap: Array<UserLogNameTypeMapping>;
};


export type UserAuditLogQueryByIdArgs = {
  auditLogId: Scalars['ID'];
};


export type UserAuditLogQueryByUserIdPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<UserAuditLogFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  userId: Scalars['ID'];
};

export type UserDataInput = {
  email?: InputMaybe<Scalars['String']>;
  firstName?: InputMaybe<Scalars['String']>;
  fullName?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  lastName?: InputMaybe<Scalars['String']>;
  profilePhoto?: InputMaybe<Scalars['String']>;
  username?: InputMaybe<Scalars['String']>;
};

export enum UserEntityTypeName {
  AccessTokenEntity = 'AccessTokenEntity',
  DiscordUserEntity = 'DiscordUserEntity',
  GitHubUserEntity = 'GitHubUserEntity',
  PasswordEntity = 'PasswordEntity',
  SsoUserEntity = 'SSOUserEntity',
  UserEntity = 'UserEntity',
  UserPermissionEntity = 'UserPermissionEntity',
  UserSecondFactorBackupCodesEntity = 'UserSecondFactorBackupCodesEntity',
  UserSecondFactorDeviceEntity = 'UserSecondFactorDeviceEntity'
}

/** An pending invitation sent to an email granting membership on an Account. */
export type UserInvitation = {
  __typename?: 'UserInvitation';
  accountName: Scalars['String'];
  /** If the invite is for a personal team, the profile photo of account owner */
  accountProfilePhoto?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  /** Email to which this invitation was sent */
  email: Scalars['String'];
  expires: Scalars['DateTime'];
  id: Scalars['ID'];
  /** If the invite is for an organization or a personal team */
  isForOrganization: Scalars['Boolean'];
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
  accountProfilePhoto?: Maybe<Scalars['String']>;
  created: Scalars['DateTime'];
  email: Scalars['String'];
  expires: Scalars['DateTime'];
  /** Email to which this invitation was sent */
  id: Scalars['ID'];
  isForOrganization: Scalars['Boolean'];
};

export type UserInvitationPublicDataQuery = {
  __typename?: 'UserInvitationPublicDataQuery';
  /** Get UserInvitationPublicData by token */
  byToken: UserInvitationPublicData;
};


export type UserInvitationPublicDataQueryByTokenArgs = {
  token: Scalars['ID'];
};

export type UserLogNameTypeMapping = {
  __typename?: 'UserLogNameTypeMapping';
  publicName: Scalars['String'];
  typeName: UserEntityTypeName;
};

export type UserPermission = {
  __typename?: 'UserPermission';
  actor: Actor;
  permissions: Array<Permission>;
  role: Role;
  /** @deprecated User type is deprecated */
  user?: Maybe<User>;
  userActor?: Maybe<UserActor>;
};

export type UserPreferences = {
  __typename?: 'UserPreferences';
  onboarding?: Maybe<UserPreferencesOnboarding>;
  selectedAccountName?: Maybe<Scalars['String']>;
};

export type UserPreferencesInput = {
  onboarding?: InputMaybe<UserPreferencesOnboardingInput>;
  selectedAccountName?: InputMaybe<Scalars['String']>;
};

/**
 * Set by website. Used by CLI to continue onboarding process on user's machine - clone repository,
 * install dependencies etc.
 */
export type UserPreferencesOnboarding = {
  __typename?: 'UserPreferencesOnboarding';
  appId: Scalars['ID'];
  /** Can be null if the user has not selected one yet. */
  deviceType?: Maybe<OnboardingDeviceType>;
  /** Can be null if the user has not selected one yet. */
  environment?: Maybe<OnboardingEnvironment>;
  /**
   * Set by CLI when the user has completed that phase. Used by the website to determine when
   * the next step can be shown.
   */
  isCLIDone?: Maybe<Scalars['Boolean']>;
  /** The last time when this object was updated. */
  lastUsed: Scalars['String'];
  /** User selects a platform for which they want to build the app. CLI uses this information to start the build. */
  platform?: Maybe<AppPlatform>;
};

export type UserPreferencesOnboardingInput = {
  appId: Scalars['ID'];
  deviceType?: InputMaybe<OnboardingDeviceType>;
  environment?: InputMaybe<OnboardingEnvironment>;
  isCLIDone?: InputMaybe<Scalars['Boolean']>;
  lastUsed: Scalars['String'];
  platform?: InputMaybe<AppPlatform>;
};

export type UserQuery = {
  __typename?: 'UserQuery';
  /**
   * Query a User by ID
   * @deprecated Public user queries are no longer supported
   */
  byId: User;
  /**
   * Query a User by username
   * @deprecated Public user queries are no longer supported
   */
  byUsername: User;
};


export type UserQueryByIdArgs = {
  userId: Scalars['ID'];
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

export type WebNotificationUpdateReadStateInput = {
  id: Scalars['ID'];
  isRead: Scalars['Boolean'];
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

export type WebsiteNotificationEdge = {
  __typename?: 'WebsiteNotificationEdge';
  cursor: Scalars['String'];
  node: Notification;
};

export type WebsiteNotificationMutation = {
  __typename?: 'WebsiteNotificationMutation';
  updateAllWebsiteNotificationReadStateAsRead: Scalars['Boolean'];
  updateNotificationReadState: Notification;
};


export type WebsiteNotificationMutationUpdateNotificationReadStateArgs = {
  input: WebNotificationUpdateReadStateInput;
};

export type WebsiteNotificationsConnection = {
  __typename?: 'WebsiteNotificationsConnection';
  edges: Array<WebsiteNotificationEdge>;
  pageInfo: PageInfo;
};

export type WorkerCustomDomain = {
  __typename?: 'WorkerCustomDomain';
  alias: WorkerDeploymentAlias;
  createdAt: Scalars['DateTime'];
  dcvDelegationRecord?: Maybe<CustomDomainDnsRecord>;
  devDomainName: Scalars['DevDomainName'];
  dnsRecord: CustomDomainDnsRecord;
  hostname: Scalars['String'];
  id: Scalars['ID'];
  setup?: Maybe<CustomDomainSetup>;
  updatedAt: Scalars['DateTime'];
  verificationRecord?: Maybe<CustomDomainDnsRecord>;
};

export type WorkerDeployment = ActivityTimelineProjectActivity & {
  __typename?: 'WorkerDeployment';
  activityTimestamp: Scalars['DateTime'];
  actor?: Maybe<Actor>;
  aliases?: Maybe<Array<WorkerDeploymentAlias>>;
  crashes?: Maybe<WorkerDeploymentCrashes>;
  createdAt: Scalars['DateTime'];
  deploymentDomain: Scalars['String'];
  deploymentIdentifier: Scalars['WorkerDeploymentIdentifier'];
  devDomainName: Scalars['DevDomainName'];
  id: Scalars['ID'];
  initiatingActor?: Maybe<Actor>;
  logs?: Maybe<WorkerDeploymentLogs>;
  requests?: Maybe<WorkerDeploymentRequests>;
  subdomain: Scalars['String'];
  url: Scalars['String'];
};


export type WorkerDeploymentCrashesArgs = {
  filters?: InputMaybe<CrashesFilters>;
  timespan: DatasetTimespan;
};


export type WorkerDeploymentLogsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  timespan: LogsTimespan;
};


export type WorkerDeploymentRequestsArgs = {
  filters?: InputMaybe<RequestsFilters>;
  timespan: DatasetTimespan;
};

export type WorkerDeploymentAlias = {
  __typename?: 'WorkerDeploymentAlias';
  aliasName?: Maybe<Scalars['WorkerDeploymentIdentifier']>;
  createdAt: Scalars['DateTime'];
  deploymentDomain: Scalars['String'];
  devDomainName: Scalars['DevDomainName'];
  id: Scalars['ID'];
  subdomain: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  url: Scalars['String'];
  workerDeployment: WorkerDeployment;
};

export type WorkerDeploymentAliasEdge = {
  __typename?: 'WorkerDeploymentAliasEdge';
  cursor: Scalars['String'];
  node: WorkerDeploymentAlias;
};

export type WorkerDeploymentAliasesConnection = {
  __typename?: 'WorkerDeploymentAliasesConnection';
  edges: Array<WorkerDeploymentAliasEdge>;
  pageInfo: PageInfo;
};

export type WorkerDeploymentCrashEdge = {
  __typename?: 'WorkerDeploymentCrashEdge';
  logs: Array<WorkerDeploymentLogNode>;
  node: WorkerDeploymentCrashNode;
  request?: Maybe<WorkerDeploymentRequestNode>;
};

export type WorkerDeploymentCrashNode = {
  __typename?: 'WorkerDeploymentCrashNode';
  crashHash: Scalars['ID'];
  crashTimestamp: Scalars['DateTime'];
  deploymentIdentifier: Scalars['String'];
  firstStackLine?: Maybe<Scalars['String']>;
  key: Scalars['ID'];
  message: Scalars['String'];
  name: Scalars['String'];
  requestTimestamp: Scalars['DateTime'];
  scriptName: Scalars['String'];
  stack?: Maybe<Array<Scalars['String']>>;
};

export type WorkerDeploymentCrashes = {
  __typename?: 'WorkerDeploymentCrashes';
  byCrashHash: Array<WorkerDeploymentCrashesHashEdge>;
  byName: Array<WorkerDeploymentCrashesNameEdge>;
  interval: Scalars['Int'];
  minRowsWithoutLimit: Scalars['Int'];
  nodes: Array<WorkerDeploymentCrashNode>;
  summary: WorkerDeploymentCrashesAggregationNode;
  timeseries: Array<WorkerDeploymentCrashesTimeseriesEdge>;
};

export type WorkerDeploymentCrashesAggregationNode = {
  __typename?: 'WorkerDeploymentCrashesAggregationNode';
  crashesPerMs?: Maybe<Scalars['Float']>;
  crashesSum: Scalars['Int'];
  distinctCrashes: Scalars['Int'];
  firstOccurredAt: Scalars['DateTime'];
  mostRecentlyOccurredAt: Scalars['DateTime'];
  sampleRate?: Maybe<Scalars['Float']>;
};

export type WorkerDeploymentCrashesHashEdge = {
  __typename?: 'WorkerDeploymentCrashesHashEdge';
  crashHash: Scalars['ID'];
  node: WorkerDeploymentCrashesAggregationNode;
  sample: WorkerDeploymentCrashNode;
  timeseries: Array<WorkerDeploymentCrashesTimeseriesEdge>;
};

export type WorkerDeploymentCrashesNameEdge = {
  __typename?: 'WorkerDeploymentCrashesNameEdge';
  name: Scalars['String'];
  node: WorkerDeploymentCrashesAggregationNode;
  sample: WorkerDeploymentCrashNode;
  timeseries: Array<WorkerDeploymentCrashesTimeseriesEdge>;
};

export type WorkerDeploymentCrashesTimeseriesEdge = {
  __typename?: 'WorkerDeploymentCrashesTimeseriesEdge';
  node?: Maybe<WorkerDeploymentCrashesAggregationNode>;
  timestamp: Scalars['DateTime'];
};

export type WorkerDeploymentEdge = {
  __typename?: 'WorkerDeploymentEdge';
  cursor: Scalars['String'];
  node: WorkerDeployment;
};

export enum WorkerDeploymentLogLevel {
  Debug = 'DEBUG',
  Error = 'ERROR',
  Fatal = 'FATAL',
  Info = 'INFO',
  Log = 'LOG',
  Warn = 'WARN'
}

export type WorkerDeploymentLogNode = {
  __typename?: 'WorkerDeploymentLogNode';
  level: WorkerDeploymentLogLevel;
  message: Scalars['String'];
  timestamp: Scalars['DateTime'];
};

export type WorkerDeploymentLogs = {
  __typename?: 'WorkerDeploymentLogs';
  minRowsWithoutLimit?: Maybe<Scalars['Int']>;
  nodes: Array<WorkerDeploymentLogNode>;
};

export type WorkerDeploymentQuery = {
  __typename?: 'WorkerDeploymentQuery';
  byId: WorkerDeployment;
};


export type WorkerDeploymentQueryByIdArgs = {
  id: Scalars['ID'];
};

export type WorkerDeploymentRequestEdge = {
  __typename?: 'WorkerDeploymentRequestEdge';
  crash?: Maybe<WorkerDeploymentCrashNode>;
  logs: Array<WorkerDeploymentLogNode>;
  node: WorkerDeploymentRequestNode;
};

export type WorkerDeploymentRequestNode = {
  __typename?: 'WorkerDeploymentRequestNode';
  browserKind?: Maybe<UserAgentBrowser>;
  browserVersion?: Maybe<Scalars['String']>;
  cacheStatus?: Maybe<ResponseCacheStatus>;
  continent?: Maybe<ContinentCode>;
  country?: Maybe<Scalars['String']>;
  deploymentIdentifier: Scalars['String'];
  duration: Scalars['Int'];
  hasCustomDomainOrigin: Scalars['Boolean'];
  isAsset: Scalars['Boolean'];
  isCrash: Scalars['Boolean'];
  isRejected: Scalars['Boolean'];
  isStaleIfError: Scalars['Boolean'];
  isStaleWhileRevalidate: Scalars['Boolean'];
  isVerifiedBot: Scalars['Boolean'];
  key: Scalars['ID'];
  method: Scalars['String'];
  os?: Maybe<UserAgentOs>;
  pathname: Scalars['String'];
  region?: Maybe<Scalars['String']>;
  requestTimestamp: Scalars['DateTime'];
  responseType: ResponseType;
  scriptName: Scalars['String'];
  search?: Maybe<Scalars['String']>;
  status: Scalars['Int'];
  statusType?: Maybe<ResponseStatusType>;
};

export type WorkerDeploymentRequests = {
  __typename?: 'WorkerDeploymentRequests';
  byBrowser: Array<WorkerDeploymentRequestsBrowserEdge>;
  byCacheStatus: Array<WorkerDeploymentRequestsCacheStatusEdge>;
  byContinent: Array<WorkerDeploymentRequestsContinentEdge>;
  byCountry: Array<WorkerDeploymentRequestsCountryEdge>;
  byMethod: Array<WorkerDeploymentRequestsMethodEdge>;
  byOS: Array<WorkerDeploymentRequestsOperatingSystemEdge>;
  byResponseType: Array<WorkerDeploymentRequestsResponseTypeEdge>;
  byStatusType: Array<WorkerDeploymentRequestsStatusTypeEdge>;
  interval: Scalars['Int'];
  minRowsWithoutLimit: Scalars['Int'];
  nodes: Array<WorkerDeploymentRequestNode>;
  summary: WorkerDeploymentRequestsAggregationNode;
  timeseries: Array<WorkerDeploymentRequestsTimeseriesEdge>;
};


export type WorkerDeploymentRequestsByBrowserArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};


export type WorkerDeploymentRequestsByCacheStatusArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};


export type WorkerDeploymentRequestsByContinentArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};


export type WorkerDeploymentRequestsByCountryArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};


export type WorkerDeploymentRequestsByMethodArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};


export type WorkerDeploymentRequestsByOsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};


export type WorkerDeploymentRequestsByResponseTypeArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};


export type WorkerDeploymentRequestsByStatusTypeArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<RequestsOrderBy>;
};

export type WorkerDeploymentRequestsAggregationNode = {
  __typename?: 'WorkerDeploymentRequestsAggregationNode';
  assetsPerMs?: Maybe<Scalars['Float']>;
  assetsSum: Scalars['Int'];
  cacheHitRatio: Scalars['Float'];
  cacheHitRatioP50: Scalars['Float'];
  cacheHitRatioP90: Scalars['Float'];
  cacheHitRatioP99: Scalars['Float'];
  cacheHitsPerMs?: Maybe<Scalars['Float']>;
  cacheHitsSum: Scalars['Int'];
  cachePassRatio: Scalars['Float'];
  cachePassRatioP50: Scalars['Float'];
  cachePassRatioP90: Scalars['Float'];
  cachePassRatioP99: Scalars['Float'];
  clientErrorRatio: Scalars['Float'];
  clientErrorRatioP50: Scalars['Float'];
  clientErrorRatioP90: Scalars['Float'];
  clientErrorRatioP99: Scalars['Float'];
  crashRatio: Scalars['Float'];
  crashRatioP50: Scalars['Float'];
  crashRatioP90: Scalars['Float'];
  crashRatioP99: Scalars['Float'];
  crashesPerMs?: Maybe<Scalars['Float']>;
  crashesSum: Scalars['Int'];
  duration: Scalars['Float'];
  durationP50: Scalars['Float'];
  durationP90: Scalars['Float'];
  durationP99: Scalars['Float'];
  requestsPerMs?: Maybe<Scalars['Float']>;
  requestsSum: Scalars['Int'];
  sampleRate?: Maybe<Scalars['Float']>;
  serverErrorRatio: Scalars['Float'];
  serverErrorRatioP50: Scalars['Float'];
  serverErrorRatioP90: Scalars['Float'];
  serverErrorRatioP99: Scalars['Float'];
  staleIfErrorPerMs?: Maybe<Scalars['Float']>;
  staleIfErrorSum: Scalars['Int'];
  staleWhileRevalidatePerMs?: Maybe<Scalars['Float']>;
  staleWhileRevalidateSum: Scalars['Int'];
};

export type WorkerDeploymentRequestsBrowserEdge = {
  __typename?: 'WorkerDeploymentRequestsBrowserEdge';
  browser?: Maybe<UserAgentBrowser>;
  node: WorkerDeploymentRequestsAggregationNode;
};

export type WorkerDeploymentRequestsCacheStatusEdge = {
  __typename?: 'WorkerDeploymentRequestsCacheStatusEdge';
  cacheStatus?: Maybe<ResponseCacheStatus>;
  node: WorkerDeploymentRequestsAggregationNode;
};

export type WorkerDeploymentRequestsContinentEdge = {
  __typename?: 'WorkerDeploymentRequestsContinentEdge';
  continent: ContinentCode;
  node: WorkerDeploymentRequestsAggregationNode;
};

export type WorkerDeploymentRequestsCountryEdge = {
  __typename?: 'WorkerDeploymentRequestsCountryEdge';
  country?: Maybe<Scalars['String']>;
  node: WorkerDeploymentRequestsAggregationNode;
};

export type WorkerDeploymentRequestsMethodEdge = {
  __typename?: 'WorkerDeploymentRequestsMethodEdge';
  method: Scalars['String'];
  node: WorkerDeploymentRequestsAggregationNode;
};

export type WorkerDeploymentRequestsOperatingSystemEdge = {
  __typename?: 'WorkerDeploymentRequestsOperatingSystemEdge';
  node: WorkerDeploymentRequestsAggregationNode;
  os?: Maybe<UserAgentOs>;
};

export type WorkerDeploymentRequestsResponseTypeEdge = {
  __typename?: 'WorkerDeploymentRequestsResponseTypeEdge';
  node: WorkerDeploymentRequestsAggregationNode;
  responseType: ResponseType;
};

export type WorkerDeploymentRequestsStatusTypeEdge = {
  __typename?: 'WorkerDeploymentRequestsStatusTypeEdge';
  node: WorkerDeploymentRequestsAggregationNode;
  statusType?: Maybe<ResponseStatusType>;
};

export type WorkerDeploymentRequestsTimeseriesEdge = {
  __typename?: 'WorkerDeploymentRequestsTimeseriesEdge';
  byBrowser: Array<WorkerDeploymentRequestsBrowserEdge>;
  byCacheStatus: Array<WorkerDeploymentRequestsCacheStatusEdge>;
  byContinent: Array<WorkerDeploymentRequestsContinentEdge>;
  byCountry: Array<WorkerDeploymentRequestsCountryEdge>;
  byMethod: Array<WorkerDeploymentRequestsMethodEdge>;
  byOS: Array<WorkerDeploymentRequestsOperatingSystemEdge>;
  byResponseType: Array<WorkerDeploymentRequestsResponseTypeEdge>;
  byStatusType: Array<WorkerDeploymentRequestsStatusTypeEdge>;
  node?: Maybe<WorkerDeploymentRequestsAggregationNode>;
  timestamp: Scalars['DateTime'];
};

export type WorkerDeploymentsConnection = {
  __typename?: 'WorkerDeploymentsConnection';
  edges: Array<WorkerDeploymentEdge>;
  pageInfo: PageInfo;
};

export enum WorkerLoggerLevel {
  Debug = 'DEBUG',
  Error = 'ERROR',
  Fatal = 'FATAL',
  Info = 'INFO',
  Trace = 'TRACE',
  Warn = 'WARN'
}

export type Workflow = {
  __typename?: 'Workflow';
  app: App;
  createdAt: Scalars['DateTime'];
  fileName: Scalars['String'];
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  revisionsPaginated: WorkflowRevisionsConnection;
  runsPaginated: WorkflowRunsConnection;
  updatedAt: Scalars['DateTime'];
};


export type WorkflowRevisionsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};


export type WorkflowRunsPaginatedArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type WorkflowJob = {
  __typename?: 'WorkflowJob';
  createdAt: Scalars['DateTime'];
  credentialsAppleDeviceRegistrationRequest?: Maybe<AppleDeviceRegistrationRequest>;
  errors: Array<WorkflowJobError>;
  id: Scalars['ID'];
  key: Scalars['String'];
  name: Scalars['String'];
  outputs: Scalars['JSONObject'];
  requiredJobKeys: Array<Scalars['String']>;
  status: WorkflowJobStatus;
  turtleBuild?: Maybe<Build>;
  turtleJobRun?: Maybe<JobRun>;
  turtleSubmission?: Maybe<Submission>;
  type: WorkflowJobType;
  updatedAt: Scalars['DateTime'];
  workflowRun: WorkflowRun;
};

export type WorkflowJobError = {
  __typename?: 'WorkflowJobError';
  message: Scalars['String'];
  title: Scalars['String'];
};

export type WorkflowJobMutation = {
  __typename?: 'WorkflowJobMutation';
  approveWorkflowJob: Scalars['ID'];
};


export type WorkflowJobMutationApproveWorkflowJobArgs = {
  workflowJobId: Scalars['ID'];
};

export type WorkflowJobQuery = {
  __typename?: 'WorkflowJobQuery';
  byId: WorkflowJob;
};


export type WorkflowJobQueryByIdArgs = {
  workflowJobId: Scalars['ID'];
};

export enum WorkflowJobStatus {
  ActionRequired = 'ACTION_REQUIRED',
  Canceled = 'CANCELED',
  Failure = 'FAILURE',
  InProgress = 'IN_PROGRESS',
  New = 'NEW',
  Skipped = 'SKIPPED',
  Success = 'SUCCESS'
}

export enum WorkflowJobType {
  AppleDeviceRegistrationRequest = 'APPLE_DEVICE_REGISTRATION_REQUEST',
  Build = 'BUILD',
  Custom = 'CUSTOM',
  MaestroTest = 'MAESTRO_TEST',
  RequireApproval = 'REQUIRE_APPROVAL',
  Submission = 'SUBMISSION',
  Update = 'UPDATE'
}

/** Look up Workflow by ID */
export type WorkflowQuery = {
  __typename?: 'WorkflowQuery';
  byId: Workflow;
};


/** Look up Workflow by ID */
export type WorkflowQueryByIdArgs = {
  workflowId: Scalars['ID'];
};

export type WorkflowRevision = {
  __typename?: 'WorkflowRevision';
  blobSha: Scalars['String'];
  commitSha: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  workflow: Workflow;
  yamlConfig: Scalars['String'];
};

export type WorkflowRevisionEdge = {
  __typename?: 'WorkflowRevisionEdge';
  cursor: Scalars['String'];
  node: WorkflowRevision;
};

export type WorkflowRevisionQuery = {
  __typename?: 'WorkflowRevisionQuery';
  byId: WorkflowRevision;
};


export type WorkflowRevisionQueryByIdArgs = {
  workflowRevisionId: Scalars['ID'];
};

export type WorkflowRevisionsConnection = {
  __typename?: 'WorkflowRevisionsConnection';
  edges: Array<WorkflowRevisionEdge>;
  pageInfo: PageInfo;
};

export type WorkflowRun = {
  __typename?: 'WorkflowRun';
  createdAt: Scalars['DateTime'];
  gitCommitHash?: Maybe<Scalars['String']>;
  gitCommitMessage?: Maybe<Scalars['String']>;
  githubRepository?: Maybe<GitHubRepository>;
  id: Scalars['ID'];
  initiatingUser?: Maybe<User>;
  jobs: Array<WorkflowJob>;
  name: Scalars['String'];
  pullRequestNumber?: Maybe<Scalars['Int']>;
  requestedGitRef?: Maybe<Scalars['String']>;
  status: WorkflowRunStatus;
  updatedAt: Scalars['DateTime'];
  workflow: Workflow;
  workflowRevision?: Maybe<WorkflowRevision>;
};

export type WorkflowRunEdge = {
  __typename?: 'WorkflowRunEdge';
  cursor: Scalars['String'];
  node: WorkflowRun;
};

export type WorkflowRunQuery = {
  __typename?: 'WorkflowRunQuery';
  byId: WorkflowRun;
};


export type WorkflowRunQueryByIdArgs = {
  workflowRunId: Scalars['ID'];
};

export enum WorkflowRunStatus {
  ActionRequired = 'ACTION_REQUIRED',
  Canceled = 'CANCELED',
  Failure = 'FAILURE',
  InProgress = 'IN_PROGRESS',
  New = 'NEW',
  Success = 'SUCCESS'
}

export type WorkflowRunsConnection = {
  __typename?: 'WorkflowRunsConnection';
  edges: Array<WorkflowRunEdge>;
  pageInfo: PageInfo;
};

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

export type CommonAppDataFragment = { __typename?: 'App', id: string, name: string, fullName: string, ownerAccount: { __typename?: 'Account', name: string }, firstTwoBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string }> }> };

export type CommonSnackDataFragment = { __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean, sdkVersion: string };

type CurrentUserActorData_SsoUser_Fragment = { __typename: 'SSOUser', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, bestContactEmail?: string | null, accounts: Array<{ __typename?: 'Account', id: string, name: string, ownerUserActor?: { __typename?: 'SSOUser', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> };

type CurrentUserActorData_User_Fragment = { __typename: 'User', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, bestContactEmail?: string | null, accounts: Array<{ __typename?: 'Account', id: string, name: string, ownerUserActor?: { __typename?: 'SSOUser', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> };

export type CurrentUserActorDataFragment = CurrentUserActorData_SsoUser_Fragment | CurrentUserActorData_User_Fragment;

export type UpdateDataFragment = { __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string };

export type Home_AccountDataQueryVariables = Exact<{
  accountName: Scalars['String'];
  appLimit: Scalars['Int'];
  snackLimit: Scalars['Int'];
  platform: AppPlatform;
}>;


export type Home_AccountDataQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, name: string, fullName: string, ownerAccount: { __typename?: 'Account', name: string }, firstTwoBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string }> }> }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean, sdkVersion: string }> } } };

export type BranchDetailsQueryVariables = Exact<{
  name: Scalars['String'];
  appId: Scalars['String'];
  platform: AppPlatform;
}>;


export type BranchDetailsQuery = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, slug: string, fullName: string, updateBranchByName?: { __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string }> } | null } } };

export type BranchesForProjectQueryVariables = Exact<{
  appId: Scalars['String'];
  platform: AppPlatform;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type BranchesForProjectQuery = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, fullName: string, updateBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string }> }> } } };

export type Home_CurrentUserActorQueryVariables = Exact<{ [key: string]: never; }>;


export type Home_CurrentUserActorQuery = { __typename?: 'RootQuery', meUserActor?: { __typename: 'SSOUser', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, bestContactEmail?: string | null, accounts: Array<{ __typename?: 'Account', id: string, name: string, ownerUserActor?: { __typename?: 'SSOUser', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> } | { __typename: 'User', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, bestContactEmail?: string | null, accounts: Array<{ __typename?: 'Account', id: string, name: string, ownerUserActor?: { __typename?: 'SSOUser', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> } | null };

export type Home_AccountAppsQueryVariables = Exact<{
  accountName: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  platform: AppPlatform;
}>;


export type Home_AccountAppsQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, appCount: number, apps: Array<{ __typename?: 'App', id: string, name: string, fullName: string, ownerAccount: { __typename?: 'Account', name: string }, firstTwoBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string }> }> }> } } };

export type ProjectsQueryVariables = Exact<{
  appId: Scalars['String'];
  platform: AppPlatform;
}>;


export type ProjectsQuery = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, name: string, slug: string, fullName: string, ownerAccount: { __typename?: 'Account', name: string }, updateBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string }> }> } } };

export type Home_AccountSnacksQueryVariables = Exact<{
  accountName: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
}>;


export type Home_AccountSnacksQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean, sdkVersion: string }> } } };

export type Home_ViewerPrimaryAccountNameQueryVariables = Exact<{ [key: string]: never; }>;


export type Home_ViewerPrimaryAccountNameQuery = { __typename?: 'RootQuery', meUserActor?: { __typename?: 'SSOUser', id: string, primaryAccount: { __typename?: 'Account', id: string, name: string } } | { __typename?: 'User', id: string, primaryAccount: { __typename?: 'Account', id: string, name: string } } | null };

export type HomeScreenDataQueryVariables = Exact<{
  accountName: Scalars['String'];
  platform: AppPlatform;
}>;


export type HomeScreenDataQuery = { __typename?: 'RootQuery', account: { __typename?: 'AccountQuery', byName: { __typename?: 'Account', id: string, name: string, appCount: number, ownerUserActor?: { __typename: 'SSOUser', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, bestContactEmail?: string | null, accounts: Array<{ __typename?: 'Account', id: string, name: string, ownerUserActor?: { __typename?: 'SSOUser', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> } | { __typename: 'User', id: string, username: string, firstName?: string | null, lastName?: string | null, profilePhoto: string, bestContactEmail?: string | null, accounts: Array<{ __typename?: 'Account', id: string, name: string, ownerUserActor?: { __typename?: 'SSOUser', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | { __typename?: 'User', id: string, username: string, profilePhoto: string, firstName?: string | null, fullName?: string | null, lastName?: string | null } | null }> } | null, apps: Array<{ __typename?: 'App', id: string, name: string, fullName: string, ownerAccount: { __typename?: 'Account', name: string }, firstTwoBranches: Array<{ __typename?: 'UpdateBranch', id: string, name: string, updates: Array<{ __typename?: 'Update', id: string, group: string, message?: string | null, createdAt: any, runtimeVersion: string, expoGoSDKVersion?: string | null, platform: string, manifestPermalink: string }> }> }>, snacks: Array<{ __typename?: 'Snack', id: string, name: string, description: string, fullName: string, slug: string, isDraft: boolean, sdkVersion: string }> } } };

export const UpdateDataFragmentDoc = gql`
    fragment UpdateData on Update {
  id
  group
  message
  createdAt
  runtimeVersion
  expoGoSDKVersion
  platform
  manifestPermalink
}
    `;
export const CommonAppDataFragmentDoc = gql`
    fragment CommonAppData on App {
  id
  name
  fullName
  ownerAccount {
    name
  }
  firstTwoBranches: updateBranches(limit: 2, offset: 0) {
    id
    name
    updates(limit: 1, offset: 0, filter: {platform: $platform}) {
      id
      ...UpdateData
    }
  }
}
    ${UpdateDataFragmentDoc}`;
export const CommonSnackDataFragmentDoc = gql`
    fragment CommonSnackData on Snack {
  id
  name
  description
  fullName
  slug
  isDraft
  sdkVersion
}
    `;
export const CurrentUserActorDataFragmentDoc = gql`
    fragment CurrentUserActorData on UserActor {
  __typename
  id
  username
  firstName
  lastName
  profilePhoto
  bestContactEmail
  accounts {
    id
    name
    ownerUserActor {
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
export const Home_AccountDataDocument = gql`
    query Home_AccountData($accountName: String!, $appLimit: Int!, $snackLimit: Int!, $platform: AppPlatform!) {
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
 *      platform: // value for 'platform'
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
    query BranchDetails($name: String!, $appId: String!, $platform: AppPlatform!) {
  app {
    byId(appId: $appId) {
      id
      name
      slug
      fullName
      updateBranchByName(name: $name) {
        id
        name
        updates(limit: 100, offset: 0, filter: {platform: $platform}) {
          id
          ...UpdateData
        }
      }
    }
  }
}
    ${UpdateDataFragmentDoc}`;

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
    query BranchesForProject($appId: String!, $platform: AppPlatform!, $limit: Int!, $offset: Int!) {
  app {
    byId(appId: $appId) {
      id
      name
      fullName
      updateBranches(limit: $limit, offset: $offset) {
        id
        name
        updates(limit: 1, offset: 0, filter: {platform: $platform}) {
          id
          ...UpdateData
        }
      }
    }
  }
}
    ${UpdateDataFragmentDoc}`;

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
export const Home_CurrentUserActorDocument = gql`
    query Home_CurrentUserActor {
  meUserActor {
    ...CurrentUserActorData
  }
}
    ${CurrentUserActorDataFragmentDoc}`;

/**
 * __useHome_CurrentUserActorQuery__
 *
 * To run a query within a React component, call `useHome_CurrentUserActorQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_CurrentUserActorQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_CurrentUserActorQuery({
 *   variables: {
 *   },
 * });
 */
export function useHome_CurrentUserActorQuery(baseOptions?: Apollo.QueryHookOptions<Home_CurrentUserActorQuery, Home_CurrentUserActorQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_CurrentUserActorQuery, Home_CurrentUserActorQueryVariables>(Home_CurrentUserActorDocument, options);
      }
export function useHome_CurrentUserActorLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_CurrentUserActorQuery, Home_CurrentUserActorQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_CurrentUserActorQuery, Home_CurrentUserActorQueryVariables>(Home_CurrentUserActorDocument, options);
        }
export type Home_CurrentUserActorQueryHookResult = ReturnType<typeof useHome_CurrentUserActorQuery>;
export type Home_CurrentUserActorLazyQueryHookResult = ReturnType<typeof useHome_CurrentUserActorLazyQuery>;
export type Home_CurrentUserActorQueryResult = Apollo.QueryResult<Home_CurrentUserActorQuery, Home_CurrentUserActorQueryVariables>;
export function refetchHome_CurrentUserActorQuery(variables?: Home_CurrentUserActorQueryVariables) {
      return { query: Home_CurrentUserActorDocument, variables: variables }
    }
export const Home_AccountAppsDocument = gql`
    query Home_AccountApps($accountName: String!, $limit: Int!, $offset: Int!, $platform: AppPlatform!) {
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
 *      platform: // value for 'platform'
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
export const ProjectsQueryDocument = gql`
    query ProjectsQuery($appId: String!, $platform: AppPlatform!) {
  app {
    byId(appId: $appId) {
      id
      name
      slug
      fullName
      ownerAccount {
        name
      }
      updateBranches(limit: 100, offset: 0) {
        id
        name
        updates(limit: 1, offset: 0, filter: {platform: $platform}) {
          id
          ...UpdateData
        }
      }
    }
  }
}
    ${UpdateDataFragmentDoc}`;

/**
 * __useProjectsQuery__
 *
 * To run a query within a React component, call `useProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProjectsQuery({
 *   variables: {
 *      appId: // value for 'appId'
 *      platform: // value for 'platform'
 *   },
 * });
 */
export function useProjectsQuery(baseOptions: Apollo.QueryHookOptions<ProjectsQuery, ProjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProjectsQuery, ProjectsQueryVariables>(ProjectsQueryDocument, options);
      }
export function useProjectsQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProjectsQuery, ProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProjectsQuery, ProjectsQueryVariables>(ProjectsQueryDocument, options);
        }
export type ProjectsQueryHookResult = ReturnType<typeof useProjectsQuery>;
export type ProjectsQueryLazyQueryHookResult = ReturnType<typeof useProjectsQueryLazyQuery>;
export type ProjectsQueryQueryResult = Apollo.QueryResult<ProjectsQuery, ProjectsQueryVariables>;
export function refetchProjectsQuery(variables: ProjectsQueryVariables) {
      return { query: ProjectsQueryDocument, variables: variables }
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
export const Home_ViewerPrimaryAccountNameDocument = gql`
    query Home_ViewerPrimaryAccountName {
  meUserActor {
    id
    primaryAccount {
      id
      name
    }
  }
}
    `;

/**
 * __useHome_ViewerPrimaryAccountNameQuery__
 *
 * To run a query within a React component, call `useHome_ViewerPrimaryAccountNameQuery` and pass it any options that fit your needs.
 * When your component renders, `useHome_ViewerPrimaryAccountNameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHome_ViewerPrimaryAccountNameQuery({
 *   variables: {
 *   },
 * });
 */
export function useHome_ViewerPrimaryAccountNameQuery(baseOptions?: Apollo.QueryHookOptions<Home_ViewerPrimaryAccountNameQuery, Home_ViewerPrimaryAccountNameQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Home_ViewerPrimaryAccountNameQuery, Home_ViewerPrimaryAccountNameQueryVariables>(Home_ViewerPrimaryAccountNameDocument, options);
      }
export function useHome_ViewerPrimaryAccountNameLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Home_ViewerPrimaryAccountNameQuery, Home_ViewerPrimaryAccountNameQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Home_ViewerPrimaryAccountNameQuery, Home_ViewerPrimaryAccountNameQueryVariables>(Home_ViewerPrimaryAccountNameDocument, options);
        }
export type Home_ViewerPrimaryAccountNameQueryHookResult = ReturnType<typeof useHome_ViewerPrimaryAccountNameQuery>;
export type Home_ViewerPrimaryAccountNameLazyQueryHookResult = ReturnType<typeof useHome_ViewerPrimaryAccountNameLazyQuery>;
export type Home_ViewerPrimaryAccountNameQueryResult = Apollo.QueryResult<Home_ViewerPrimaryAccountNameQuery, Home_ViewerPrimaryAccountNameQueryVariables>;
export function refetchHome_ViewerPrimaryAccountNameQuery(variables?: Home_ViewerPrimaryAccountNameQueryVariables) {
      return { query: Home_ViewerPrimaryAccountNameDocument, variables: variables }
    }
export const HomeScreenDataDocument = gql`
    query HomeScreenData($accountName: String!, $platform: AppPlatform!) {
  account {
    byName(accountName: $accountName) {
      id
      name
      ownerUserActor {
        ...CurrentUserActorData
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
    ${CurrentUserActorDataFragmentDoc}
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
 *      platform: // value for 'platform'
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