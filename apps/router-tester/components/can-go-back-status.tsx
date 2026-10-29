import { router, useCanGoBack } from 'expo-router';
import { useState } from 'react';
import { Button, Text } from 'react-native';

export function CanGoBackStatus() {
  const canGoBack = useCanGoBack();
  const [routerCanGoBack, setRouterCanGoBack] = useState<boolean>();

  return (
    <>
      <Text testID="e2e-use-can-go-back">useCanGoBack: {String(canGoBack)}</Text>
      <Text testID="e2e-router-can-go-back">router.canGoBack: {String(routerCanGoBack)}</Text>
      <Button
        testID="e2e-read-router-can-go-back"
        title="Read router.canGoBack()"
        onPress={() => setRouterCanGoBack(router.canGoBack())}
      />
    </>
  );
}
