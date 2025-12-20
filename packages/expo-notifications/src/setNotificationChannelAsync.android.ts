import { UnavailabilityError } from 'expo-modules-core';

import NotificationChannelManager from './NotificationChannelManager';
import {
  NotificationChannelInput,
  NotificationChannel,
  AndroidImportance,
} from './NotificationChannelManager.types';

export default async function setNotificationChannelAsync(
  channelId: string,
  channel: NotificationChannelInput
): Promise<NotificationChannel | null> {
  if (!NotificationChannelManager.setNotificationChannelAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationChannelAsync');
  }

  if (channel?.importance === AndroidImportance.UNSPECIFIED) {
    console.warn(
      `Warning: You are setting the importance of the notification channel "${channelId}" to "UNSPECIFIED". ` +
        `This may lead to errors on some Android versions. ` +
        `It's recommended to instead use AndroidImportance.DEFAULT.`
    );
  }
  return await NotificationChannelManager.setNotificationChannelAsync(channelId, channel);
}
