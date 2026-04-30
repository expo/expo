import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { componentScreensToListElements } from '../ComponentListScreen';

export const UIScreens = [
  {
    name: 'AnimatedVisibility component',
    route: 'ui/animated-visibility',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AnimatedVisibilityScreen'));
    },
  },
  {
    name: 'Badge component',
    route: 'ui/badge',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BadgeScreen'));
    },
  },
  {
    name: 'AlertDialog component',
    route: 'ui/alert-dialog',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AlertDialogScreen'));
    },
  },
  {
    name: 'BasicAlertDialog component',
    route: 'ui/basic-alert-dialog',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BasicAlertDialogScreen'));
    },
  },
  {
    name: 'Card component',
    route: 'ui/card',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CardScreen'));
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
    name: 'Checkbox component',
    route: 'ui/checkbox',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CheckboxScreen'));
    },
  },
  {
    name: 'IconButton component',
    route: 'ui/icon-button',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./IconButtonScreen'));
    },
  },
  {
    name: 'Radio Button component',
    route: 'ui/radio-button',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./RadioButtonScreen'));
    },
  },
  {
    name: 'Segmented Control component',
    route: 'ui/segmented-control',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SegmentedControlScreen'));
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
    name: 'ExposedDropdownMenuBox component',
    route: 'ui/exposed-dropdown-menu-box',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ExposedDropdownMenuBoxScreen'));
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
    name: 'Switch component',
    route: 'ui/switch',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SwitchScreen'));
    },
  },
  {
    name: 'SyncSwitch component',
    route: 'ui/sync-switch',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SyncSwitchScreen'));
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
    name: 'Form component',
    route: 'ui/form',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./FormScreen'));
    },
  },
  {
    name: 'Divider component',
    route: 'ui/divider',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./DividerScreen'));
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
    name: 'DropdownMenu component',
    route: 'ui/dropdown-menu',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./DropdownMenuScreen'));
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
    name: 'Material Colors',
    route: 'ui/material-colors',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./MaterialColorsScreen'));
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
    name: 'TextField component',
    route: 'ui/textField',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./TextFieldScreen'));
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
    name: 'Chip component',
    route: 'ui/assist-chip',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ChipScreen'));
    },
  },
  {
    name: 'HorizontalPager component',
    route: 'ui/horizontal-pager',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./HorizontalPagerScreen'));
    },
  },
  {
    name: 'Carousel component',
    route: 'ui/carousel',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CarouselScreen'));
    },
  },
  {
    name: 'LazyColumn / LazyRow',
    route: 'ui/lazy-column-row',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./LazyColumnRowScreen'));
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
  {
    name: 'Hosting RN Views',
    route: 'ui/hosting-rn-views',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./HostingRNViewsScreen'));
    },
  },
  {
    name: 'ToggleButton component',
    route: 'ui/toggle-button',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ToggleButtonScreen'));
    },
  },
  {
    name: 'FloatingActionButton component',
    route: 'ui/floating-action-button',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./FloatingActionButtonScreen'));
    },
  },
  {
    name: 'graphicsLayer modifier',
    route: 'ui/graphics-layer',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GraphicsLayerScreen'));
    },
  },
  {
    name: 'HorizontalFloatingToolbar component',
    route: 'ui/horizontal-floating-toolbar',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./HorizontalFloatingToolbarScreen'));
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
    name: 'PullToRefreshBox component',
    route: 'ui/pull-to-refresh-box',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./PullToRefreshBoxScreen'));
    },
  },
  {
    name: 'Surface component',
    route: 'ui/surface',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SurfaceScreen'));
    },
  },
  {
    name: 'Tooltip component',
    route: 'ui/tooltip',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./TooltipScreen'));
    },
  },
];

export default function UIScreen() {
  const apis = componentScreensToListElements(UIScreens);
  return <ComponentListScreen apis={apis} />;
}

UIScreen.navigationOptions = {
  title: 'Expo UI',
};
