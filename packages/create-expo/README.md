<!-- Title -->

<p align="center">
  <a href="https://github.com/expo/examples">
    <img alt="create-expo-app" src="./.gh-assets/banner.svg">
    <h1 align="center">Create Expo App</h1>
  </a>
</p>

<!-- Header -->

<p align="center">
  <b>The fastest way to create universal React apps</b>
  <br />

  <p align="center">
    <!-- iOS -->
    <img alt="Supports Expo iOS" longdesc="Supports Expo iOS" src="https://img.shields.io/badge/iOS-000.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff" />
    <!-- Android -->
    <img alt="Supports Expo Android" longdesc="Supports Expo Android" src="https://img.shields.io/badge/Android-000.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff" />
    <!-- Web -->
    <img alt="Supports Expo Web" longdesc="Supports Expo Web" src="https://img.shields.io/badge/web-000.svg?style=flat-square&logo=GOOGLE-CHROME&labelColor=4285F4&logoColor=fff" />
  </p>
  <p align="center">
    <a href="https://packagephobia.now.sh/result?p=create-expo">
      <img alt="the best way to bootstrap a react native app" longdesc="the best way to create a react native app" src="https://flat.badgen.net/packagephobia/install/create-expo" />
    </a>
  </p>

</p>

<!-- Body -->

```sh
# Usage for bun, npm, pnpm, and yarn
npx create-expo
bun create expo
pnpm create expo
yarn create expo

# Output help information with all available options
npx create-expo --help
```

Once you're up and running with Create Expo App, visit [this tutorial](https://docs.expo.dev/tutorial/planning/) for more information on building mobile apps with React.

## Templates

Create Expo App prepares an empty Expo project by default. You can choose to use a project with more prepared functionality. For that, you can start Create Expo App with the `--template` flag.

```sh
# Pick from Expo's templates
npx create-expo --template

# Pick the expo-template-tabs template
npx create-expo --template tabs
```

### npm templates

Expo publishes all [templates](../../templates/) through npm packages, versioned by Expo SDK. You can create your own npm templates with `npm pack`, or by publishing to npm.

```sh
# Create from npm
npx create-expo --template tabs # Short for expo-template-tabs
npx create-expo --template expo-template-tabs

# Create from npm using a semver of the template
npx create-expo --template expo-template-blank@50

# Create from local tarball created with `npm pack`
npx create-expo --template ./path/to/template.tgz
```

#### Private npm registry

Create Expo App does not support private registries. In order to use a private template, use the local tarball option.

### GitHub templates

Besides the templates provided by Expo, you can also create your own or use a 3rd party template directly from GitHub. The `--template` flag supports GitHub URLs, including branch, tag, or even specific commit.

```sh
# Create from repository
npx create-expo --template https://github.com/:owner/:repo

# Create from repository using the `:ref` branch or tag
npx create-expo --template https://github.com/:owner/:repo/tree/:ref

# Create from repository using the `sdk-50` branch, and "templates/expo-template-bare-minimum" subdirectory
npx create-expo --template https://github.com/expo/expo/tree/sdk-50/templates/expo-template-bare-minimum
```

## App name customization

Create Expo App customizes the name of the created app by replacing certain placeholder values in the template with the name specified by the user. Most users won't have to think about this process, but it may be relevant for users offering their own templates.

Renaming the app is a two-step process:

1. while unpacking the template, the file and folder names are rewritten
2. after unpacking the template, the file contents are rewritten

By convention, Expo templates use several placeholder values to be searched for and replaced:

- `Hello App Display Name` → The name of the project, without modifications (example [Android](../../templates/expo-template-bare-minimum/android/app/src/main/res/values/strings.xml#L2))
- `HelloWorld` → The name of the project with sanitization as described below (example [Android](../../templates/expo-template-bare-minimum//android/settings.gradle#L1), [iOS](../../templates/expo-template-bare-minimum/ios/Podfile#L16))
- `helloworld` → The _lower-cased_ name of the project with sanitization as described below (example [Android](../../templates/expo-template-bare-minimum/android/app/build.gradle#L86))

Although all file and folder names are rewritten, only files specified by the "rename config" have their contents rewritten. This is determined by the `defaultRenameConfig` constant in [./src/Template.ts](./src/Template.ts).

### Sanitization

Some characters aren't allowed in certain places, that's why Create Expo App applies sanitization to the project name.

- Remove all non-word `\W` and underscore `_` characters.
- Normalize the string using Unicode's normalization form "canonical composition" or `NFD`.
- Remove all accent characters `u0300-u036f`.

## Special files

Due to some limitations with `npm pack`, some files are handled differently.

- `gitignore` → Renamed to `.gitignore` due to `npm pack` skipping `.gitignore` files, see [npm/npm#1862](https://github.com/npm/npm/issues/1862)
