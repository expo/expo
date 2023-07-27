/**
 * eslint-disable
 * This file was generated using GraphQL Codegen
 * Command: yarn generate-graphql-code
 * Run this during development for automatic type generation when editing GraphQL documents
 * For more info and docs, visit https://graphql-code-generator.com/
 */

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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
  DateTime: any;
  JSON: any;
  JSONObject: any;
};

export type AccountAppsFilterInput = {
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

export type AccountNotificationSubscriptionInput = {
  accountId: Scalars['ID'];
  event: NotificationEvent;
  type: NotificationType;
  userId: Scalars['ID'];
};

export type AccountSsoConfigurationData = {
  authEndpoint?: InputMaybe<Scalars['String']>;
  authProtocol: AuthProtocolType;
  authProviderIdentifier: Scalars['String'];
  clientIdentifier: Scalars['String'];
  clientSecret: Scalars['String'];
  endSessionEndpoint?: InputMaybe<Scalars['String']>;
  issuer: Scalars['String'];
  jwksEndpoint?: InputMaybe<Scalars['String']>;
  revokeEndpoint?: InputMaybe<Scalars['String']>;
  tokenEndpoint?: InputMaybe<Scalars['String']>;
  userInfoEndpoint?: InputMaybe<Scalars['String']>;
};

export enum ActivityTimelineProjectActivityType {
  Build = 'BUILD',
  BuildJob = 'BUILD_JOB',
  Submission = 'SUBMISSION',
  Update = 'UPDATE'
}

export type AddUserInput = {
  audience?: InputMaybe<MailchimpAudience>;
  email: Scalars['String'];
  tags?: InputMaybe<Array<MailchimpTag>>;
};

/** @isDefault: if set, these build credentials will become the default for the Android app. All other build credentials will have their default status set to false. */
export type AndroidAppBuildCredentialsInput = {
  isDefault: Scalars['Boolean'];
  keystoreId: Scalars['ID'];
  name: Scalars['String'];
};

export type AndroidAppCredentialsFilter = {
  applicationIdentifier?: InputMaybe<Scalars['String']>;
  legacyOnly?: InputMaybe<Scalars['Boolean']>;
};

export type AndroidAppCredentialsInput = {
  fcmId?: InputMaybe<Scalars['ID']>;
  googleServiceAccountKeyForSubmissionsId?: InputMaybe<Scalars['ID']>;
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

export type AndroidFcmInput = {
  credential: Scalars['String'];
  version: AndroidFcmVersion;
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
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
  gradleCommand?: InputMaybe<Scalars['String']>;
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

export type AndroidKeystoreInput = {
  base64EncodedKeystore: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: InputMaybe<Scalars['String']>;
  keystorePassword: Scalars['String'];
  type: AndroidKeystoreType;
};

export enum AndroidKeystoreType {
  Jks = 'JKS',
  Pkcs12 = 'PKCS12',
  Unknown = 'UNKNOWN'
}

export type AndroidSubmissionConfigInput = {
  applicationIdentifier?: InputMaybe<Scalars['String']>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  changesNotSentForReview?: InputMaybe<Scalars['Boolean']>;
  googleServiceAccountKeyId?: InputMaybe<Scalars['String']>;
  googleServiceAccountKeyJson?: InputMaybe<Scalars['String']>;
  releaseStatus?: InputMaybe<SubmissionAndroidReleaseStatus>;
  track: SubmissionAndroidTrack;
};

export type AppDataInput = {
  id: Scalars['ID'];
  privacy?: InputMaybe<Scalars['String']>;
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

export enum AppSort {
  /** Sort by recently published */
  RecentlyPublished = 'RECENTLY_PUBLISHED',
  /** Sort by highest trendScore */
  Viewed = 'VIEWED'
}

export type AppStoreConnectApiKeyInput = {
  appleTeamId?: InputMaybe<Scalars['ID']>;
  issuerIdentifier: Scalars['String'];
  keyIdentifier: Scalars['String'];
  keyP8: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
  roles?: InputMaybe<Array<AppStoreConnectUserRole>>;
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

export type AppVersionInput = {
  appId: Scalars['ID'];
  applicationIdentifier: Scalars['String'];
  buildVersion: Scalars['String'];
  platform: AppPlatform;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  storeVersion: Scalars['String'];
};

export type AppleAppIdentifierInput = {
  appleTeamId?: InputMaybe<Scalars['ID']>;
  bundleIdentifier: Scalars['String'];
  parentAppleAppId?: InputMaybe<Scalars['ID']>;
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

export type AppleDeviceUpdateInput = {
  name?: InputMaybe<Scalars['String']>;
};

export type AppleDistributionCertificateInput = {
  appleTeamId?: InputMaybe<Scalars['ID']>;
  certP12: Scalars['String'];
  certPassword: Scalars['String'];
  certPrivateSigningKey?: InputMaybe<Scalars['String']>;
  developerPortalIdentifier?: InputMaybe<Scalars['String']>;
};

export type AppleProvisioningProfileInput = {
  appleProvisioningProfile: Scalars['String'];
  developerPortalIdentifier?: InputMaybe<Scalars['String']>;
};

export type ApplePushKeyInput = {
  appleTeamId: Scalars['ID'];
  keyIdentifier: Scalars['String'];
  keyP8: Scalars['String'];
};

export type AppleTeamInput = {
  appleTeamIdentifier: Scalars['String'];
  appleTeamName?: InputMaybe<Scalars['String']>;
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

export enum AssetMetadataStatus {
  DoesNotExist = 'DOES_NOT_EXIST',
  Exists = 'EXISTS'
}

export enum AuthProtocolType {
  Oidc = 'OIDC'
}

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

export type BuildFilterInput = {
  channel?: InputMaybe<Scalars['String']>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannel?: InputMaybe<Scalars['String']>;
};

export enum BuildIosEnterpriseProvisioning {
  Adhoc = 'ADHOC',
  Universal = 'UNIVERSAL'
}

export enum BuildJobLogsFormat {
  Json = 'JSON',
  Raw = 'RAW'
}

export enum BuildJobStatus {
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  Pending = 'PENDING',
  SentToQueue = 'SENT_TO_QUEUE',
  Started = 'STARTED'
}

export type BuildMetadataInput = {
  appBuildVersion?: InputMaybe<Scalars['String']>;
  appIdentifier?: InputMaybe<Scalars['String']>;
  appName?: InputMaybe<Scalars['String']>;
  appVersion?: InputMaybe<Scalars['String']>;
  buildMode?: InputMaybe<BuildMode>;
  buildProfile?: InputMaybe<Scalars['String']>;
  channel?: InputMaybe<Scalars['String']>;
  cliVersion?: InputMaybe<Scalars['String']>;
  credentialsSource?: InputMaybe<BuildCredentialsSource>;
  customWorkflowName?: InputMaybe<Scalars['String']>;
  distribution?: InputMaybe<DistributionType>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  gitCommitMessage?: InputMaybe<Scalars['String']>;
  iosEnterpriseProvisioning?: InputMaybe<BuildIosEnterpriseProvisioning>;
  isGitWorkingTreeDirty?: InputMaybe<Scalars['Boolean']>;
  message?: InputMaybe<Scalars['String']>;
  reactNativeVersion?: InputMaybe<Scalars['String']>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  runFromCI?: InputMaybe<Scalars['Boolean']>;
  runWithNoWaitFlag?: InputMaybe<Scalars['Boolean']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  sdkVersion?: InputMaybe<Scalars['String']>;
  trackingContext?: InputMaybe<Scalars['JSONObject']>;
  username?: InputMaybe<Scalars['String']>;
  workflow?: InputMaybe<BuildWorkflow>;
};

export enum BuildMode {
  Build = 'BUILD',
  Custom = 'CUSTOM',
  Resign = 'RESIGN'
}

export type BuildParamsInput = {
  reactNativeVersion?: InputMaybe<Scalars['String']>;
  resourceClass: BuildResourceClass;
  sdkVersion?: InputMaybe<Scalars['String']>;
};

export enum BuildPriority {
  High = 'HIGH',
  Normal = 'NORMAL',
  NormalPlus = 'NORMAL_PLUS'
}

export type BuildResignInput = {
  applicationArchiveSource?: InputMaybe<ProjectArchiveSourceInput>;
};

export enum BuildResourceClass {
  AndroidDefault = 'ANDROID_DEFAULT',
  AndroidLarge = 'ANDROID_LARGE',
  AndroidMedium = 'ANDROID_MEDIUM',
  IosDefault = 'IOS_DEFAULT',
  /** @deprecated Use IOS_INTEL_MEDIUM instead */
  IosIntelLarge = 'IOS_INTEL_LARGE',
  IosIntelMedium = 'IOS_INTEL_MEDIUM',
  IosLarge = 'IOS_LARGE',
  /** @deprecated Use IOS_M_MEDIUM instead */
  IosM1Large = 'IOS_M1_LARGE',
  IosM1Medium = 'IOS_M1_MEDIUM',
  IosMedium = 'IOS_MEDIUM',
  IosMLarge = 'IOS_M_LARGE',
  IosMMedium = 'IOS_M_MEDIUM',
  Legacy = 'LEGACY'
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
  New = 'NEW'
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

export type CodeSigningInfoInput = {
  alg: Scalars['String'];
  keyid: Scalars['String'];
  sig: Scalars['String'];
};

export type CreateAccessTokenInput = {
  actorID: Scalars['ID'];
  note?: InputMaybe<Scalars['String']>;
};

export type CreateAndroidSubmissionInput = {
  appId: Scalars['ID'];
  archiveSource?: InputMaybe<SubmissionArchiveSourceInput>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  config: AndroidSubmissionConfigInput;
  submittedBuildId?: InputMaybe<Scalars['ID']>;
};

export type CreateEnvironmentSecretInput = {
  name: Scalars['String'];
  type?: InputMaybe<EnvironmentSecretType>;
  value: Scalars['String'];
};

export type CreateGitHubAppInstallationInput = {
  accountId: Scalars['ID'];
  installationIdentifier: Scalars['Int'];
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

export type CustomBuildConfigInput = {
  path: Scalars['String'];
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

export enum EasBuildDeprecationInfoType {
  Internal = 'INTERNAL',
  UserFacing = 'USER_FACING'
}

export enum EasService {
  Builds = 'BUILDS',
  Updates = 'UPDATES'
}

export enum EasServiceMetric {
  AssetsRequests = 'ASSETS_REQUESTS',
  BandwidthUsage = 'BANDWIDTH_USAGE',
  Builds = 'BUILDS',
  ManifestRequests = 'MANIFEST_REQUESTS',
  UniqueUpdaters = 'UNIQUE_UPDATERS',
  UniqueUsers = 'UNIQUE_USERS'
}

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

export enum EnvironmentSecretType {
  FileBase64 = 'FILE_BASE64',
  String = 'STRING'
}

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

export enum GitHubAppEnvironment {
  Development = 'DEVELOPMENT',
  Production = 'PRODUCTION',
  Staging = 'STAGING'
}

export enum GitHubAppInstallationStatus {
  Active = 'ACTIVE',
  NotInstalled = 'NOT_INSTALLED',
  Suspended = 'SUSPENDED'
}

export type GitHubBuildInput = {
  appId: Scalars['ID'];
  baseDirectory?: InputMaybe<Scalars['String']>;
  buildProfile: Scalars['String'];
  gitRef: Scalars['String'];
  platform: AppPlatform;
};

export type GoogleServiceAccountKeyInput = {
  jsonKey: Scalars['JSONObject'];
};

export enum InvoiceDiscountType {
  Amount = 'AMOUNT',
  Percentage = 'PERCENTAGE'
}

export type IosAppBuildCredentialsFilter = {
  iosDistributionType?: InputMaybe<IosDistributionType>;
};

export type IosAppBuildCredentialsInput = {
  distributionCertificateId: Scalars['ID'];
  iosDistributionType: IosDistributionType;
  provisioningProfileId: Scalars['ID'];
};

export type IosAppCredentialsFilter = {
  appleAppIdentifierId?: InputMaybe<Scalars['String']>;
};

export type IosAppCredentialsInput = {
  appStoreConnectApiKeyForSubmissionsId?: InputMaybe<Scalars['ID']>;
  appleTeamId?: InputMaybe<Scalars['ID']>;
  pushKeyId?: InputMaybe<Scalars['ID']>;
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
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  /** @deprecated */
  distribution?: InputMaybe<DistributionType>;
  experimental?: InputMaybe<Scalars['JSONObject']>;
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

export type IosSubmissionConfigInput = {
  appleAppSpecificPassword?: InputMaybe<Scalars['String']>;
  appleIdUsername?: InputMaybe<Scalars['String']>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  ascApiKey?: InputMaybe<AscApiKeyInput>;
  ascApiKeyId?: InputMaybe<Scalars['String']>;
  ascAppIdentifier: Scalars['String'];
};

export enum MailchimpAudience {
  ExpoDevelopers = 'EXPO_DEVELOPERS'
}

export enum MailchimpTag {
  DevClientUsers = 'DEV_CLIENT_USERS',
  EasMasterList = 'EAS_MASTER_LIST'
}

export enum NotificationEvent {
  BuildComplete = 'BUILD_COMPLETE',
  SubmissionComplete = 'SUBMISSION_COMPLETE'
}

export type NotificationSubscriptionFilter = {
  accountId?: InputMaybe<Scalars['ID']>;
  appId?: InputMaybe<Scalars['ID']>;
  event?: InputMaybe<NotificationEvent>;
  type?: InputMaybe<NotificationType>;
};

export enum NotificationType {
  Email = 'EMAIL'
}

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

export enum Permission {
  Admin = 'ADMIN',
  Own = 'OWN',
  Publish = 'PUBLISH',
  View = 'VIEW'
}

export type ProjectArchiveSourceInput = {
  bucketKey?: InputMaybe<Scalars['String']>;
  gitRef?: InputMaybe<Scalars['String']>;
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

export type PublishUpdateGroupInput = {
  awaitingCodeSigningInfo?: InputMaybe<Scalars['Boolean']>;
  branchId: Scalars['String'];
  excludedAssets?: InputMaybe<Array<PartialManifestAsset>>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  isGitWorkingTreeDirty?: InputMaybe<Scalars['Boolean']>;
  message?: InputMaybe<Scalars['String']>;
  rollBackToEmbeddedInfoGroup?: InputMaybe<UpdateRollBackToEmbeddedGroup>;
  runtimeVersion: Scalars['String'];
  updateInfoGroup?: InputMaybe<UpdateInfoGroup>;
};

export type RobotDataInput = {
  name?: InputMaybe<Scalars['String']>;
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

export type SsoUserDataInput = {
  firstName?: InputMaybe<Scalars['String']>;
  githubUsername?: InputMaybe<Scalars['String']>;
  industry?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  twitterUsername?: InputMaybe<Scalars['String']>;
};

export type SecondFactorDeviceConfiguration = {
  isPrimary: Scalars['Boolean'];
  method: SecondFactorMethod;
  name: Scalars['String'];
  smsPhoneNumber?: InputMaybe<Scalars['String']>;
};

export enum SecondFactorMethod {
  /** Google Authenticator (TOTP) */
  Authenticator = 'AUTHENTICATOR',
  /** SMS */
  Sms = 'SMS'
}

export type ServerlessFunctionIdentifierInput = {
  gitCommitSHA1: Scalars['String'];
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

/** Name of a service monitored by Expo status page. */
export enum StatuspageServiceName {
  EasBuild = 'EAS_BUILD',
  EasSubmit = 'EAS_SUBMIT',
  EasUpdate = 'EAS_UPDATE'
}

/** Possible statuses for a service. */
export enum StatuspageServiceStatus {
  DegradedPerformance = 'DEGRADED_PERFORMANCE',
  MajorOutage = 'MAJOR_OUTAGE',
  Operational = 'OPERATIONAL',
  PartialOutage = 'PARTIAL_OUTAGE',
  UnderMaintenance = 'UNDER_MAINTENANCE'
}

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

export type SubmissionFilter = {
  platform?: InputMaybe<AppPlatform>;
  status?: InputMaybe<SubmissionStatus>;
};

export enum SubmissionStatus {
  AwaitingBuild = 'AWAITING_BUILD',
  Canceled = 'CANCELED',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  InQueue = 'IN_QUEUE'
}

export type TimelineActivityFilterInput = {
  channels?: InputMaybe<Array<Scalars['String']>>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannels?: InputMaybe<Array<Scalars['String']>>;
  types?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
};

export type UpdateGitHubRepositorySettingsInput = {
  baseDirectory: Scalars['String'];
};

export type UpdateInfoGroup = {
  android?: InputMaybe<PartialManifest>;
  ios?: InputMaybe<PartialManifest>;
  web?: InputMaybe<PartialManifest>;
};

export type UpdateRollBackToEmbeddedGroup = {
  android?: InputMaybe<Scalars['Boolean']>;
  ios?: InputMaybe<Scalars['Boolean']>;
  web?: InputMaybe<Scalars['Boolean']>;
};

export type UpdatesFilter = {
  platform?: InputMaybe<AppPlatform>;
  runtimeVersions?: InputMaybe<Array<Scalars['String']>>;
  sdkVersions?: InputMaybe<Array<Scalars['String']>>;
};

export enum UploadSessionType {
  EasBuildGcsProjectSources = 'EAS_BUILD_GCS_PROJECT_SOURCES',
  EasBuildProjectSources = 'EAS_BUILD_PROJECT_SOURCES',
  EasSubmitAppArchive = 'EAS_SUBMIT_APP_ARCHIVE',
  EasSubmitGcsAppArchive = 'EAS_SUBMIT_GCS_APP_ARCHIVE'
}

export enum UsageMetricType {
  Bandwidth = 'BANDWIDTH',
  Build = 'BUILD',
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

export type UserDataInput = {
  appetizeCode?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['String']>;
  firstName?: InputMaybe<Scalars['String']>;
  fullName?: InputMaybe<Scalars['String']>;
  githubUsername?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  industry?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  profilePhoto?: InputMaybe<Scalars['String']>;
  twitterUsername?: InputMaybe<Scalars['String']>;
  username?: InputMaybe<Scalars['String']>;
};

export type WebhookFilter = {
  event?: InputMaybe<WebhookType>;
};

export type WebhookInput = {
  event: WebhookType;
  secret: Scalars['String'];
  url: Scalars['String'];
};

export enum WebhookType {
  Build = 'BUILD',
  Submit = 'SUBMIT'
}

export type AppByIdQueryVariables = Exact<{
  appId: Scalars['String'];
}>;


export type AppByIdQuery = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, scopeKey: string, ownerAccount: { __typename?: 'Account', id: string } } } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'RootQuery', meActor?: { __typename: 'Robot', firstName?: string | null, id: string, accounts: Array<{ __typename?: 'Account', id: string, users: Array<{ __typename?: 'UserPermission', permissions: Array<Permission>, actor: { __typename?: 'Robot', id: string } | { __typename?: 'SSOUser', id: string } | { __typename?: 'User', id: string } }> }> } | { __typename: 'SSOUser', username: string, id: string, primaryAccount: { __typename?: 'Account', id: string }, accounts: Array<{ __typename?: 'Account', id: string, users: Array<{ __typename?: 'UserPermission', permissions: Array<Permission>, actor: { __typename?: 'Robot', id: string } | { __typename?: 'SSOUser', id: string } | { __typename?: 'User', id: string } }> }> } | { __typename: 'User', username: string, id: string, primaryAccount: { __typename?: 'Account', id: string }, accounts: Array<{ __typename?: 'Account', id: string, users: Array<{ __typename?: 'UserPermission', permissions: Array<Permission>, actor: { __typename?: 'Robot', id: string } | { __typename?: 'SSOUser', id: string } | { __typename?: 'User', id: string } }> }> } | null };

export type AppFragment = { __typename?: 'App', id: string, scopeKey: string, ownerAccount: { __typename?: 'Account', id: string } };
