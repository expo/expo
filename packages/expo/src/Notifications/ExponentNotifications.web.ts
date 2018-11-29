export default {
  async getExponentPushTokenAsync(): Promise<void> {},
  async getDevicePushTokenAsync(config: { [key: string]: any }): Promise<void> {},
  async createChannel(channelId: string, channel: string): Promise<void> {},
  async deleteChannel(channelId: string): Promise<void> {},
  async presentLocalNotification(notification: any): Promise<void> {},
  async presentLocalNotificationWithChannel(notification: any, channelId: string): Promise<void> {},
  async scheduleLocalNotification(
    notification: any,
    options: { [key: string]: any }
  ): Promise<void> {},
  async scheduleLocalNotificationWithChannel(
    notification: any,
    options: { [key: string]: any },
    channelId: string
  ): Promise<void> {},
  async dismissNotification(notificationId: string): Promise<void> {},
  async dismissAllNotifications(): Promise<void> {},
  async cancelScheduledNotification(notificationId: string): Promise<void> {},
  async cancelAllScheduledNotifications(): Promise<void> {},
  //   getBadgeNumberAsync(): Promise<void> {},
  //   setBadgeNumberAsync(badgeNumber: number): Promise<void> {},
};
