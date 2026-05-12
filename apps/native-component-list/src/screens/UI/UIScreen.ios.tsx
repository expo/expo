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
    name: 'DatePicker component',
    route: 'ui/date-picker',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./DatePickerScreen'));
    },
  },
  {
    name: 'Community BottomSheet replacement',
    route: 'ui/community-bottomsheet',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunityBottomSheetScreen'));
    },
  },
  {
    name: 'Community Picker replacement',
    route: 'ui/community-picker',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunityPickerScreen'));
    },
  },
  {
    name: 'Community DateTimePicker replacement',
    route: 'ui/community-datetimepicker',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunityDateTimePickerScreen'));
    },
  },
  {
    name: 'Community SegmentedControl replacement',
    route: 'ui/community-segmented-control',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunitySegmentedControlScreen'));
    },
  },
  {
    name: 'Community Slider replacement',
    route: 'ui/community-slider',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunitySliderScreen'));
    },
  },
  {
    name: 'Community MaskedView replacement',
    route: 'ui/community-masked-view',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunityMaskedViewScreen'));
    },
  },
  {
    name: 'Community Menu replacement',
    route: 'ui/community-menu',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunityMenuScreen'));
    },
  },
  {
    name: 'TabView component',
    route: 'ui/tabview',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./TabViewScreen'));
    },
  },
  {
    name: 'Toggle component',
    route: 'ui/toggle',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ToggleScreen'));
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
    name: 'Menu component',
    route: 'ui/menu',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./MenuScreen'));
    },
  },
  {
    name: 'ConfirmationDialog component',
    route: 'ui/confirmation-dialog',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ConfirmationDialogScreen'));
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
    name: 'TextField component',
    route: 'ui/textField',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./TextFieldScreen'));
    },
  },
  {
    name: 'ProgressView component',
    route: 'ui/progress-view',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ProgressViewScreen'));
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
    name: 'Section component',
    route: 'ui/section',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SectionScreen'));
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
    name: 'Content Transition',
    route: 'ui/content-transition',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ContentTransitionScreen'));
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
    name: 'LazyVStack / LazyHStack',
    route: 'ui/lazy-stack',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./LazyStackScreen'));
    },
  },
  {
    name: 'ScrollView component',
    route: 'ui/scrollview',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ScrollViewScreen'));
    },
  },
  {
    name: 'ScrollView shared position',
    route: 'ui/scrollview-shared-position',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ScrollViewSharedPositionScreen'));
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
    name: 'Link component',
    route: 'ui/link',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./LinkScreen'));
    },
  },
  {
    name: 'Mask component',
    route: 'ui/mask',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./MaskScreen'));
    },
  },
  {
    name: 'Overlay component',
    route: 'ui/overlay',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./OverlayScreen'));
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
  {
    name: 'Grid component',
    route: 'ui/grid',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GridScreen'));
    },
  },
  {
    name: 'Host Ignore Safe Area Keyboard',
    route: 'ui/host-ignore-safe-area-keyboard',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./HostIgnoreSafeAreaKeyboardScreen'));
    },
  },
  {
    name: 'Extending Expo UI',
    route: 'ui/extending',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ExtendingExpoUIScreen'));
    },
  },
  {
    name: 'rotation3DEffect modifier',
    route: 'ui/rotation-3d-effect',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./Rotation3DEffectScreen'));
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
