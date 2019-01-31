export type AdMobModule = any;

/* Analytics types */

export type AnalyticsModule = any;

/* Remote Config types */

export type ConfigModule = any;

/* Auth types */

export type AuthModule = any;

/* Crashlytics types */
export type CrashlyticsModule = any;

/* Database types */

export type DatabaseModule = any;

export type DatabaseModifier = {
  id: string;
  type: 'orderBy' | 'limit' | 'filter';
  name?: string;
  key?: string;
  limit?: number;
  value?: any;
  valueType?: string;
};

/* Firestore types */

export type FirestoreModule = any;

/* Functions types */

export type FunctionsModule = any;

/* InstanceId types */

export type InstanceIdModule = any;

/* Invites types */

export type InvitesModule = any;

/* Links types */

export type LinksModule = any;

/* Messaging types */

export type MessagingModule = any;

/* Notifications types */

export type NotificationsModule = any;

/* Performance types */

export type PerformanceModule = any;

/* Storage types */

export type StorageModule = any;

/* Utils types */

export type UtilsModule = any;
