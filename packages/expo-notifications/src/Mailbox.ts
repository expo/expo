import { EventEmitter as NativeEventEmitter, NativeModulesProxy } from '@unimodules/core';
import {
  ForegroundNotification,
  OnUserInteractionListener,
  OnForegroundNotificationListener,
  UserInteraction,
  OnTokenChangeListener,
  TokenMessage,
  Subscription,
} from './Notifications.types';

const { ExpoNotifications } = NativeModulesProxy;
const DeviceEventEmitter = new NativeEventEmitter(ExpoNotifications);

export class Mailbox {
  private onUserInteractionListeners: Map<number, OnUserInteractionListener>;
  private onForegroundNotificationListeners: Map<number, OnForegroundNotificationListener>;
  private onTokenChangeListener: OnTokenChangeListener | null;
  private lastId: number = 0; 

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

  getNextId(): number {
    return this.lastId++;
  }

  createSubscription<T>(id: number, map: Map<number, T>): Subscription {
    return {
      remove(): void {
        map.delete(id);
      }
    };
  }

  addOnUserInteractionListener(listener: OnUserInteractionListener): Subscription {
    const id = this.lastId;
    this.onUserInteractionListeners.set(id, listener);
    return this.createSubscription<OnUserInteractionListener>(id, this.onUserInteractionListeners);
  }

  addOnForegroundNotificationListener(listener: OnForegroundNotificationListener): Subscription {
    const id = this.lastId;
    this.onForegroundNotificationListeners.set(id, listener);
    return this.createSubscription<OnForegroundNotificationListener>(id, this.onForegroundNotificationListeners);
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
