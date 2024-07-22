import { Button, ScrollView } from 'react-native';
import Dashboard from '../../components/www/dashboard';

import { useState } from 'react';

export default function Route() {
  const [index, setIndex] = useState(0);
  return (
    // <ScrollView style={{ flex: 1 }}>
    <Dashboard />
    // </ScrollView>
  );
}
