import DeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import {
  OnUserInteractionListener,
  OnForegroundNotificationListener,
  UserInteraction,
  LocalNotification,
} from './Notifications.types';

export class Mailbox {
  private onUserInteractionListeners: Map<string, OnUserInteractionListener>;
  private onForegroundNotificationListeners: Map<string, OnForegroundNotificationListener>;

  constructor() {
    this.onUserInteractionListeners = new Map();
    this.onForegroundNotificationListeners = new Map();
    DeviceEventEmitter.addListener(
      'Exponent.onUserInteraction',
      this.onUserInteraction.bind(this)
    );
    DeviceEventEmitter.addListener(
      'Exponent.onForegroundNotification',
      this.onForegroundNotification.bind(this)
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
}
