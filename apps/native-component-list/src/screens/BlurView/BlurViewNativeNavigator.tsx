import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

const Stack = createNativeStackNavigator();

export default function BlurViewNativeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BlurViewScreen"
        component={require('./BlurViewScreen').default}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BlurViewNativeScreen"
        component={require('./BlurViewNativeScreen').default}
      />
    </Stack.Navigator>
  );
}
