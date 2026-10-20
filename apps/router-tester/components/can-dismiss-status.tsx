import { router, useCanDismiss } from 'expo-router';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export function CanDismissStatus({ screen }: { screen: string }) {
  const canDismiss = useCanDismiss();
  const [routerCanDismiss, setRouterCanDismiss] = useState<boolean>();

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Text testID="e2e-screen">{screen}</Text>
      <Text testID="e2e-use-can-dismiss">useCanDismiss: {String(canDismiss)}</Text>
      <Text testID="e2e-router-can-dismiss">
        router.canDismiss: {routerCanDismiss === undefined ? 'unchecked' : String(routerCanDismiss)}
      </Text>
      <Button
        testID="e2e-check-router-can-dismiss"
        title="Check router.canDismiss()"
        onPress={() => setRouterCanDismiss(router.canDismiss())}
      />
    </View>
  );
}
