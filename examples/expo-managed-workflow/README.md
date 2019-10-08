# Using Expo for web in a `expo init` project

> This is a **beta release** and subject to breaking changes. Do not use this in production yet.

- Install the latest expo-cli `npm i -g expo-cli`
- Create new project
  - `expo init AwesomeProject` (select blank project)
  - `cd AwesomeProject`
- Start with `expo start` then press `w`
  - or better `expo start --web`

## Adding web support

- Add dependencies:
  - [react native web][rnw]: `yarn add react-native-web react-dom`
  - Upgrade to Expo SDK 33+: `yarn add expo`
- Add `"web"` to `platforms` in the [**`app.json`**](./app.json):
  ```diff
  "platforms": [
      "android",
      "ios",
  +    "web"
  ]
  ```

[rnw]: https://github.com/necolas/react-native-web/
