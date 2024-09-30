<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/sqlite/">
    <img
      src="../../.github/resources/expo-sqlite.svg"
      alt="expo-sqlite"
      height="64" />
  </a>
</p>

Provides access to a database using SQLite (https://www.sqlite.org/). The database is persisted across restarts of your app.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/sqlite/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/sqlite/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-sqlite
```

### Configure for Android

No additional set up necessary.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

### Updating bundled SQLite3

To update bundled SQLite3 and SQLCipher source code under [`vendor/`](https://github.com/expo/expo/tree/main/packages/expo-sqlite/vendor), you can use the helper scripts:

```sh
# You should clone expo/expo git repository first
$ cd packages/expo-sqlite

# Download and build sqlite3.[ch]
# For example, to use sqlite 3.45.3 and sqlcipher 4.6.0
$ ./scripts/prepare_sqlite.ts vendor/sqlite3 3.45.3
$ ./scripts/prepare_sqlite.ts vendor/sqlcipher 4.6.0 --sqlcipher

# Replace sqlite3 symbols to prevent conflict with iOS system sqlite3
$ ./scripts/replace_symbols.ts vendor/sqlite3
$ ./scripts/replace_symbols.ts vendor/sqlcipher
```
