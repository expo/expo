import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { componentScreensToListElements } from '../ComponentListScreen';

export const UIScreens = [
  {
    name: 'Community SegmentedControl replacement',
    route: 'ui/community-segmented-control',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CommunitySegmentedControlScreen'));
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
