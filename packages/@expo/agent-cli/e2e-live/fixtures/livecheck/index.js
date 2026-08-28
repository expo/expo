// The smallest thing `@expo/agent-cli deploy --web` can ship, and the only reason it is small.
//
// A web deploy is the one live write this tier makes, so what gets exported has to be a project
// whose export is seconds rather than a minute: five dependencies, one component, no router. That
// is also why `web.output` is `single` in `app.json` rather than the scaffold's `static` — static
// output renders every route with `@expo/router-server`, which needs `expo-router` and its server
// entry, and none of that is what the deploy path is being tested for.
//
// The marker text is what the suite reads back off the deployment URL, so the assertion is "the
// bytes this project produced are the bytes that address serves" rather than "something answered".

import { registerRootComponent } from 'expo';
import { Text, View } from 'react-native';

function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>@expo/agent-cli live-eas deploy marker</Text>
    </View>
  );
}

registerRootComponent(App);
