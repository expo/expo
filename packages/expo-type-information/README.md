# expo-type-information

> [!WARNING]
> This package only works on macOS.

This package provides a CLI tool and exports functions which can:

- Parse Swift expo modules and retrieve type information from them
- Emit typescript code (types, wrapper functions, mocks)

## Installation

First, add the package to your npm dependencies:

```
npm install expo-type-information
```

To use this package, you need to have `sourcekitten` installed. You can install it using Homebrew:

```
brew install sourcekitten
```

## Usage

With `sourcekitten` installed you can run the CLI tool and see the available commands:

```
npx expo-type-information
```
