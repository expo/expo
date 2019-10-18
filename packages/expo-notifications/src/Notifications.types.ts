export type Notification = {
  origin: 'selected' | 'received';
  data: any;
  remote: boolean;
  isMultiple: boolean;
};

export type LocalNotification = {
  title: string;
  // How should we deal with body being required on iOS but not on Android?
  body?: string;
  data?: any;
  categoryId?: string;
  ios?: {
    sound?: boolean;
    _displayInForeground?: boolean;
  };
  android?: {
    channelId?: string;
    icon?: string;
    color?: string;
    sticky?: boolean;
    link?: string;
  };
  web?: NotificationOptions;
  remote?: boolean;
};

export type Channel = {
  name: string;
  description?: string;
  priority?: string;
  sound?: boolean;
  vibrate?: boolean | number[];
  badge?: boolean;
};

export type ActionType = {
  actionId: string;
  buttonTitle: string;
  isDestructive?: boolean;
  isAuthenticationRequired?: boolean;
  doNotOpenInForeground?: boolean;
  textInput?: {
    submitButtonTitle: string;
    placeholder: string;
  };
};

export type UserInteraction = LocalNotification & {
    actionId?: string;
    userText?: string;
}

export type TokenMessage = {
  token: string;
}

export type OnUserInteractionListener = (userInteraction: UserInteraction) => void;

export type OnForegroundNotificationListener = (notification: LocalNotification) => void;

export type OnTokenChangeListener = (token: string) => void;
