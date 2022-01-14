# expo

The `expo` package is an umbrella package that contains the client-side code (ex: JavaScript) for accessing system functionality such as contacts, camera, and location in Expo apps.

Some of the Expo APIs are implemented in this package, while others are implemented in universal modules under the parent `packages` directory.

See [CONTRIBUTING](./CONTRIBUTING.md) for instructions on working on this package and the universal modules.

## CLI

```
npx expo
```

### Contributing

To develop the CLI run (defaults to watch mode):

```
yarn build:cli
```

We highly recommend setting up an alias for the Expo CLI so you can try it in projects all around your computer. Open your `.zshrc` or other config file and add:

```
alias nexpo="/path/to/expo/packages/expo/build-cli/bin/cli"
```

Then use it with `nexpo` like `nexpo config`. You can also setup a debug version:

```
alias expo-inspect="node --inspect /path/to/expo/packages/expo/build-cli/bin/cli"
```

Then you can run it, and visit `chrome://inspect/#devices` in Chrome, and press "Open dedicated DevTools for Node" to get a debugger attached to your process. When debugging the CLI, you'll want to disable workers whenever possible, this will make all code run on the same thread, this is mostly applicable to the `start` command, i.e. `expo-inspect start --max-workers 0`.
