import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { CONCRETE_EXAMPLE_SCREENS } from '../constants/ConcreteExampleScreens';
import ExamplesListScreen from '../screens/ExamplesListScreen';

export type ExamplesStackNavigatorProps = {
  ExamplesListScreen: undefined;
  Markers: undefined;
  Polygons: undefined;
  Polylines: undefined;
  Circles: undefined;
  Controls: undefined;
  'Google Maps Styling': undefined;
  Gestures: undefined;
  'Map Types': undefined;
  'Camera Position': undefined;
  Traffic: undefined;
  KML: undefined;
  GeoJson: undefined;
  Callbacks: undefined;
  POI: undefined;
  Overlays: undefined;
  Heatmaps: undefined;
  'Map Move': undefined;
};

const ExamplesStackNavigator = createStackNavigator<ExamplesStackNavigatorProps>();

export default function MainNavigator() {
  return (
    <ExamplesStackNavigator.Navigator>
      <ExamplesStackNavigator.Screen
        name="ExamplesListScreen"
        component={ExamplesListScreen}
        options={{
          headerShown: false,
        }}
      />
      {CONCRETE_EXAMPLE_SCREENS.map(({ name, screen }) => (
        <ExamplesStackNavigator.Screen
          name={name}
          component={screen}
          key={name}
          options={{
            headerStyle: { borderBottomWidth: 1 },
          }}
        />
      ))}
    </ExamplesStackNavigator.Navigator>
  );
}
