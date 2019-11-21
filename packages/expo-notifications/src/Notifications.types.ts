export type Notification = {
  title: string;
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
    exact?: boolean;
  };
  web?: NotificationOptions;
  remote?: boolean;
};

export type ForegroundNotification = Notification & {
  remote: boolean;
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

export type UserInteraction = Notification & {
    actionId?: string;
    userText?: string;
}

export type TokenMessage = {
  token: string;
}

export type OnUserInteractionListener = (userInteraction: UserInteraction) => Promise<void>;

export type OnForegroundNotificationListener = (notification: ForegroundNotification) => Promise<void>;

export type OnTokenChangeListener = (token: string) => Promise<void>;
