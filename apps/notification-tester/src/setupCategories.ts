import { setNotificationCategoryAsync } from 'expo-notifications';

export const setupCategories = () => {
  return setNotificationCategoryAsync('submit_reply_placeholder', [
    {
      identifier: 'reply',
      buttonTitle: 'Reply',
      textInput: {
        submitButtonTitle: 'Reply',
        placeholder: 'Type a reply...',
      },
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'quickAction',
      buttonTitle: 'quickAction',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'openToForeground',
      buttonTitle: 'openToForeground',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
};
