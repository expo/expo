#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It moves the /app, /components, /hooks, /scripts, and /constants directories to /app-example and creates a new /app directory with an index.tsx and _layout.tsx file.
 * After completing, it prompts to remove the /app-example folder and the script entry in package.json.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];
const newDir = "app-example";
const newAppDir = "app";
const newDirPath = path.join(root, newDir);
const scriptFileName = path.basename(__filename);
const scriptFilePath = path.join(root, "scripts", scriptFileName);
const packageJsonPath = path.join(root, "package.json");

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
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

const promptForCleanup = () => {
  rl.question(
    "Do you want to delete the /app-example folder and this script? (Y/N): ",
    async (answer) => {
      if (answer.toLowerCase() === "y") {
        try {
          // Remove the app-example folder
          if (fs.existsSync(newDirPath)) {
            await fs.promises.rm(newDirPath, { recursive: true, force: true });
            console.log(`✅ /${newDir} folder deleted.`);
          }

          // Remove the script file
          if (fs.existsSync(scriptFilePath)) {
            await fs.promises.unlink(scriptFilePath);
            console.log("✅ Script file deleted.");
          }

          // Remove the script from package.json
          const packageJson = JSON.parse(
            await fs.promises.readFile(packageJsonPath, "utf-8"),
          );
          if (packageJson.scripts && packageJson.scripts["reset-project"]) {
            delete packageJson.scripts["reset-project"];
            await fs.promises.writeFile(
              packageJsonPath,
              JSON.stringify(packageJson, null, 2) + "\n",
            );
            console.log("✅ Script entry removed from package.json.");
          }

          console.log("\n✅ Project reset complete. Next steps:");
          console.log(
            "1. Run `npx expo start` to start a development server.\n2. Edit app/index.tsx to edit the main screen.",
          );
        } catch (error) {
          console.error(`Error during script execution: ${error}`);
        }
      } else {
        console.log("\n✅ Project reset complete. Next steps:");
        console.log(
          "1. Run `npx expo start` to start a development server.\n2. Edit app/index.tsx to edit the main screen.\n3. Delete the /app-example directory when you're done referencing it.",
        );
      }

      rl.close();
    },
  );
};

const moveDirectories = async () => {
  try {
    // Create the app-example directory
    await fs.promises.mkdir(newDirPath, { recursive: true });
    console.log(`📁 /${newDir} directory created.`);

    // Move old directories to new app-example directory
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      const newDirPath = path.join(root, newDir, dir);
      if (fs.existsSync(oldDirPath)) {
        await fs.promises.rename(oldDirPath, newDirPath);
        console.log(`➡️ /${dir} moved to /${newDir}/${dir}.`);
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Create new /app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /app directory created.");

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 app/index.tsx created.");

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 app/_layout.tsx created.");

    promptForCleanup();
  } catch (error) {
    console.error(`Error during script execution: ${error}`);
  }
};

moveDirectories();
