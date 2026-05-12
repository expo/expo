# expo-type-information

This package provides a CLI tool and exports functions which can:

- parse Swift expo modules and retrieve type information from them,
- emit typescript code (types, wrapper functions, mocks)

## Installation

First add the package to your npm dependencies

```zsh
npm install expo-type-information
```

To use this package, you need to have `sourcekitten` installed. You can install it using homebrew

```zsh
brew install sourcekitten
```

Note that this package only works on MacOS!

## Usage

With sourcekitten installed you can run the CLI tool and see the available commands:

```zsh
npx expo-type-information
```
