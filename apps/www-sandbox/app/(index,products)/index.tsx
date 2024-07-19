import { Text, View } from 'react-native';

import WebDashboard from '@/components/www/dashboard';
import ICharts from '@/components/www/charts';

const Charts = ICharts as unknown as typeof import('react-native-webview').WebView;
import { Stack } from 'expo-router';

export default function Route() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Dashboard',
        }}
      />

      {/* <Charts scrollEnabled={false} /> */}
      <WebDashboard
        actions={{
          showNotifications(title) {
            // alert(title);
            // throw new Error('Error');
            return '....';
          },
          haptics() {
            alert('Haptics');
          },
        }}
      />
    </View>
  );
}
