import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { componentScreensToListElements } from '../ComponentListScreen';

export const SearchBarScreens = [
  {
    name: 'Full Screen SearchBar',
    route: 'ui/searchbar/fullscreen',
    options: { headerShown: false },
    getComponent() {
      return optionalRequire(() => require('./SearchBarScreen'));
    },
  },
];

export default function SearchBarListScreen() {
  const apis = componentScreensToListElements(SearchBarScreens);
  return <ComponentListScreen apis={apis} />;
}

SearchBarListScreen.navigationOptions = {
  title: 'SearchBar',
};
