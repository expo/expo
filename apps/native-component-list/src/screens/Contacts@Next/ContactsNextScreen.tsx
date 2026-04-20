import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

export const ContactsNextScreens = [
  {
    name: 'Form',
    route: 'contacts@next/form',
    getComponent() {
      return optionalRequire(() => require('./ContactsNextFormScreen'));
    },
  },
  {
    name: 'Query Contacts',
    route: 'contacts@next/query',
    getComponent() {
      return optionalRequire(() => require('./ContactsNextQueryScreen'));
    },
  },
  {
    name: 'Intents (Pickers & Forms)',
    route: 'contacts@next/intents',
    getComponent() {
      return optionalRequire(() => require('./ContactsNextIntentsScreen'));
    },
  },
];

export default function ContactsNextScreen() {
  const apis = apiScreensToListElements(ContactsNextScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
