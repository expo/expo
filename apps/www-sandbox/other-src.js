'use webview:source';

import React from 'react';
import { View, Text } from 'react-native';
// import { AArrowDown } from 'lucide-react';

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'darkteal',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {/* <AArrowDown /> */}
      <Text>Other</Text>
      <div>Hey</div>

      <link rel="stylesheet" href="https://unpkg.com/easymde/dist/easymde.min.css" />
      <script src="https://unpkg.com/easymde/dist/easymde.min.js"></script>

      <textarea></textarea>
      <script>const easyMDE = new EasyMDE();</script>
    </View>
  );
}
