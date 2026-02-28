#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /src and /scripts directories to /example based on user input and creates a new /src/app directory with an index.tsx and _layout.tsx file.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const oldDirs = ['src', 'scripts'];
const exampleDir = 'example';
const newAppDir = 'src/app';
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === 'y') {
      // Create the app-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    // Move old directories to new app-example directory or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === 'y') {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} deleted.`);
        }
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Delete example images no longer needed after reset
    const exampleImages = [
      'expo-badge.png',
      'expo-badge-white.png',
      'expo-logo.png',
      'logo-glow.png',
      'react-logo.png',
      'react-logo@2x.png',
      'react-logo@3x.png',
      'tutorial-web.png',
    ];
    for (const image of exampleImages) {
      const imagePath = path.join(root, 'assets', 'images', image);
      if (fs.existsSync(imagePath)) {
        await fs.promises.rm(imagePath);
        console.log(`🗑️  Deleted /assets/images/${image}`);
      }
    }
    const tabIconsDir = path.join(root, 'assets', 'images', 'tabIcons');
    if (fs.existsSync(tabIconsDir)) {
      await fs.promises.rm(tabIconsDir, { recursive: true, force: true });
      console.log(`🗑️  Deleted /assets/images/tabIcons/`);
    }

    // Create new /src/app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log('\n📁 New /src/app directory created.');

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, 'index.tsx');
    await fs.promises.writeFile(indexPath, indexContent);
    console.log('📄 src/app/index.tsx created.');

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, '_layout.tsx');
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log('📄 src/app/_layout.tsx created.');

    console.log('\n✅ Project reset complete. Next steps:');
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit src/app/index.tsx to edit the main screen.\n3. Put all your application code in /src, only screens and layout files should be in /src/app.${
        userInput === 'y'
          ? `\n4. Delete the /${exampleDir} directory when you're done referencing it.`
          : ''
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

rl.question(
  'Do you want to move existing files to /example instead of deleting them? (Y/n): ',
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
