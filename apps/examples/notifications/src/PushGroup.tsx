import * as Notifications from 'expo-notifications';

function createNotification(title) {
    return {
        title,
        body: "the best body for notification",
        channelId: "first channel",
        _categoryId: "test category",
    };
}

var pushToken = null;
const PUSH_ENDPOINT = 'https://expo.io/--/api/v2/push/send';

export default function getPushButtonList() {
    return [
        {
            title: "register for push notifications",
            onPush:
                async function () {
                    Notifications.setOnTokenChangeListener(
                        (token: string) => {
                            console.log("your new token: ", token);
                            pushToken = token;
                        }
                    );
                }
            ,
        },
        {
            title: "send push notification with channel and category (channel and category have to be added already)[expo engine]",
            onPush:
                async function () {
                    alert('in Expo client we need to scope');
                    const response = await fetch(PUSH_ENDPOINT, {
                        method: 'POST',
                        headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify([
                          {
                            to: pushToken,
                            ...createNotification(this.title),
                          },
                        ]),
                    });
                }
            ,
        },
    ];
};
