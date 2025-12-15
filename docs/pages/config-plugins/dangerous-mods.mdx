---
title: Using a dangerous mod
sidebar_title: Dangerous mods
description: Learn about dangerous mods and how to use them when creating a config plugin.
---

import { Collapsible } from '~/ui/components/Collapsible';

Dangerous mods in Expo provide direct access to native project files through string manipulation and regular expressions. While [existing mod plugins](/config-plugins/mods) are the recommended approach, dangerous mods serve as an escape hatch for modifications that cannot be achieved through existing mod plugins.

<Collapsible summary="Why are they considered dangerous?">

Automated direct source code manipulation does not typically compose well. For example, if a dangerous mod replaces text in a source file, and a subsequent dangerous mod expects the original text to be there (perhaps it uses the original text as an anchor for a regular expression) then it is unlikely produce the desired result — depending on how it is written, it may either throw an error or log. Other types of mods are less prone to this type of problem, although it can happen with mods that manipulate source files directly like `withAndroidManifest` and `withPodfile`.

Unlike standard mods, which can run multiple times safely, dangerous mods are rarely guaranteed to be idempotent. Running the same dangerous mod multiple times may produce different results, cause duplicate modifications, or break the target file entirely.

</Collapsible>

## When to use a dangerous mod

Consider using a dangerous mod when:

- **Can't make the modification with a standard mod**: The modification you need isn't supported by existing mod plugins like [`withAndroidManifest`](/config-plugins/mods/#android), [`withPodfile`](/config-plugins/mods/#ios), and so on, or if a library requires specific native modifications that aren't covered by standard plugins.
- **Legacy Expo SDK compatibility:** You are targeting an older Expo SDK version that doesn't include the mod plugin you need.
- **Need to modify text with regexes or replace functions**: You need to perform intricate text manipulations that existing mod plugins do not support. Expo uses dangerous mods internally for large file system refactoring, for example, when a library's name changes.

## How to use a dangerous mod

In a real-world scenario, you can use the example config plugin described in this section directly in your project by following the standard config plugin usage pattern from the [Creating a config plugin section](/config-plugins/plugins/#creating-a-config-plugin). However, with the existing mod plugin called [`withPodfile`](/config-plugins/mods/#ios), you don't have to use the dangerous mod. The example below is just for demonstration of how a dangerous mod can be created and used.

Let's take a look at an example config plugin to modify a file inside a native directory (**ios**). This is useful when you are using Continuous Native Generation in your Expo project. With the help of this config plugin, the native file (**ios/Podfile**) will update anytime the `npx expo prebuild` command runs, whether you run it manually or using EAS Build). This example is an ideal use case when an existing mod plugin cannot edit and update a file inside a native directory.

Following the directory structure and steps to create a config plugin (steps 3, 4, and 5) from [Creating a config plugin section](/config-plugins/plugins/#creating-a-config-plugin), let's assume this config plugin is created inside the **plugins** directory of your Expo project:

```tsx withCustomPodfile.ts
import { ConfigPlugin, IOSConfig, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

const withCustomPodfile: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      try {
        let contents = await fs.readFile(podfilePath, 'utf8');
        const projectName = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);

        contents = addCustomPod(contents, projectName);
        await fs.writeFile(podfilePath, contents);

        console.log('✅ Successfully added custom pod to Podfile');
      } catch (error) {
        console.warn('⚠️ Podfile not found, skipping modification');
      }

      return config;
    },
  ]);
};

function addCustomPod(contents: string, projectName: string): string {
  if (contents.includes("pod 'Alamofire'")) {
    console.log('Alamofire pod already exists, skipping');
    return contents;
  }

  const targetRegex = new RegExp(
    `(target ['"]${projectName}['"] do[\\s\\S]*?use_expo_modules!)`,
    'm'
  );

  return contents.replace(targetRegex, `$1\n  pod 'Alamofire', '~> 5.6'`);
}

export default withCustomPodfile;
```

In the example above, the plugin **withCustomPodfile** will add a CocoaPod dependency automatically to your project's native **ios/Podfile** during the prebuild process. It uses `withDangerousMod` to provide access to the native file system directly and run after the native project is generated, but before any CocoaPod dependency is installed.

The **Podfile** requires direct text manipulation, which is done using a regex pattern inside `addCustomMod` function. This process also requires that the CocoaPod dependency is inserted into the **Podfile** at a specific location, which is after the `use_expo_modules!` statement.

## `withDangerousMod` syntax and requirements

Using `withDangerousMod` requires certain parameters:

1. A native platform (**android** or **ios**)
2. An asynchronous function that receives `config` object with file system access
3. Relative file name/path to access inside the native directory
4. Reading the existing file, modifying its contents, and writing back to the file
5. (Optional) Log custom messages for success and failure state when a plugin executes during the prebuild process

The code snippet below provides a skeleton of the required field and how the config plugin can be structured when using `withDangerousMod`:

```tsx
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

const myPlugin: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'platform', // 1. "ios" | "android"
    async config => {
      // 2. Async modification function
      // 3. Build file paths
      const filePath = path.join(
        config.modRequest.platformProjectRoot, // Native project root
        'path/to/file' // Relative path to target file
      );

      try {
        // 4. Read existing file, modify its contents, and write back to the file
        let contents = await fs.readFile(filePath, 'utf8');
        contents = modifyContents(contents);
        await fs.writeFile(filePath, contents);

        // 5. Log success and failure states
        console.log('✅ Successfully modified file');
      } catch (error) {
        console.warn('⚠️ File modification failed:', error);
      }

      return config;
    },
  ]);
};

