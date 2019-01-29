// import { NotificationOpen } from '../../build';
type NotificationOpen = any;

export default async (notificationOpen: NotificationOpen): Promise<void> => {
  if (notificationOpen.action === 'snooze') {
    // handle the action
  }

  console.log('baconground.actions', notificationOpen);
};
