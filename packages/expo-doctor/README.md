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

Run `pnpm build` (or `pnpm watch`) inside of `expo-doctor`'s project folder.

Then, in your test project, run `path-to-expo/packages/expo-doctor/bin/expo-doctor.js`

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.