// Helper functions to use regex to modify the contents of the file
```

### Available paths in config plugins

Different path properties available in config plugins:

| Path                                          | Type      | Description                                                                                                                                                                                                                                            |
| --------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `config.modRequest.projectRoot`               | `string`  | Universal app project root directory where **package.json** is located. Used for resolving assets, reading **package.json**, and cross-platform operations. Always verify the directory exists and contains **package.json**.                          |
| `config.modRequest.platformProjectRoot`       | `string`  | Platform-specific project root (**projectRoot/android** or **projectRoot/ios**). Used for platform-specific file operations like modifying native configuration files. Ensure the platform directory exists relative to main `projectRoot`.            |
| `config.modRequest.projectName`               | `string`  | [iOS only] Project name component for constructing iOS file paths (for example, **projectRoot/ios/[projectName]/**). Used for iOS-specific file path construction. Only available on iOS platform and should match the actual Xcode project structure. |
| `config.modRequest.introspect`                | `boolean` | Whether running in introspection mode where no filesystem changes should be made. When `true`, mods should only read and analyze files without writing. Used during config analysis and validation.                                                    |
| `config.modRequest.ignoreExistingNativeFiles` | `boolean` | Whether to ignore existing native files. Used in template-based operations, particularly affects entitlements and other native configs to ensure alignment with prebuild expectations.                                                                 |

## Considerations when using a dangerous mod

When using a dangerous mod, consider the following:

- **Limited idempotency guarantees.** Unlike standard mods, which are generally idempotent and can work without the clean flag, dangerous mods are **rarely guaranteed to be idempotent**. This means running the same dangerous mod multiple times may produce different results or cause issues.
- **Experimental and prone to breakage.** Be careful using `withDangerousMod` as it is subject to change in the future. Test your dangerous mods thoroughly with each SDK release, as they are especially prone to breakage when native template changes occur.
- **Use standard mod plugins**. Both Android and iOS offer mod plugins like `withAndroidManifest`, `withPodfile`, `withPodfileProperties`, and so on, to perform common native file modifications. Only use a dangerous mod when there are no [existing mod plugins available](/config-plugins/mods/#available-mod-plugins) to handle your use case.
- **Don't assume a file exists**. Always check the native directory and the relative path to the file before reading/writing to it. If you use CNG, you can always run `npx expo prebuild` to create native **android** and **ios** directories and manually verify a file's existence.
- **Dangerous mods run first**. The order in which dangerous mods execute might be unreliable since dangerous mods run before other modifiers. This can affect the predictability of your build process and may cause conflicts with other modifications.
