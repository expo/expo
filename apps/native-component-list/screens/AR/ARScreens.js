import ARRotatingCubeScreen from './ARRotatingCubeScreen';
import ARBackgroundScreen from './ARBackgroundScreen';
import ARBackgroundScreenVAO from './ARBackgroundScreenVAO';
import ARBackgroundScreenTHREE from './ARBackgroundScreenTHREE';
import ARPlanesScreen from './ARPlanesScreen';
import ARPointsScreen from './ARPointsScreen';
import ARHitTestScreen from './ARHitTestScreen';
import ARModelScreen from './ARModelScreen';

const screens = {
  ARBackgroundScreen,
  ARBackgroundScreenVAO,
  ARBackgroundScreenTHREE,
  ARRotatingCubeScreen,
  ARPointsScreen,
  ARPlanesScreen,
  ARHitTestScreen,
  ARModelScreen,
};

export default Object.entries(screens).reduce(
  (acc, [screenKey, screen]) => ({
    ...acc,
    [screenKey]: { screen },
  }),
  {}
);
