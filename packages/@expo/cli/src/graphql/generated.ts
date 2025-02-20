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
  DevDomainName: any;
  JSON: any;
  JSONObject: any;
  WorkerDeploymentIdentifier: any;
  WorkerDeploymentRequestID: any;
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

export type AccountNotificationSubscriptionInput = {
  accountId: Scalars['ID'];
  event: NotificationEvent;
  type: NotificationType;
  userId: Scalars['ID'];
};

export type AccountSsoConfigurationData = {
  authProtocol: AuthProtocolType;
  authProviderIdentifier: AuthProviderIdentifier;
  clientIdentifier: Scalars['String'];
  clientSecret: Scalars['String'];
  issuer: Scalars['String'];
};

export enum AccountUploadSessionType {
  ProfileImageUpload = 'PROFILE_IMAGE_UPLOAD',
  WorkflowsProjectSources = 'WORKFLOWS_PROJECT_SOURCES'
}

export enum ActivityTimelineProjectActivityType {
  Build = 'BUILD',
  Submission = 'SUBMISSION',
  Update = 'UPDATE',
  Worker = 'WORKER',
  WorkflowRun = 'WORKFLOW_RUN'
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
  googleServiceAccountKeyForFcmV1Id?: InputMaybe<Scalars['ID']>;
  googleServiceAccountKeyForSubmissionsId?: InputMaybe<Scalars['ID']>;
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

export type AndroidKeystoreInput = {
  base64EncodedKeystore: Scalars['String'];
  keyAlias: Scalars['String'];
  keyPassword?: InputMaybe<Scalars['String']>;
  keystorePassword: Scalars['String'];
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
  isVerboseFastlaneEnabled?: InputMaybe<Scalars['Boolean']>;
  releaseStatus?: InputMaybe<SubmissionAndroidReleaseStatus>;
  rollout?: InputMaybe<Scalars['Float']>;
  track: SubmissionAndroidTrack;
};

export type AppDataInput = {
  id: Scalars['ID'];
  internalDistributionBuildPrivacy?: InputMaybe<AppInternalDistributionBuildPrivacy>;
  privacy?: InputMaybe<Scalars['String']>;
};

export type AppInfoInput = {
  displayName?: InputMaybe<Scalars['String']>;
};

export type AppInput = {
  accountId: Scalars['ID'];
  appInfo?: InputMaybe<AppInfoInput>;
  projectName: Scalars['String'];
};

export enum AppInternalDistributionBuildPrivacy {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

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

export enum AppUploadSessionType {
  ProfileImageUpload = 'PROFILE_IMAGE_UPLOAD'
}

export type AppVersionInput = {
  appId: Scalars['ID'];
  applicationIdentifier: Scalars['String'];
  buildVersion: Scalars['String'];
  platform: AppPlatform;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  storeVersion: Scalars['String'];
};

export type AppWithGithubRepositoryInput = {
  accountId: Scalars['ID'];
  appInfo?: InputMaybe<AppInfoInput>;
  installationIdentifier?: InputMaybe<Scalars['String']>;
  projectName: Scalars['String'];
};

export type AppleAppIdentifierInput = {
  appleTeamId?: InputMaybe<Scalars['ID']>;
  bundleIdentifier: Scalars['String'];
  parentAppleAppId?: InputMaybe<Scalars['ID']>;
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

export type AppleTeamFilterInput = {
  appleTeamIdentifier?: InputMaybe<Scalars['String']>;
};

export type AppleTeamInput = {
  appleTeamIdentifier: Scalars['String'];
  appleTeamName?: InputMaybe<Scalars['String']>;
  appleTeamType?: InputMaybe<AppleTeamType>;
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

export enum AssetMetadataStatus {
  DoesNotExist = 'DOES_NOT_EXIST',
  Exists = 'EXISTS'
}

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

export type BranchFilterInput = {
  searchTerm?: InputMaybe<Scalars['String']>;
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
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  distribution?: InputMaybe<DistributionType>;
  fingerprintHash?: InputMaybe<Scalars['String']>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  hasFingerprint?: InputMaybe<Scalars['Boolean']>;
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
  fingerprintHash?: InputMaybe<Scalars['String']>;
  hasFingerprint?: InputMaybe<Scalars['Boolean']>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
  simulator?: InputMaybe<Scalars['Boolean']>;
};

export enum BuildIosEnterpriseProvisioning {
  Adhoc = 'ADHOC',
  Universal = 'UNIVERSAL'
}

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
  fingerprintHash?: InputMaybe<Scalars['String']>;
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

export enum BuildMode {
  Build = 'BUILD',
  Custom = 'CUSTOM',
  Repack = 'REPACK',
  Resign = 'RESIGN'
}

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

export type ChannelFilterInput = {
  searchTerm?: InputMaybe<Scalars['String']>;
};

export type CodeSigningInfoInput = {
  alg: Scalars['String'];
  keyid: Scalars['String'];
  sig: Scalars['String'];
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
  crashKind?: InputMaybe<Array<WorkerDeploymentCrashKind>>;
  name?: InputMaybe<Array<Scalars['String']>>;
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

export type CreateEnvironmentVariableInput = {
  environments?: InputMaybe<Array<EnvironmentVariableEnvironment>>;
  fileName?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  overwrite?: InputMaybe<Scalars['Boolean']>;
  type?: InputMaybe<EnvironmentSecretType>;
  value: Scalars['String'];
  visibility: EnvironmentVariableVisibility;
};

export type CreateFingerprintInput = {
  hash: Scalars['String'];
  source?: InputMaybe<FingerprintSourceInput>;
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

export type CustomBuildConfigInput = {
  path: Scalars['String'];
};

export enum CustomDomainDnsRecordType {
  A = 'A',
  Cname = 'CNAME',
  Txt = 'TXT'
}

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

export type DeploymentFilterInput = {
  channel?: InputMaybe<Scalars['String']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
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
  WorkerCustomDomainEntity = 'WorkerCustomDomainEntity',
  WorkerDeploymentAliasEntity = 'WorkerDeploymentAliasEntity',
  WorkerEntity = 'WorkerEntity',
  WorkflowEntity = 'WorkflowEntity',
  WorkflowRevisionEntity = 'WorkflowRevisionEntity'
}

export enum EnvironmentSecretType {
  FileBase64 = 'FILE_BASE64',
  String = 'STRING'
}

export enum EnvironmentVariableEnvironment {
  Development = 'DEVELOPMENT',
  Preview = 'PREVIEW',
  Production = 'PRODUCTION'
}

export enum EnvironmentVariableScope {
  Project = 'PROJECT',
  Shared = 'SHARED'
}

export enum EnvironmentVariableVisibility {
  Public = 'PUBLIC',
  Secret = 'SECRET',
  Sensitive = 'SENSITIVE'
}

export enum Experiment {
  Orbit = 'ORBIT'
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

export type FingerprintBuildsFilterInput = {
  channel?: InputMaybe<Scalars['String']>;
  developmentClient?: InputMaybe<Scalars['Boolean']>;
  distributions?: InputMaybe<Array<DistributionType>>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannel?: InputMaybe<Scalars['String']>;
  simulator?: InputMaybe<Scalars['Boolean']>;
};

export type FingerprintFilterInput = {
  hashes?: InputMaybe<Array<Scalars['String']>>;
};

export type FingerprintInfo = {
  fingerprintHash: Scalars['String'];
  fingerprintSource: FingerprintSourceInput;
};

export type FingerprintInfoGroup = {
  android?: InputMaybe<FingerprintInfo>;
  ios?: InputMaybe<FingerprintInfo>;
  web?: InputMaybe<FingerprintInfo>;
};

export type FingerprintSourceInput = {
  bucketKey?: InputMaybe<Scalars['String']>;
  isDebugFingerprint?: InputMaybe<Scalars['Boolean']>;
  type?: InputMaybe<FingerprintSourceType>;
};

export enum FingerprintSourceType {
  Gcs = 'GCS'
}

export type GenerateLogRocketOrganizationLinkingUrlInput = {
  accountId: Scalars['ID'];
  callbackUrl: Scalars['String'];
};

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

export enum GitHubBuildTriggerExecutionBehavior {
  Always = 'ALWAYS',
  BaseDirectoryChanged = 'BASE_DIRECTORY_CHANGED'
}

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

export enum GitHubJobRunTriggerRunStatus {
  Errored = 'ERRORED',
  Success = 'SUCCESS'
}

export enum GitHubJobRunTriggerType {
  PullRequestUpdated = 'PULL_REQUEST_UPDATED',
  PushToBranch = 'PUSH_TO_BRANCH'
}

export type GoogleServiceAccountKeyInput = {
  jsonKey: Scalars['JSONObject'];
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
  appStoreConnectApiKeyForBuildsId?: InputMaybe<Scalars['ID']>;
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

export type IosSubmissionConfigInput = {
  appleAppSpecificPassword?: InputMaybe<Scalars['String']>;
  appleIdUsername?: InputMaybe<Scalars['String']>;
  archiveUrl?: InputMaybe<Scalars['String']>;
  ascApiKey?: InputMaybe<AscApiKeyInput>;
  ascApiKeyId?: InputMaybe<Scalars['String']>;
  ascAppIdentifier: Scalars['String'];
  isVerboseFastlaneEnabled?: InputMaybe<Scalars['Boolean']>;
};

export enum JobRunPriority {
  High = 'HIGH',
  Normal = 'NORMAL'
}

export enum JobRunStatus {
  Canceled = 'CANCELED',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  InQueue = 'IN_QUEUE',
  New = 'NEW',
  PendingCancel = 'PENDING_CANCEL'
}

export type LinkLogRocketOrganizationToExpoAccountInput = {
  accountId: Scalars['ID'];
  client_id: Scalars['String'];
  client_secret: Scalars['String'];
  orgName: Scalars['String'];
  orgSlug: Scalars['String'];
  state: Scalars['String'];
};

export type LinkSharedEnvironmentVariableInput = {
  appId: Scalars['ID'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  environmentVariableId: Scalars['ID'];
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

export enum NotificationEvent {
  BuildComplete = 'BUILD_COMPLETE',
  BuildErrored = 'BUILD_ERRORED',
  BuildLimitThresholdExceeded = 'BUILD_LIMIT_THRESHOLD_EXCEEDED',
  BuildPlanCreditThresholdExceeded = 'BUILD_PLAN_CREDIT_THRESHOLD_EXCEEDED',
  SubmissionComplete = 'SUBMISSION_COMPLETE',
  SubmissionErrored = 'SUBMISSION_ERRORED',
  Test = 'TEST'
}

export type NotificationSubscriptionFilter = {
  accountId?: InputMaybe<Scalars['ID']>;
  appId?: InputMaybe<Scalars['ID']>;
  event?: InputMaybe<NotificationEvent>;
  type?: InputMaybe<NotificationType>;
};

export enum NotificationType {
  Email = 'EMAIL',
  Web = 'WEB'
}

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

export type PublishUpdateGroupInput = {
  awaitingCodeSigningInfo?: InputMaybe<Scalars['Boolean']>;
  branchId: Scalars['String'];
  environment?: InputMaybe<EnvironmentVariableEnvironment>;
  excludedAssets?: InputMaybe<Array<PartialManifestAsset>>;
  fingerprintInfoGroup?: InputMaybe<FingerprintInfoGroup>;
  gitCommitHash?: InputMaybe<Scalars['String']>;
  isGitWorkingTreeDirty?: InputMaybe<Scalars['Boolean']>;
  message?: InputMaybe<Scalars['String']>;
  rollBackToEmbeddedInfoGroup?: InputMaybe<UpdateRollBackToEmbeddedGroup>;
  rolloutInfoGroup?: InputMaybe<UpdateRolloutInfoGroup>;
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
  isLimitExceeded?: InputMaybe<Scalars['Boolean']>;
  isVerifiedBot?: InputMaybe<Scalars['Boolean']>;
  method?: InputMaybe<Array<RequestMethod>>;
  os?: InputMaybe<Array<UserAgentOs>>;
  pathname?: InputMaybe<Scalars['String']>;
  requestId?: InputMaybe<Array<Scalars['WorkerDeploymentRequestID']>>;
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

export type RuntimeFilterInput = {
  /** Only return runtimes shared with this branch */
  branchId?: InputMaybe<Scalars['String']>;
};

export type SsoUserDataInput = {
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
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
  EasUpdate = 'EAS_UPDATE',
  GithubApiRequests = 'GITHUB_API_REQUESTS',
  GithubWebhooks = 'GITHUB_WEBHOOKS'
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
  /** Required if the archive source type is GCS_BUILD_APPLICATION_ARCHIVE, GCS_BUILD_APPLICATION_ARCHIVE_ORCHESTRATOR or GCS_SUBMIT_ARCHIVE */
  bucketKey?: InputMaybe<Scalars['String']>;
  type: SubmissionArchiveSourceType;
  /** Required if the archive source type is URL */
  url?: InputMaybe<Scalars['String']>;
};

export enum SubmissionArchiveSourceType {
  GcsBuildApplicationArchive = 'GCS_BUILD_APPLICATION_ARCHIVE',
  GcsBuildApplicationArchiveOrchestrator = 'GCS_BUILD_APPLICATION_ARCHIVE_ORCHESTRATOR',
  GcsSubmitArchive = 'GCS_SUBMIT_ARCHIVE',
  Url = 'URL'
}

export type SubmissionFilter = {
  platform?: InputMaybe<AppPlatform>;
  status?: InputMaybe<SubmissionStatus>;
};

export enum SubmissionPriority {
  High = 'HIGH',
  Normal = 'NORMAL'
}

export enum SubmissionStatus {
  AwaitingBuild = 'AWAITING_BUILD',
  Canceled = 'CANCELED',
  Errored = 'ERRORED',
  Finished = 'FINISHED',
  InProgress = 'IN_PROGRESS',
  InQueue = 'IN_QUEUE'
}

export enum TargetEntityMutationType {
  Create = 'CREATE',
  Delete = 'DELETE',
  Update = 'UPDATE'
}

export type TimelineActivityFilterInput = {
  channels?: InputMaybe<Array<Scalars['String']>>;
  platforms?: InputMaybe<Array<AppPlatform>>;
  releaseChannels?: InputMaybe<Array<Scalars['String']>>;
  types?: InputMaybe<Array<ActivityTimelineProjectActivityType>>;
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

export type UpdateFilterInput = {
  fingerprintHash?: InputMaybe<Scalars['String']>;
  hasFingerprint?: InputMaybe<Scalars['Boolean']>;
  runtimeVersion?: InputMaybe<Scalars['String']>;
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

export type UserPreferencesInput = {
  onboarding?: InputMaybe<UserPreferencesOnboardingInput>;
  selectedAccountName?: InputMaybe<Scalars['String']>;
};

export type UserPreferencesOnboardingInput = {
  appId: Scalars['ID'];
  deviceType?: InputMaybe<OnboardingDeviceType>;
  environment?: InputMaybe<OnboardingEnvironment>;
  isCLIDone?: InputMaybe<Scalars['Boolean']>;
  lastUsed: Scalars['String'];
  platform?: InputMaybe<AppPlatform>;
};

export type WebNotificationUpdateReadStateInput = {
  id: Scalars['ID'];
  isRead: Scalars['Boolean'];
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

export enum WorkerDeploymentCrashKind {
  ExceededCpu = 'EXCEEDED_CPU',
  ExceededMemory = 'EXCEEDED_MEMORY',
  ExceededSubrequests = 'EXCEEDED_SUBREQUESTS',
  Generic = 'GENERIC',
  Internal = 'INTERNAL',
  ResponseStreamDisconnected = 'RESPONSE_STREAM_DISCONNECTED'
}

export enum WorkerDeploymentLogLevel {
  Debug = 'DEBUG',
  Error = 'ERROR',
  Fatal = 'FATAL',
  Info = 'INFO',
  Log = 'LOG',
  Warn = 'WARN'
}

export enum WorkerLoggerLevel {
  Debug = 'DEBUG',
  Error = 'ERROR',
  Fatal = 'FATAL',
  Info = 'INFO',
  Trace = 'TRACE',
  Warn = 'WARN'
}

export enum WorkflowJobStatus {
  ActionRequired = 'ACTION_REQUIRED',
  Canceled = 'CANCELED',
  Failure = 'FAILURE',
  InProgress = 'IN_PROGRESS',
  New = 'NEW',
  PendingCancel = 'PENDING_CANCEL',
  Skipped = 'SKIPPED',
  Success = 'SUCCESS'
}

export enum WorkflowJobType {
  AppleDeviceRegistrationRequest = 'APPLE_DEVICE_REGISTRATION_REQUEST',
  Build = 'BUILD',
  Custom = 'CUSTOM',
  Deploy = 'DEPLOY',
  GetBuild = 'GET_BUILD',
  MaestroTest = 'MAESTRO_TEST',
  RequireApproval = 'REQUIRE_APPROVAL',
  Submission = 'SUBMISSION',
  Update = 'UPDATE'
}

export type WorkflowProjectSourceInput = {
  easJsonBucketKey: Scalars['String'];
  packageJsonBucketKey?: InputMaybe<Scalars['String']>;
  projectArchiveBucketKey: Scalars['String'];
  type: WorkflowProjectSourceType;
};

export enum WorkflowProjectSourceType {
  Gcs = 'GCS'
}

export type WorkflowRevisionInput = {
  fileName: Scalars['String'];
  yamlConfig: Scalars['String'];
};

export type WorkflowRunInput = {
  projectSource: WorkflowProjectSourceInput;
};

export enum WorkflowRunStatus {
  ActionRequired = 'ACTION_REQUIRED',
  Canceled = 'CANCELED',
  Failure = 'FAILURE',
  InProgress = 'IN_PROGRESS',
  New = 'NEW',
  PendingCancel = 'PENDING_CANCEL',
  Success = 'SUCCESS'
}

export enum WorkflowRunTriggerEventType {
  Github = 'GITHUB',
  Manual = 'MANUAL'
}

export type AppByIdQueryVariables = Exact<{
  appId: Scalars['String'];
}>;


export type AppByIdQuery = { __typename?: 'RootQuery', app: { __typename?: 'AppQuery', byId: { __typename?: 'App', id: string, scopeKey: string, ownerAccount: { __typename?: 'Account', id: string, name: string } } } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'RootQuery', meActor?: { __typename: 'Robot', firstName?: string | null, id: string, accounts: Array<{ __typename?: 'Account', id: string, users: Array<{ __typename?: 'UserPermission', permissions: Array<Permission>, actor: { __typename?: 'Robot', id: string } | { __typename?: 'SSOUser', id: string } | { __typename?: 'User', id: string } }> }> } | { __typename: 'SSOUser', username: string, id: string, primaryAccount: { __typename?: 'Account', id: string }, accounts: Array<{ __typename?: 'Account', id: string, users: Array<{ __typename?: 'UserPermission', permissions: Array<Permission>, actor: { __typename?: 'Robot', id: string } | { __typename?: 'SSOUser', id: string } | { __typename?: 'User', id: string } }> }> } | { __typename: 'User', username: string, id: string, primaryAccount: { __typename?: 'Account', id: string }, accounts: Array<{ __typename?: 'Account', id: string, users: Array<{ __typename?: 'UserPermission', permissions: Array<Permission>, actor: { __typename?: 'Robot', id: string } | { __typename?: 'SSOUser', id: string } | { __typename?: 'User', id: string } }> }> } | null };

export type AppFragment = { __typename?: 'App', id: string, scopeKey: string, ownerAccount: { __typename?: 'Account', id: string, name: string } };
