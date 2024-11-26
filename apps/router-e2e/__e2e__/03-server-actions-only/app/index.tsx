// 'use client';
// import React from 'react';
// import { Text } from 'react-native';

// import { renderPage } from '../components/server-actions';

// export { ErrorBoundary } from 'expo-router';

// export default function ServerActionTest() {
//   return (
//     <React.Suspense fallback={<Text>Loading...</Text>}>
//       {renderPage({ title: 'Hello!' })}
//     </React.Suspense>
//   );
// }

import ServerActionTest from '../components/dom-two';

export default function ServerActionNestedDomTest() {
  return (
    <ServerActionTest
      dom={{
        pullToRefreshEnabled: true,
      }}
    />
  );
}
