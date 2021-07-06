import NotificationCategoriesModule from '../NotificationCategoriesModule.native';
import deleteNotificationCategoryAsync from '../deleteNotificationCategoryAsync';
import getNotificationCategoriesAsync from '../getNotificationCategoriesAsync';
import setNotificationCategoryAsync from '../setNotificationCategoryAsync';

it(`setNotificationCategoryAsync accepts the expected arguments`, async () => {
  await setNotificationCategoryAsync(
    'my-category-id',
    [
      {
        identifier: 'actionId',
        buttonTitle: 'click me',
        textInput: { submitButtonTitle: 'submit', placeholder: 'tests are good' },
        options: {
          opensAppToForeground: false,
          isAuthenticationRequired: true,
          isDestructive: true,
        },
      },
    ],
    {
      previewPlaceholder: 'this is just a placeholder',
      intentIdentifiers: ['myIntentIdentifier'],
      categorySummaryFormat: 'formatString',
      customDismissAction: true,
      allowInCarPlay: true,
      showTitle: true,
      showSubtitle: true,
      allowAnnouncement: true,
    }
  );
  expect(NotificationCategoriesModule.setNotificationCategoryAsync).toHaveBeenLastCalledWith(
    'my-category-id',
    [
      {
        identifier: 'actionId',
        buttonTitle: 'click me',
        textInput: { submitButtonTitle: 'submit', placeholder: 'tests are good' },
        options: {
          opensAppToForeground: false,
          isAuthenticationRequired: true,
          isDestructive: true,
        },
      },
    ],
    {
      previewPlaceholder: 'this is just a placeholder',
      intentIdentifiers: ['myIntentIdentifier'],
      categorySummaryFormat: 'formatString',
      customDismissAction: true,
      allowInCarPlay: true,
      showTitle: true,
      showSubtitle: true,
      allowAnnouncement: true,
    }
  );
});

it('deleteNotificationCategoryAsync accepts the expected argument', async () => {
  await deleteNotificationCategoryAsync('my-category-id');
  expect(NotificationCategoriesModule.deleteNotificationCategoryAsync).toHaveBeenLastCalledWith(
    'my-category-id'
  );
});

it('getNotificationCategoriesAsync accepts the expected argument', async () => {
  await getNotificationCategoriesAsync();
  expect(NotificationCategoriesModule.getNotificationCategoriesAsync).toHaveBeenLastCalledWith();
});
