import { setNotificationCategoryAsync } from 'expo-notifications';

import { CATEGORY_ID } from './misc/constants';

export const setupCategories = () => {
  return setNotificationCategoryAsync(CATEGORY_ID, [
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
