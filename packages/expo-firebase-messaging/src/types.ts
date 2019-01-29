/**
 * @flow
 */
export type Notification = {
  body: string,
  bodyLocalizationArgs?: string[],
  bodyLocalizationKey?: string,
  clickAction?: string,
  color?: string,
  icon?: string,
  link?: string,
  sound: string,
  subtitle?: string,
  tag?: string,
  title: string,
  titleLocalizationArgs?: string[],
  titleLocalizationKey?: string,
};

export type NativeInboundRemoteMessage = {
  collapseKey?: string,
  data: { [string]: string },
  from?: string,
  messageId: string,
  messageType?: string,
  sentTime?: number,
  to?: string,
  ttl?: number,
};

export type NativeOutboundRemoteMessage = {
  collapseKey?: string,
  data: { [string]: string },
  messageId: string,
  messageType?: string,
  to: string,
  ttl: number,
};
