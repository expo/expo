import ImageTestScreen from './ImageTestScreen';
import ImageTestsScreen from './ImageTestsScreen';

interface Screens {
  [key: string]: {
    screen: React.ComponentClass<any>;
  };
}

const ImageScreens: Screens = {
  ImageTests: {
    screen: ImageTestsScreen,
  },
  ImageTest: {
    screen: ImageTestScreen,
  },
};

export default ImageScreens;
