import 'expo-router/entry';

import * as Notifications from 'expo-notifications';
import { Action, setItems } from 'expo-quick-actions';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Mock quick actions

const items: Action[] = [
  {
    id: '0',
    title: 'View Orders',
    subtitle: '3 New Orders',
    icon: 'symbol:mail.stack',
  },
  {
    id: '3',
    title: 'Check out',
    subtitle: '14 Items',
    icon: 'symbol:cart',
  },
  {
    id: '1',
    title: 'Search',
    icon: 'search',
  },
  {
    id: '2',
    title: 'View Profile',
    icon: 'symbol:person.2',
  },
];

setItems(items);
