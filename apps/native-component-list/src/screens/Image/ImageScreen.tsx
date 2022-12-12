import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const ImageScreens = [
  {
    name: 'Comparison with original image',
    route: 'image/comparison',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ImageComparisonScreen'));
    },
  },
  {
    name: 'List with thousands images',
    route: 'image/flashlist',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./ImageFlashListScreen'));
    },
  },
  {
    name: 'Image formats',
    route: 'image/formats',
    getComponent() {
      return optionalRequire(() => require('./ImageFormatsScreen'));
    },
  },
  {
    name: 'Resizable image',
    route: 'image/resizable',
    getComponent() {
      return optionalRequire(() => require('./ImageResizableScreen'));
    },
  },
  {
    name: 'Content fit and position',
    route: 'image/content-fit',
    getComponent() {
      return optionalRequire(() => require('./ImageContentFitScreen'));
    },
  },
  {
    name: 'Events',
    route: 'image/events',
    getComponent() {
      return optionalRequire(() => require('./ImageEventsScreen'));
    },
  },
  {
    name: 'Prioritizing images',
    route: 'image/priority',
    getComponent() {
      return optionalRequire(() => require('./ImagePriorityScreen'));
    },
  },
  {
    name: 'Placeholder',
    route: 'image/placeholder',
    getComponent() {
      return optionalRequire(() => require('./ImagePlaceholderScreen'));
    },
  },
];

export default function ImageScreen() {
  const apis: ListElement[] = ImageScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/components/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
