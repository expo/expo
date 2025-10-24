import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { componentScreensToListElements } from '../ComponentListScreen';

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
    name: 'Form component',
    route: 'ui/form',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./FormScreen'));
    },
  },
  {
    name: 'ShareLink component',
    route: 'ui/share-link',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ShareLinkScreen'));
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
    name: 'Stepper component',
    route: 'ui/stepper',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./StepperScreen'));
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
    name: 'Gauge component',
    route: 'ui/gauge',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GaugeScreen'));
    },
  },
  {
    name: 'Chart component',
    route: 'ui/chart',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ChartScreen'));
    },
  },
  {
    name: 'Hosting RN Views',
    route: 'ui/hosting-rn-views',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./HostingRNViewsScreen'));
    },
  },
  {
    name: 'Modifiers',
    route: 'ui/modifiers',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ModifiersScreen'));
    },
  },
  {
    name: 'Animation Modifier',
    route: 'ui/animation-modifier',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AnimationModifierScreen'));
    },
  },
  {
    name: 'Glass Effect',
    route: 'ui/glass-effect',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GlassEffectScreen'));
    },
  },
  {
    name: 'Matched Geometry Effect',
    route: 'ui/matched-geometry-effect',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./MatchedGeometryEffectScreen'));
    },
  },
  {
    name: 'Shapes',
    route: 'ui/shapes',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ShapesScreen'));
    },
  },
  {
    name: 'Image component',
    route: 'ui/image',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ImageScreen'));
    },
  },
  {
    name: 'Text component',
    route: 'ui/text',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./TextScreen'));
    },
  },
  {
    name: 'Popover component',
    route: 'ui/popover',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./PopoverScreen'));
    },
  },
  {
    name: 'RTL Layout',
    route: 'ui/rtl',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./RTLScreen'));
    },
  },
];

export default function UIScreen() {
  const apis = componentScreensToListElements(UIScreens);
  return <ComponentListScreen apis={apis} sort />;
}

UIScreen.navigationOptions = {
  title: 'Expo UI',
};
