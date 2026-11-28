import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { componentScreensToListElements } from '../ComponentListScreen';

export const SelectableTextScreens = [
  {
    name: 'Basics',
    route: 'selectable-text/basics',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BasicsScreen'));
    },
  },
  {
    name: 'Edge cases',
    route: 'selectable-text/edge-cases',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./EdgeCasesScreen'));
    },
  },
  {
    name: 'Chat with 500 messages',
    route: 'selectable-text/chat',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ChatScreen'));
    },
  },
  {
    name: 'Chat with React Native Text (control)',
    route: 'selectable-text/chat-react-native-text',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ChatReactNativeTextScreen'));
    },
  },
];

export default function SelectableTextScreen() {
  const apis = componentScreensToListElements(SelectableTextScreens);
  return <ComponentListScreen apis={apis} />;
}

SelectableTextScreen.navigationOptions = {
  title: 'Selectable Text',
};
