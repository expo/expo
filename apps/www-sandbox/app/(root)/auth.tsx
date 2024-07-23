import Auth01 from '@/components/www/authentication-01';
import Charts from '@/components/www/charts';
import Dashboard01 from '@/components/www/dashboard-01';
import { useState } from 'react';
import { View } from 'react-native';

export default function Route() {
  return (
    <View style={{ flex: 1 }}>
      <Auth01
        webview={{
          scrollEnabled: false,
        }}
      />
    </View>
  );
}
