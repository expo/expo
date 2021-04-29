import { ConfigPlugin } from '@expo/config-plugins';
import { NotificationsPluginProps } from './withNotifications';
declare type XcodeProject = any;
export declare const withNotificationsIOS: ConfigPlugin<NotificationsPluginProps>;
export declare const withNotificationSounds: ConfigPlugin<{
    sounds: string[];
}>;
/**
 * Save sound files to the Xcode project root and add them to the Xcode project.
 */
export declare function setNotificationSounds(sounds: string[], { projectRoot, project }: {
    project: XcodeProject;
    projectRoot: string;
}): XcodeProject;
export {};
