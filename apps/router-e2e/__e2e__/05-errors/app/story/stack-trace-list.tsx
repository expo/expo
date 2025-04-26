import { View } from 'react-native';
import { StackTraceList } from '@expo/metro-runtime/src/error-overlay/overlay/StackTraceList';

export default function App() {
  const projectRoot = '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e';
  return (
    <View style={{ flex: 1, gap: 16, backgroundColor: 'black' }}>
      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <StackTraceList
          onRetry={() => {}}
          projectRoot={projectRoot}
          symbolicationStatus="COMPLETE"
          stack={[
            {
              arguments: [],
              column: 10,
              file: '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx',
              lineNumber: 10,
              methodName: 'Text.props.onPress',
              collapse: false,
            },
            {
              arguments: ['foobar'],
              column: 10,
              file: '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx',
              lineNumber: 10,
              methodName: 'Text.props.onPress',
              collapse: false,
            },
            {
              arguments: [],
              column: 6,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/Text/index.js',
              lineNumber: 96,
              methodName: 'handleClick',
              collapse: true,
            },
            {
              arguments: [],
              column: 16,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 16122,
              methodName: 'processDispatchQueue',
              collapse: true,
            },
          ]}
          type="stack"
        />
      </View>
      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <StackTraceList
          projectRoot={projectRoot}
          onRetry={() => {}}
          symbolicationStatus="PENDING"
          stack={[
            {
              arguments: [],
              column: 6,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/Text/index.js',
              lineNumber: 96,
              methodName: 'handleClick',
              collapse: true,
            },
            {
              arguments: [],
              column: 16,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 16122,
              methodName: 'processDispatchQueue',
              collapse: true,
            },
          ]}
          type="stack"
        />
      </View>
      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <StackTraceList
          projectRoot={projectRoot}
          onRetry={() => {}}
          symbolicationStatus="FAILED"
          stack={[
            {
              arguments: [],
              column: 6,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native-web/dist/exports/Text/index.js',
              lineNumber: 96,
              methodName: 'handleClick',
              collapse: true,
            },
            {
              arguments: [],
              column: 16,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 16122,
              methodName: 'processDispatchQueue',
              collapse: true,
            },
          ]}
          type="stack"
        />
      </View>

      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <StackTraceList
          projectRoot={projectRoot}
          onRetry={() => {}}
          symbolicationStatus="NONE"
          stack={[
            {
              arguments: [],
              column: null,
              file: '<native>',
              lineNumber: null,
              methodName: 'apply',
              collapse: false,
            },
            {
              arguments: [],
              column: 16,
              file: '/Users/evanbacon/Documents/GitHub/expo/node_modules/react-dom/cjs/react-dom-client.development.js',
              lineNumber: 16122,
              methodName: 'processDispatchQueue',
              collapse: true,
            },
          ]}
          type="stack"
        />
      </View>
    </View>
  );
}
