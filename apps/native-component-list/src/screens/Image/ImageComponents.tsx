import ExpoImage from 'expo-image';
import { Animated } from 'react-native';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const AnimatedImage = Animated.Image;
AnimatedImage.displayName = 'Image';

const AnimatedView = Animated.View;
AnimatedView.displayName = 'View';

const compareComponents: React.ComponentType<any>[] = [AnimatedImage, AnimatedView];
let selectedCompareComponent = compareComponents[0];
const listeners: any[] = [];

export function getImageComponent(): React.ComponentType<any> {
  return AnimatedExpoImage;
}

export function getSelectedCompareComponent(): React.ComponentType<any> {
  return selectedCompareComponent;
}

export function setSelectedCompareComponent(Component: React.ComponentType<any>) {
  if (selectedCompareComponent !== Component) {
    selectedCompareComponent = Component;
    listeners.forEach(listener => listener());
  }
}

export function getCompareComponents() {
  return compareComponents;
}

export function addSelectedComponentChangeListener(listener: any) {
  listeners.push(listener);
  return () => {
    listeners.splice(listeners.indexOf(listener), 1);
  };
}
