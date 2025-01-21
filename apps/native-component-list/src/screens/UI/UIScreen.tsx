import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const UIScreens = [
  {
    name: 'SingleChoiceSegmentedControlView',
    route: 'ui/single-choice-segmented-control-view',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./SingleChoiceSegmentedControlViewScreen'));
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
