<!-- Title -->
<h1 align="center">
👋 Welcome to the <br>Expo Doctor package.
</h1>

## 🚀 Usage

### CLI

```sh
# Usage
npx expo-doctor [options] [path]
```

## ⚙️ Options

For more information run `npx expo-doctor --help` (or `-h`)

| Options       | Description               |
| ------------- | ------------------------- |
| -h, --help    | output usage information  |
| -v, --version | output the version number |

## Environment variables

| Variable name                             | Description                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK | Allow disabling the check for installed dependencies that are not compatible with the SDK version. |
| EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK        | Enable experimental React Native Directory checks.                                                 |

## Testing and development

1. (First time only) Setup an alias inside your **.zschrc** so you can run the development version on other projects, e.g., `alias nexpo-doctor="/path/to/expo/packages/expo-doctor/build/index.js"`
2. Run `yarn watch` inside of project folder.
3. In your test project, run `nexpo-doctor`

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.
