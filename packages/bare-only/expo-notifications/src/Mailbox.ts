import { EventEmitter as NativeEventEmitter, NativeModulesProxy } from '@unimodules/core';
import {
  OnUserInteractionListener,
  OnForegroundNotificationListener,
  UserInteraction,
  LocalNotification,
  OnTokenChangeListener,
  TokenMessage,
} from './Notifications.types';

const { ExponentNotifications } = NativeModulesProxy;
const DeviceEventEmitter = new NativeEventEmitter(ExponentNotifications);

export class Mailbox {
  private onUserInteractionListeners: Map<string, OnUserInteractionListener>;
  private onForegroundNotificationListeners: Map<string, OnForegroundNotificationListener>;
  private onTokenChangeListener: OnTokenChangeListener | null;

  constructor() {
    this.onUserInteractionListeners = new Map();
    this.onForegroundNotificationListeners = new Map();
    this.onTokenChangeListener = null;
    DeviceEventEmitter.addListener(
      'Exponent.onUserInteraction',
      this.onUserInteraction.bind(this)
    );
    DeviceEventEmitter.addListener(
      'Exponent.onForegroundNotification',
      this.onForegroundNotification.bind(this)
    );
    DeviceEventEmitter.addListener(
      'Exponent.onTokenChange',
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

  setOnTokenChangeListener(onTokenChangeListner: OnTokenChangeListener) {
    this.onTokenChangeListener = onTokenChangeListner;
  }

  private onForegroundNotification(notification: LocalNotification) {
    for (let listener of this.onForegroundNotificationListeners.values()) {
      listener(notification);
    }
  }

  private onUserInteraction(userInteraction: UserInteraction) {
    for (let listener of this.onUserInteractionListeners.values()) {
      listener(userInteraction);
    }
  }

  private onTokenChange(tokenMessage: TokenMessage) {
    if (this.onTokenChangeListener != null) {
      this.onTokenChangeListener(tokenMessage.token);
    }
  }
}
