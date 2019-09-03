import { registerRootComponent } from 'expo';
import { activateKeepAwake } from 'expo-keep-awake';
import { getStorybookUI } from '@storybook/react-native';
import './rn-addons';
import './config';

const StorybookUIRoot = getStorybookUI({});
activateKeepAwake();
registerRootComponent(StorybookUIRoot);
