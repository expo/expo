# Adding Expo

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

- Install [React Native for Web][rnw] and React Native: `yarn add react-native-web react-native`
- Create an [**`app.json`**](./app.json):
  ```ts
  {
      "expo": {
        "platforms": ["web"]
      }
  }
  ```
- Install: `yarn add -D babel-preset-expo`
- Create [**`babel.config.js`**](./babel.config.js)
  ```ts
  module.exports = {
    presets: ['babel-preset-expo'],
  };
  ```
- Install the **`expo-cli`** with `npm i -g expo-cli`
- Start the project with `expo start --web`
  - You may want to add `.expo` to your **`.gitignore`**.
  - (**`--web`**) will automatically open the web page in your browser.
  - Expo will only start the webpack dev server (and not metro) because `"web"` is the only platform defined in `"platforms"`.
  - You can prevent the debug screen from opening with: **`--non-interactive`**
  - Toggle the production environment variable with **`--no-dev`**. This will persist commands so remember to turn it off with **`--dev`**.

Now you can import any of the `react-native-web` modules!

```ts
import { View } from 'react-native';
```

[rnw]: https://github.com/necolas/react-native-web
