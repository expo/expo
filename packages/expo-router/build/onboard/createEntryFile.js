"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbsolutePath = exports.createEntryFileAsync = void 0;
const getDevServer_1 = require("../getDevServer");
/** Middleware for creating an entry file in the project. */
function createEntryFileAsync() {
    if (process.env.NODE_ENV === 'production') {
        // No dev server
        console.warn('createEntryFile() cannot be used in production');
        return;
    }
    // Pings middleware in the Expo CLI dev server.
    return fetch((0, getDevServer_1.getDevServer)().url + '_expo/touch', {
        method: 'POST',
        body: JSON.stringify({
            contents: TEMPLATE,
            // Legacy
            path: './app/index.js',
            // New
            absolutePath: getAbsolutePath(),
        }),
    });
}
exports.createEntryFileAsync = createEntryFileAsync;
function getAbsolutePath() {
    return process.env.EXPO_ROUTER_ABS_APP_ROOT + '/index.js';
}
exports.getAbsolutePath = getAbsolutePath;
const TEMPLATE = `import { StyleSheet, Text, View } from "react-native";

export default function Page() {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>Hello World</Text>
        <Text style={styles.subtitle}>This is the first page of your app.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
`;
//# sourceMappingURL=createEntryFile.js.map