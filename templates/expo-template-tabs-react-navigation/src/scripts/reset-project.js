#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /src directories (navigation, components, hooks, scripts, and constants) to /src-example based on user input
 * and creates a new minimal React Navigation setup.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const srcPath = path.join(root, 'src');
const oldDirs = ['navigation', 'components', 'hooks', 'constants', 'scripts'];
const exampleDir = 'src-example';
const exampleDirPath = path.join(root, exampleDir);

const homeScreenContent = `import { Text, View, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Edit src/navigation/screens/Home.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
`;

const navigationContent = `import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/Home';

const RootStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
  },
});

export const Navigation = createStaticNavigation(RootStack);
`;

const appContent = `import 'react-native-gesture-handler';
import { Navigation } from './navigation';

export function App() {
  return <Navigation />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === 'y') {
      // Create the src-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    // Move old directories from src to src-example or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(srcPath, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === 'y') {
          const newDirPath = path.join(exampleDirPath, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /src/${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /src/${dir} deleted.`);
        }
      } else {
        console.log(`➡️ /src/${dir} does not exist, skipping.`);
      }
    }

    // Create new navigation directory structure
    const navigationPath = path.join(srcPath, 'navigation');
    const screensPath = path.join(navigationPath, 'screens');
    await fs.promises.mkdir(screensPath, { recursive: true });
    console.log('\n📁 New /src/navigation directory structure created.');

    // Create Home.tsx screen
    const homePath = path.join(screensPath, 'Home.tsx');
    await fs.promises.writeFile(homePath, homeScreenContent);
    console.log('📄 src/navigation/screens/Home.tsx created.');

    // Create navigation index.tsx
    const navIndexPath = path.join(navigationPath, 'index.tsx');
    await fs.promises.writeFile(navIndexPath, navigationContent);
    console.log('📄 src/navigation/index.tsx created.');

    // Update App.tsx
    const appPath = path.join(srcPath, 'App.tsx');
    await fs.promises.writeFile(appPath, appContent);
    console.log('📄 src/App.tsx updated.');

    console.log('\n✅ Project reset complete. Next steps:');
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit src/navigation/screens/Home.tsx to edit the main screen.${
        userInput === 'y'
          ? `\n3. Delete the /${exampleDir} directory when you're done referencing it.`
          : ''
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

rl.question(
  'Do you want to move existing files to /src-example instead of deleting them? (Y/n): ',
  (answer) => {
    const userInput = answer.trim().toLowerCase() || 'y';
    if (userInput === 'y' || userInput === 'n') {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      rl.close();
    }
  }
);
