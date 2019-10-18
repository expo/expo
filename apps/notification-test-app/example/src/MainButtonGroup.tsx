import * as Notifications from 'expo-notifications';

function createNotification(title) {
    return {
        title,
        body: "the best body for notification",
        sound: true,
    };
}

export default function getMainButtonList() {
    return [
        {
            title: "Present local notification",
            onPush:
                async function () {
                    Notifications.presentLocalNotificationAsync(
                        createNotification(this.title),
                    );
                }
            ,
        },
        {
            title: "schedule local notification every minute (calendar)",
            onPush:
                async function () {
                    Notifications.scheduleNotificationWithCalendarAsync(
                        createNotification(this.title),
                        {
                            second:1,
                            repeat: true,
                        }
                    );
                }
            ,
        },
        {
            title: "schedule local notification every 10s (timer)",
            onPush:
                async function () {
                    Notifications.scheduleNotificationWithTimerAsync(
                        createNotification(this.title),
                        {
                            interval:10000,
                            repeat: true,
                        }
                    );
                }
            ,
        },
        {
            title: "schedule local notification 2 min from now (calendar)",
            onPush:
                async function () {
                    let date = new Date(Date.now() + 2 * 60 * 1000);
                    Notifications.scheduleNotificationWithCalendarAsync(
                        createNotification(this.title),
                        {
                            day:date.getDate(),
                            hour:date.getHours(),
                            minute:date.getMinutes(),
                            second:date.getSeconds(),
                            repeat: false,
                        }
                    );
                }
            ,
        },
        {
            title: "schedule local notification 5s from now (timer)",
            onPush:
                async function () {
                    let interval = 5 * 1000;
                    Notifications.scheduleNotificationWithTimerAsync(
                        createNotification(this.title),
                        {
                            interval,
                            repeat: false,
                        }
                    );
                }
            ,
        },
        {
            title: "cancel all notifcations",
            onPush:
                async function () {
                   Notifications.cancelAllScheduledNotificationsAsync();
                }
            ,
        },
        {
            title: "schedule notification 10s from now and then cancel right away",
            onPush:
                async function () {
                    let interval = 10 * 1000;
                    let id = await Notifications.scheduleNotificationWithTimerAsync(
                        createNotification(this.title),
                        {
                            interval,
                            repeat: false,
                        }
                    );
                    Notifications.cancelScheduledNotificationAsync(id);
                }
            ,
        },
    ];
};
