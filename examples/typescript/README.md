# Using Expo for web with TypeScript

From the [TypeScript tutorial](https://docs.expo.io/versions/latest/guides/typescript/)

- Install the TS packages `yarn add -D typescript@^3.3.0 @types/expo@^32.0.0 @types/react-native@^0.57.0`
- Add [`tsconfig.json`](./tsconfig.json):
  ```json
  {
    "compilerOptions": {
      "allowJs": false,
      "allowSyntheticDefaultImports": true,
      "noFallthroughCasesInSwitch": true,
      "experimentalDecorators": true,
      "esModuleInterop": true,
      "isolatedModules": true,
      "jsx": "react-native",
      "lib": ["es6"],
      "moduleResolution": "node",
      "noEmit": true,
      "strict": true,
      "target": "esnext"
    },
    "exclude": ["node_modules"]
  }
  ```
