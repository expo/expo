import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { componentScreensToListElements } from '../ComponentListScreen';

export const UIScreens = [
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
];

export default function UIScreen() {
  const apis = componentScreensToListElements(UIScreens);
  return <ComponentListScreen apis={apis} sort />;
}

UIScreen.navigationOptions = {
  title: 'Expo UI',
};
