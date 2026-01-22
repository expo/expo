import "react-native-reanimated"

import { ThemeProvider } from 'ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import {installOnUIRuntime} from 'expo-modules-core';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';
import { scheduleOnUI } from 'react-native-worklets';
import { Host, Button, BoundTextField, useNativeState, VStack} from '@expo/ui/swift-ui';

SplashScreen.preventAutoHideAsync();

function useSplashScreen(loadingFunction: () => Promise<void>) {
  const [isLoadingCompleted, setLoadingComplete] = React.useState(false);

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadAsync() {
      try {
        await loadingFunction();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        await SplashScreen.hide();
      }
    }

    loadAsync();
  }, []);

  return isLoadingCompleted;
}

export default function App() {
  const isLoadingCompleted = useSplashScreen(async () => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', false);
    }
    await loadAssetsAsync();
  });

  return <ThemeProvider>{isLoadingCompleted ? <MyComponent /> : null}</ThemeProvider>;
}


installOnUIRuntime();                                                                                                                            

const MyComponent = () => {
  const textFieldValue = useNativeState('Hello');

  React.useEffect(() => {
    textFieldValue.onChange((v) => {
      'worklet';
      const digits = v.replace(/\D/g, '').slice(0, 10);

      let formatted = '';
      if (digits.length > 0) {
        formatted = '(' + digits.slice(0, 3);
      }
      if (digits.length >= 3) {
        formatted += ') ' + digits.slice(3, 6);
      }
      if (digits.length >= 6) {
        formatted += '-' + digits.slice(6, 10);
      }

      console.log('formatted', formatted);
      if (formatted !== v) {
        textFieldValue.set(formatted);
      }
    });
  }, [textFieldValue]);

  return (
    <Host style={{ flex: 1, alignItems: 'center',  }}>
      <VStack>
      <BoundTextField
        value={textFieldValue}
      />  
      <Button label="Set Value" onPress={() => {
        scheduleOnUI(() => {
          'worklet';
          textFieldValue.set('Hello world');
        })
       }} />
       </VStack>
    </Host>
  )
}
