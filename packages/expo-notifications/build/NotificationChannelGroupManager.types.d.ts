import { NotificationChannel } from './NotificationChannelManager.types';
export interface NotificationChannelGroup {
    id: string;
    name: string | null;
    description?: string | null;
    isBlocked?: boolean;
    channels: NotificationChannel[];
}
export interface NotificationChannelGroupInput {
    name: string | null;
    description?: string | null;
}
