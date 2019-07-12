---
title: Using TypeScript
---

[TypeScript](https://www.typescriptlang.org/) - "JavaScript that scales." TypeScript is a superset of JavaScript which gives you static types and powerful tooling in [Visual Studio Code](https://code.visualstudio.com/).

We are currently in the process of updating our entire SDK to use TypeScript and we will provide first class support in the very near future. For the moment, support is provided through the Expo user community maintained Expo SDK type definitions, which you can contribute to [here](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/expo) if you encounter any deficiencies. Now let's walk through how to set up TypeScript on a blank Expo app initialized through `expo-cli`. If you'd rather just jump right ahead to the finished result, you can clone [this repository](https://github.com/expo/typescript-starter-example).

## Installation

We need to install three packages: the `typescript` compiler, the `expo` type definition and the `react-native` type definition.

```
npm install --save-dev typescript@^3.3.0 @types/expo@^32.0.0 @types/react-native@^0.57.0
```

## Configuration

Create a file in the root of your project called `tsconfig.json` and put this in it:

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "jsx": "react-native",
    "lib": ["dom", "esnext"],
    "moduleResolution": "node",
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

For information on these properties, see the [tsconfig.json documentation](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).

## Rename your files

Let's rename `App.js` to `App.tsx`. We use the `.tsx` extension because the file includes React components (using JSX). If the file did not include any React components, we should use the `.ts` file extension.

## You are now using TypeScript

Now everything is ready and you can run `expo start` and open the app. If you open the project in Visual Studio Code and start working on it, you will see that suddenly the editor is much more helpful than before - autocompletion and suggestions, useful warnings when you making a typo, annoying warnings when you think you're doing something correctly but actually you're not, etc. Enjoy, and read the [TypeScript Handbook](https://www.typescriptlang.org/docs/home.html) to continue your journey to learning TypeScript.