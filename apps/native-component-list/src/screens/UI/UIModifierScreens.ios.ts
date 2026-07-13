import { optionalRequire } from '../../navigation/routeBuilder';

export const UIModifierScreens = [
  {
    name: 'Searchable modifier',
    route: 'ui/modifiers/searchable',
    options: { title: 'Searchable' },
    getComponent() {
      return optionalRequire(() => require('./SearchableModifierScreen'));
    },
  },
];
