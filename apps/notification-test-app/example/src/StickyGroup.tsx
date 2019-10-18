import * as Notifications from 'expo-notifications';

function createNotification(title) {
    return {
        title,
        body: "the best body for notification",
        sound: true,
        sticky: true,
    };
}

var stickyNotificationId = null;

export default function getStickyGroupButtonList() {
    return [
        {
            title: "present sticky local notification",
            onPush:
                async function () {
                    stickyNotificationId = await Notifications.presentLocalNotificationAsync(
                        createNotification(this.title),
                    );
                }
            ,
        },
        {
            title: "dismiss this sticky notification",
            onPush:
                async function () {
                    Notifications.dismissNotificationAsync(stickyNotificationId);
                }
            ,
        },
        {
            title: "dismiss all sticky notifications",
            onPush:
                async function () {
                    Notifications.dismissAllNotificationsAsync();
                }
            ,
        },
    ];
};
