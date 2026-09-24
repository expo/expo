import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

export const AIScreens = [
  {
    name: 'Availability & Requirements',
    route: 'ai/availability',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AvailabilityScreen'));
    },
  },
  {
    name: 'Text Generation',
    route: 'ai/text',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./TextScreen'));
    },
  },
  {
    name: 'Structured Output',
    route: 'ai/structured',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./StructuredScreen'));
    },
  },
  {
    name: 'Session',
    route: 'ai/session',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SessionScreen'));
    },
  },
  {
    name: 'Streaming',
    route: 'ai/streaming',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./StreamingScreen'));
    },
  },
];

export default function AIScreen() {
  const apis = apiScreensToListElements(AIScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
