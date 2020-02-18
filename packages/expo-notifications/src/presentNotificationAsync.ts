import { UnavailabilityError, Platform } from '@unimodules/core';
import uuidv4 from 'uuid/v4';

import NotificationPresenter from './NotificationPresenter';
import {
  BaseNotificationRequest,
  IosNotificationRequestOptions as IosRequestOptions,
  AndroidNotificationRequestOptions as AndroidRequestOptions,
} from './NotificationPresenter.types';

// We will let developers pass in body as an object
// and we will stringify it before passing to native
interface EasyBodyBaseNotificationRequest extends Omit<BaseNotificationRequest, 'body'> {
  body?: { [key: string]: any };
}

type IosNotificationRequest = Partial<EasyBodyBaseNotificationRequest> & IosRequestOptions;
type AndroidNotificationRequest = Partial<EasyBodyBaseNotificationRequest> & AndroidRequestOptions;
type PlatformSpecificRequest = IosNotificationRequest | AndroidNotificationRequest;

export type NotificationRequest = EasyBodyBaseNotificationRequest & {
  identifier?: string;
  ios?: IosNotificationRequest;
  android?: AndroidNotificationRequest;
};

export default async function presentNotificationAsync({
  identifier,
  ...notification
}: NotificationRequest): Promise<void> {
  if (!NotificationPresenter.presentNotificationAsync) {
    throw new UnavailabilityError('Notifications', 'presentNotificationAsync');
  }

  // If identifier has not been provided, let's create one.
  const notificationIdentifier = identifier ?? uuidv4();

  // Remember current platform-specific options
  const platformSpecificOptions: PlatformSpecificRequest = notification[Platform.OS] ?? {};
  // Remove all known platform-specific options
  const { ios, android, ...baseRequest } = notification;
  // Merge current platform-specific options
  const easyBodyNotificationSpec = { ...baseRequest, ...platformSpecificOptions };
  // Stringify `body`
  const { body, ...restNotificationSpec } = easyBodyNotificationSpec;
  const notificationSpec = { ...restNotificationSpec, body: JSON.stringify(body) };

  return await NotificationPresenter.presentNotificationAsync(
    notificationIdentifier,
    notificationSpec
  );
}
