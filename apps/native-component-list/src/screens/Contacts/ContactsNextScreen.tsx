import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

export const ContactsScreens = [
  {
    name: 'Form',
    route: 'contacts/form',
    getComponent() {
      return optionalRequire(() => require('./ContactsNextFormScreen'));
    },
  },
  {
    name: 'Query Contacts',
    route: 'contacts/query',
    getComponent() {
      return optionalRequire(() => require('./ContactsNextQueryScreen'));
    },
  },
  {
    name: 'Intents (Pickers & Forms)',
    route: 'contacts/intents',
    getComponent() {
      return optionalRequire(() => require('./ContactsNextIntentsScreen'));
    },
  },
];

export default function ContactsNextScreen() {
  const apis = apiScreensToListElements(ContactsScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
