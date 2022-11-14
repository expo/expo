import * as Location from 'expo-location';
import { Providers } from 'expo-maps/build/Map.types';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import SwitchContainer from './components/SwitchContainer';
import ProviderContext from './context/ProviderContext';
import MainNavigator from './navigators/MainNavigator';

const App = () => {
  const [provider, setProvider] = useState<Providers>('google');

  // it should be done as a part of library, just for now in example app
  const getLocationPermissions = async () => {
    await Location.requestForegroundPermissionsAsync();
  };

  useEffect(() => {
    getLocationPermissions();
  }, []);

  return (
    <ProviderContext.Provider value={provider}>
      <MainNavigator />
      {Platform.OS === 'ios' && (
        <View style={{ padding: 20 }}>
          <SwitchContainer
            title="Use Apple Maps"
            value={provider === 'apple'}
            onValueChange={() => setProvider(provider === 'google' ? 'apple' : 'google')}
          />
        </View>
      )}
    </ProviderContext.Provider>
  );
};

export default App;
