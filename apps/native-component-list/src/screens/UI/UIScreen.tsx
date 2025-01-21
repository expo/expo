import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const UIScreens = [
  {
    name: 'Button component',
    route: 'ui/button',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ButtonScreen'));
    },
  },
  {
    name: 'Picker component',
    route: 'ui/picker',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./PickerScreen'));
    },
  },
  {
    name: 'Switch component',
    route: 'ui/switch',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SwitchScreen'));
    },
  },
];

export default function UIScreen() {
  const apis: ListElement[] = UIScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/components/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}

UIScreen.navigationOptions = {
  title: 'Expo UI',
};
