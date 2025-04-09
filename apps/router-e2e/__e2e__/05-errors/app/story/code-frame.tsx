import { View } from 'react-native';
import { ErrorCodeFrame } from '@expo/metro-runtime/src/error-overlay/overlay/ErrorCodeFrame';

// const Foo = undefined;

export default function App() {
  return (
    <View style={{ flex: 1, gap: 16, backgroundColor: 'black' }}>
      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <ErrorCodeFrame
          codeFrame={{
            fileName:
              '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx',
            location: null,
            content:
              "\u001b[0m \u001b[90m 1 |\u001b[39m \u001b[36mimport\u001b[39m { \u001b[33mText\u001b[39m\u001b[33m,\u001b[39m \u001b[33mView\u001b[39m } \u001b[36mfrom\u001b[39m \u001b[32m'react-native'\u001b[39m\u001b[33m;\u001b[39m\n \u001b[90m 2 |\u001b[39m\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 3 |\u001b[39m \u001b[36mimport\u001b[39m \u001b[32m'foobar'\u001b[39m\u001b[33m;\u001b[39m\n \u001b[90m   |\u001b[39m         \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 4 |\u001b[39m\n \u001b[90m 5 |\u001b[39m \u001b[36mexport\u001b[39m \u001b[36mdefault\u001b[39m \u001b[36mfunction\u001b[39m \u001b[33mApp\u001b[39m() {\n \u001b[90m 6 |\u001b[39m   \u001b[36mreturn\u001b[39m (\u001b[0m",
          }}
        />
      </View>

      {/* {Array.from({ length: 3 }, (_, i) => (
        <View style={{ padding: 8, backgroundColor: 'white' }}></View>
      )).reverse()} */}

      <View style={{ borderWidth: 1, borderColor: 'white', padding: 8 }}>
        <ErrorCodeFrame
          codeFrame={{
            content:
              '\u001b[0m \u001b[90m  8 |\u001b[39m         onPress\u001b[33m=\u001b[39m{() \u001b[33m=>\u001b[39m {\n \u001b[90m  9 |\u001b[39m           \u001b[90m// @ts-expect-error\u001b[39m\n\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 10 |\u001b[39m           undefined()\u001b[33m;\u001b[39m\n \u001b[90m    |\u001b[39m           \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\n \u001b[90m 11 |\u001b[39m         }}\u001b[33m>\u001b[39m\n \u001b[90m 12 |\u001b[39m         \u001b[33mRuntime\u001b[39m error\u001b[33m:\u001b[39m undefined is not a \u001b[36mfunction\u001b[39m\n \u001b[90m 13 |\u001b[39m       \u001b[33m<\u001b[39m\u001b[33m/\u001b[39m\u001b[33mText\u001b[39m\u001b[33m>\u001b[39m\u001b[0m',
            location: {
              row: 10,
              column: 10,
            },
            fileName:
              '/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx',
          }}
        />
      </View>
    </View>
  );
}
