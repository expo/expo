import { ProxyNativeModule } from 'expo-modules-core';
export declare enum AndroidNotificationVisibility {
    UNKNOWN = 0,
    PUBLIC = 1,
    PRIVATE = 2,
    SECRET = 3
}
export declare enum AndroidAudioContentType {
    UNKNOWN = 0,
    SPEECH = 1,
    MUSIC = 2,
    MOVIE = 3,
    SONIFICATION = 4
}
export declare enum AndroidImportance {
    UNKNOWN = 0,
    UNSPECIFIED = 1,
    NONE = 2,
    MIN = 3,
    LOW = 4,
    DEFAULT = 5,
    HIGH = 6,
    MAX = 7
}
export declare enum AndroidAudioUsage {
    UNKNOWN = 0,
    MEDIA = 1,
    VOICE_COMMUNICATION = 2,
    VOICE_COMMUNICATION_SIGNALLING = 3,
    ALARM = 4,
    NOTIFICATION = 5,
    NOTIFICATION_RINGTONE = 6,
    NOTIFICATION_COMMUNICATION_REQUEST = 7,
    NOTIFICATION_COMMUNICATION_INSTANT = 8,
    NOTIFICATION_COMMUNICATION_DELAYED = 9,
    NOTIFICATION_EVENT = 10,
    ASSISTANCE_ACCESSIBILITY = 11,
    ASSISTANCE_NAVIGATION_GUIDANCE = 12,
    ASSISTANCE_SONIFICATION = 13,
    GAME = 14
}
export interface AudioAttributes {
    usage: AndroidAudioUsage;
    contentType: AndroidAudioContentType;
    flags: {
        enforceAudibility: boolean;
        requestHardwareAudioVideoSynchronization: boolean;
    };
}
export type AudioAttributesInput = Partial<AudioAttributes>;
/**
 * An object which represents a notification channel.
 * @platform android
 */
export interface NotificationChannel {
    id: string;
    name: string | null;
    importance: AndroidImportance;
    bypassDnd: boolean;
    description: string | null;
    groupId?: string | null;
    lightColor: string;
    lockscreenVisibility: AndroidNotificationVisibility;
    showBadge: boolean;
    sound: 'default' | 'custom' | null;
    audioAttributes: AudioAttributes;
    vibrationPattern: number[] | null;
    enableLights: boolean;
    enableVibrate: boolean;
}
export type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;
/**
 * An object which represents a notification channel to be set.
 * @platform android
 */
export type NotificationChannelInput = RequiredBy<Omit<NotificationChannel, 'id' | 'audioAttributes' | 'sound'> & {
    audioAttributes?: AudioAttributesInput;
    sound?: string | null;
}, 'name' | 'importance'>;
export interface NotificationChannelManager extends ProxyNativeModule {
    getNotificationChannelsAsync?: () => Promise<NotificationChannel[] | null>;
    getNotificationChannelAsync?: (channelId: string) => Promise<NotificationChannel | null>;
    setNotificationChannelAsync?: (channelId: string, channelConfiguration: NotificationChannelInput) => Promise<NotificationChannel | null>;
    deleteNotificationChannelAsync?: (channelId: string) => Promise<void>;
}
//# sourceMappingURL=NotificationChannelManager.types.d.ts.map