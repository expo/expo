# @expo/cli

The `@expo/cli` package is a CLI binary that should be used via `expo` like `npx expo start`.

```
npx expo
```

### Contributing

To develop the CLI run (defaults to watch mode):

```
yarn build
```

We highly recommend setting up an alias for the Expo CLI so you can try it in projects all around your computer. Open your `.zshrc` or other config file and add:

```
alias nexpo="/path/to/expo/packages/@expo/cli/build/bin/cli"
```

Then use it with `nexpo` like `nexpo config`. You can also setup a debug version:

```
alias expo-inspect="node --inspect /path/to/expo/packages/@expo/cli/build/bin/cli"
```

Then you can run it, and visit `chrome://inspect/#devices` in Chrome, and press "Open dedicated DevTools for Node" to get a debugger attached to your process. When debugging the CLI, you'll want to disable workers whenever possible, this will make all code run on the same thread, this is mostly applicable to the `start` command, i.e. `expo-inspect start --max-workers 0`.
