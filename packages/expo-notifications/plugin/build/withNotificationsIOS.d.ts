import { ConfigPlugin, XcodeProject } from '@expo/config-plugins';
import { NotificationsPluginProps } from './withNotifications';
export declare const withNotificationsIOS: ConfigPlugin<NotificationsPluginProps>;
export declare const withNotificationSounds: ConfigPlugin<{
    sounds: string[];
}>;
/**
 * Save sound files to the Xcode project root and add them to the Xcode project.
 */
export declare function setNotificationSounds(projectRoot: string, { sounds, project, projectName, }: {
    sounds: string[];
    project: XcodeProject;
    projectName: string | undefined;
}): XcodeProject;
