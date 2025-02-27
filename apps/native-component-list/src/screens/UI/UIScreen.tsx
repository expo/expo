import { Platform } from 'react-native';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const UIScreens = [
  {
    name: 'Binding component',
    route: 'ui/binding',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BindingScreen'));
    },
  },
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
    name: 'Date Time Picker component',
    route: 'ui/date-picker',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./DateTimePickerScreen'));
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
  {
    name: 'Section component',
    route: 'ui/section',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SectionScreen'));
    },
  },
  {
    name: 'Slider component',
    route: 'ui/slider',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SliderScreen'));
    },
  },
  {
    name: 'ContextMenu component',
    route: 'ui/context-menu',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ContextMenuScreen'));
    },
  },
  {
    name: 'Color Picker component',
    route: 'ui/color-picker',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ColorPickerScreen'));
    },
  },
  {
    name: 'TextInput component',
    route: 'ui/textInput',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./TextInputScreen'));
    },
  },
  {
    name: 'Progress component',
    route: 'ui/progress',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ProgressScreen'));
    },
  },
];
if (Platform.OS === 'ios') {
  UIScreens.push({
    name: 'Gauge component',
    route: 'ui/gauge',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GaugeScreen'));
    },
  });
}

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
