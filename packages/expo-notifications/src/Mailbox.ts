import { EventEmitter as NativeEventEmitter, NativeModulesProxy } from '@unimodules/core';
import {
  ForegroundNotification,
  OnUserInteractionListener,
  OnForegroundNotificationListener,
  UserInteraction,
  OnTokenChangeListener,
  TokenMessage,
} from './Notifications.types';

const { ExpoNotifications } = NativeModulesProxy;
const DeviceEventEmitter = new NativeEventEmitter(ExpoNotifications);

export class Mailbox {
  private onUserInteractionListeners: Map<string, OnUserInteractionListener>;
  private onForegroundNotificationListeners: Map<string, OnForegroundNotificationListener>;
  private onTokenChangeListener: OnTokenChangeListener | null;

  constructor() {
    this.onUserInteractionListeners = new Map();
    this.onForegroundNotificationListeners = new Map();
    this.onTokenChangeListener = null;
    DeviceEventEmitter.addListener(
      'Expo.onUserInteraction',
      this.onUserInteraction.bind(this)
    );
    DeviceEventEmitter.addListener(
      'Expo.onForegroundNotification',
      this.onForegroundNotification.bind(this)
    );
    DeviceEventEmitter.addListener(
      'Expo.onTokenChange',
      this.onTokenChange.bind(this)
    );
  }

  addOnUserInteractionListener(listenerName: string, listener: OnUserInteractionListener) {
    this.onUserInteractionListeners.set(listenerName, listener);
  }

  addOnForegroundNotificationListener(
    listenerName: string,
    listener: OnForegroundNotificationListener
  ) {
    this.onForegroundNotificationListeners.set(listenerName, listener);
  }

  removeOnUserInteractionListener(listenerName: string) {
    this.onUserInteractionListeners.delete(listenerName);
  }

  removeOnForegroundNotificationListener(listenerName: string) {
    this.onForegroundNotificationListeners.delete(listenerName);
  }

  setOnTokenChangeListener(onTokenChangeListner: OnTokenChangeListener): void {
    this.onTokenChangeListener = onTokenChangeListner;
  }

  private async onForegroundNotification(notification: ForegroundNotification) {
    for (let listener of this.onForegroundNotificationListeners.values()) {
      await listener(notification);
    }
  }

  private async onUserInteraction(userInteraction: UserInteraction) {
    for (let listener of this.onUserInteractionListeners.values()) {
      await listener(userInteraction);
    }
  }

  private async onTokenChange(tokenMessage: TokenMessage) {
    if (this.onTokenChangeListener != null) {
      await this.onTokenChangeListener(tokenMessage.token);
    }
  }
}
