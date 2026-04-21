import { Platform } from 'react-native';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

const calendarTopLevelScreens = [
  {
    name: 'CalendarsNextList',
    route: 'calendar@next/calendars',
    getComponent() {
      return optionalRequire(() => require('./CalendarsNextScreen'));
    },
  },
];

if (Platform.OS === 'ios') {
  calendarTopLevelScreens.push({
    name: 'WriteOnly Permissions',
    route: 'calendar@next/write-only-permissions',
    getComponent() {
      return optionalRequire(() => require('./WriteOnlyPermissionsScreen'));
    },
  });
}

export const CalendarNextScreens = [
  ...calendarTopLevelScreens,
  {
    name: 'EventsNext',
    route: 'events-next',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./EventsNextScreen'));
    },
  },
  {
    name: 'RemindersNext',
    route: 'reminders-next',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./RemindersNextScreen'));
    },
  },
];

export default function CalendarNextScreen() {
  const apis = apiScreensToListElements(calendarTopLevelScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
