import {
  useGlobalSearchParams,
  useIsPreview,
  useLocalSearchParams,
  useNavigation,
  usePathname,
} from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { View, Text } from 'react-native';

import { Links } from '@/__e2e__/link-preview/components/Links';

const HomeOne = () => {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();

  const isPreview = useIsPreview();

  const navigation = useNavigation();

  useLayoutEffect(() => {
    if (navigation.isFocused() && !isPreview) {
      navigation.setOptions({
        title: localParams.id ?? 'Home - Id',
      });
    }
  }, [isPreview, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ddf' }}>
      <Text>Home - Id</Text>
      <Text>Current Path: {pathname}</Text>
      <Text>Local Params: {JSON.stringify(localParams)}</Text>
      <Text>Global Params: {JSON.stringify(globalParams)}</Text>
      <Links />
    </View>
  );
};

export default HomeOne;
