---
title: Using TypeScript
---

[TypeScript](https://www.typescriptlang.org/) - "JavaScript that scales." TypeScript is a superset of JavaScript which gives you static types and powerful tooling in [Visual Studio Code](https://code.visualstudio.com/) including autocompletion and useful inline warnings for type errors.

TypeScript has first-class support in Expo &mdash; the JavaScript portion of the Expo SDK is built using TypeScript. So let's look at how you can use it.

## Starting from scratch: using a TypeScript template

The easiest way to get started is to initialize your new project using a TypeScript template. When you run `expo init` choose one of the templates with TypeScript in the name and then run `yarn tsc` or `npx tsc` to typecheck the project.

When you create new source files in your project you should use the `.ts` extension or the `.tsx` if the file includes React components.

## Integrating TypeScript in your existing project

- Initialize a new project using a TypeScript template as described above.
- Copy over `tsconfig.json` to your project
- Install the appropriate package versions specified in the new projects `package.json` for `@types/react`, `@types/react-native`, and `typescript`
- Rename files to convert them to TypeScript. For example, you would rename `App.js` to `App.tsx`. We use the `.tsx` extension because the file includes React components (using JSX). If the file did not include any React components, we should use the `.ts` file extension.

## Code editor integration

Visual Studio Code itself is written in TypeScript and has fantastic support for it out of the box. Other editors may require editional setup, consult the documentation for your editor as needed.

## Confguring the TypeScript compiler

`tsconfig.json` contains a variety of options that allow you to customize the behavior of the TypeScript compiler. For example, by default we enable `"noEmit"`, which tells the compiler only to typecheck and not to actually output the compiled JavaScript files (Metro, the React Native packager, takes care of that for us).

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

The default configuration is forgiving and makes it easier to adopt TypeScript. If you'd like to opt-in to more strict type checking, you can add `"strict": true` to the `compilerOptions`. We recommend enabling this to minimize the chance of introducing runtime errors.

Certain language features may require additional configuration, for example if you'd like to use decorators you will need to add the `experimentalDecorators` option. For more information on the available properties see the [TypeScript compiler options documentation](https://www.typescriptlang.org/docs/handbook/compiler-options.html) documentation.


## Learning how to use TypeScript

A good place to start learning TypeScript is the official [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/basic-types.html).

### TypeScript and React components

We recommend reading over and referring to the [React TypeScript CheatSheet](https://github.com/typescript-cheatsheets/react-typescript-cheatsheet) to learn how to type your React components in a variety of common situations.

#### Advanced types

If you would like to go deeper and learn how to create more expressive and powerful types, we recommend the [Advanced Static Types in TypeScript course](https://egghead.io/courses/advanced-static-types-in-typescript) (this requires an egghead.io subscription).
