import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const BlurScreens = [
  {
    name: 'Animated BlurView',
    route: 'blur/animated',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlurViewAnimatedScreen'));
    },
  },
  {
    name: 'BlurView Navbar Screen',
    route: 'blur/navbar',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlurViewScrollScreen'));
    },
  },
  {
    name: 'BlurView Compat',
    route: 'blur/compat',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./BlurViewCompatScreen'));
    },
  },
];

export default function BlurViewScreen() {
  const apis: ListElement[] = BlurScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/components/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
