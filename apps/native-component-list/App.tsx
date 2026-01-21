import { ThemeProvider } from 'ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

import RootNavigation from './src/navigation/RootNavigation';
import loadAssetsAsync from './src/utilities/loadAssetsAsync';

import { Host, SharedObjectTester, useDummySharedObject } from '@expo/ui/swift-ui';                                                                        
                                                                                                                                                       
 
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

function MyComponent() {                                                                                                                             
  const sharedObject = useDummySharedObject((obj) => {                                                                                               
    obj.text = "Custom text";                                                                                                                        
    obj.counter = 10;                                                                                                                                
  });                                                                                                                                                
                 
  console.log('sharedObject', sharedObject);
  return (                                                                                                                                           
    <Host style={{ flex: 1, alignItems: 'center', }}>
    <SharedObjectTester                                                                                                                              
      sharedObject={sharedObject}                                                                                                                    
      onValueChange={(event) => console.log('Counter:', event.counter)}                                                                              
    />
    </Host>                                                                                                                                               
  );                                                                                                                                                 
}                                                                                                                                                    
    