import App from './app';
import { FirebaseOptions } from './types';
import { AnalyticsModule, AuthModule, ConfigModule, CrashlyticsModule, DatabaseModule, FirestoreModule, FunctionsModule, InstanceIdModule, InvitesModule, LinksModule, MessagingModule, NotificationsModule, PerformanceModule, StorageModule, UtilsModule } from './module.types';
declare class Firebase {
    analytics: AnalyticsModule;
    auth: AuthModule;
    config: ConfigModule;
    crashlytics: CrashlyticsModule;
    database: DatabaseModule;
    firestore: FirestoreModule;
    functions: FunctionsModule;
    iid: InstanceIdModule;
    invites: InvitesModule;
    links: LinksModule;
    messaging: MessagingModule;
    notifications: NotificationsModule;
    perf: PerformanceModule;
    storage: StorageModule;
    utils: UtilsModule;
    constructor();
    /**
     * Web SDK initializeApp
     *
     * @param options
     * @param name
     * @return {*}
     */
    initializeApp(options: FirebaseOptions, name: string): App;
    /**
     * Retrieves a Firebase app instance.
     *
     * When called with no arguments, the default app is returned.
     * When an app name is provided, the app corresponding to that name is returned.
     *
     * @param name
     * @return {*}
     */
    app(name?: string): App;
    /**
     * A (read-only) array of all initialized apps.
     * @return {Array}
     */
    readonly apps: App[];
    /**
     * The current SDK version.
     * @return {string}
     */
    readonly SDK_VERSION: string;
}
declare const _default: Firebase;
export default _default;
