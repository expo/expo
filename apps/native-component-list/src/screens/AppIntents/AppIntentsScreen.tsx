import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';
import { optionalRequire } from '../../navigation/routeBuilder';

export const AppIntentsScreens = [
  {
    name: 'AppIntentCounter',
    route: 'app-intents/counter',
    options: { title: 'App Intent Counter' },
    getComponent() {
      return optionalRequire(() => require('./AppIntentCounterScreen'));
    },
  },
  {
    name: 'AppIntentOrderScreen',
    route: 'app-intents/order',
    options: { title: 'App Intent Order' },
    getComponent() {
      return optionalRequire(() => require('./AppIntentOrderScreen'));
    },
  },
  {
    name: 'AppIntentJournalScreen',
    route: 'app-intents/journal',
    options: { title: 'App Intent Journal' },
    getComponent() {
      return optionalRequire(() => require('./AppIntentJournalScreen'));
    },
  },
];

export default function AppIntentsScreen() {
  const apis = apiScreensToListElements(AppIntentsScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
