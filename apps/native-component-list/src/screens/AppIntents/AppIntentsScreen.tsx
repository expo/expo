import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

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
    name: 'AppIntentMailScreen',
    route: 'app-intents/mail',
    options: { title: 'App Intent Mail' },
    getComponent() {
      return optionalRequire(() => require('./AppIntentMailScreen'));
    },
  },
];

export default function AppIntentsScreen() {
  const apis = apiScreensToListElements(AppIntentsScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
