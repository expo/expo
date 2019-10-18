import * as Notifications from 'expo-notifications';

function createNotification(title, categoryId) {
    return {
        title,
        body: "the best body for notification",
        sound: true,
        categoryId,
    };
}

export default function getCategoryButtonslist() {
    return [
        {
            title: "create category",
            onPush:
                async function () {
                    Notifications.createCategoryAsync(
                        "testCategory",
                        [
                            {
                                actionId: "first",
                                buttonTitle: "firstTitle",
                            },
                            {
                                actionId: "second",
                                buttonTitle: "secondTitle",
                                textInput: {
                                    submitButtonTitle: "submit title",
                                    placeholder: "oooo",
                                },
                            },
                        ],
                    );
                }
            ,
        },
        {
            title: "delete category",
            onPush:
                async function () {
                    Notifications.deleteCategoryAsync("testCategory");
                }
            ,
        },
        {
            title: "present notification with category",
            onPush:
                async function () {
                    Notifications.presentLocalNotificationAsync(
                        createNotification(this.title, "testCategory")
                    );
                }
            ,
        },
    ];
};
