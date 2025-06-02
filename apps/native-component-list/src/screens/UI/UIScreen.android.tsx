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
    name: 'Shape component',
    route: 'ui/shape',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ShapeScreen'));
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
  {
    name: 'List component',
    route: 'ui/list',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ListScreen'));
    },
  },
  {
    name: 'BottomSheet component',
    route: 'ui/bottomsheet',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BottomSheetScreen'));
    },
  },
  {
    name: 'Jetpack Compose primitives',
    route: 'ui/jetpack-compose-primitives',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./JetpackComposePrimitivesScreen'));
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
