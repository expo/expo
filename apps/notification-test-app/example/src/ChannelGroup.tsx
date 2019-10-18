import * as Notifications from 'expo-notifications';

function createNotification(title, channelId) {
    return {
        title,
        body: "the best body for notification",
        channelId,
    };
}

export default function getChannelButtonList() {
    return [
        {
            title: "create group",
            onPush:
                async function () {
                    Notifications.createChannelGroupAsync("first","first name");
                }
            ,
        },
        {
            title: "delete group",
            onPush:
                async function () {
                    Notifications.deleteChannelGroupAsync("first");
                }
            ,
        },
        {
            title: "create channel with group",
            onPush:
                async function () {
                    Notifications.createChannelAsync(
                        "first channel",
                        {
                            name: "first channel name",
                            description: "channel description",
                            sound: true,
                            priority: 5,
                            vibrate: [0, 250, 250, 250],
                            badge: true,
                            groupId: "first",
                        },
                    );
                }
            ,
        },
        {
            title: "delete channel with group",
            onPush:
                async function () {
                    let date = new Date(Date.now() + 2 * 60 * 1000);
                    Notifications.deleteChannelAsync("first channel");
                }
            ,
        },
        {
            title: "present local notification with channel",
            onPush:
                async function () {
                    let interval = 2 * 60 * 1000;
                    Notifications.presentLocalNotificationAsync(
                        createNotification(this.title, "first channel"),
                    );
                }
            ,
        },
    ];
};
