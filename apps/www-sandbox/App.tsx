// import React from 'react';
// import { View, Text } from 'react-native';
// // import { AArrowDown } from 'lucide-react';

// // import { ZoomIn } from 'react-native-reanimated';

// // console.log(ZoomIn);

// import * as Linking from 'expo-linking';

// const Other = React.lazy(() => import('./other'));

// try {
//   let DotLottiePlayer = require('@dotlottie/react-player');
//   console.log(DotLottiePlayer);
// } catch (e) {}

// export default function App() {
//   console.log(Linking.createURL('/'));

//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       {/* <AArrowDown /> */}
//       <Text>Hello, world!</Text>
//       <React.Suspense fallback={<Text>Loading...</Text>}>
//         <Other />
//       </React.Suspense>
//     </View>
//   );
// }

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import IOther from './other';

import * as FS from 'expo-file-system';
// import otherSrc from './other-src';
const Other = IOther as unknown as typeof WebView;

export default function App() {
  const dir =
    // 'file://' +
    // FS.bundleDirectory +
    'www.bundle/10068b612d5bec160e4358a0f36c957f32f0d9e0/index.html';
  console.log(FS.bundleDirectory, dir);
  // console.log('location:', otherSrc);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}>
      {/* <View
        style={{
          backgroundColor: 'dodgerblue',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
        <Text>Hello, world</Text>
        <Text>Docs: {FS.documentDirectory}</Text>
      </View> */}

      {/* <WebView
        style={{ flex: 1 }}
        originWhitelist={['*']}
        webviewDebuggingEnabled
        source={{
          uri: dir,
        }}
      /> */}

      <Other
        webviewDebuggingEnabled
        pullToRefreshEnabled={false}
        domStorageEnabled
        javaScriptEnabled
        originWhitelist={['*']}
        style={{ flex: 1 }}
      />

      {/* <WebView style={{ flex: 1 }} source={otherSrc} /> */}
      {/* <WebView style={{ flex: 1 }} source={{ uri: 'https://expo.dev/@bacon?tab=snacks' }} /> */}
    </View>
  );
}
