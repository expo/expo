The e2e runner for Expo Router and Metro web.

## Contributing

The runnable projects are located in the `__e2e__` directory. We use scripts in the package.json to configure the environment using environment variables such as `E2E_ROUTER_SRC=link-preview` where `link-preview` is the sub-directory in `__e2e__` containing an Expo Router routes directory named `app`.

### E2E Tests

To run the E2E tests, navigate to `packages/@expo/cli` and run `yarn test:e2e <NAME_OF_RUNNABLE_PROJECT>`, or `yarn test:playwright <NAME_OF_RUNNABLE_PROJECT>`

### Native

- Run `yarn prebuild` to create the ios and android directories using the latest `expo-template-bare-minimum` template.
- Run `npx expo run:ios` and `npx expo run:android` to build the native projects.
- For production, use `npx expo run:ios --configuration Release` and `npx expo run:android --variant release`.

### Web

- Start any project and open it in a web browser, e.g. `yarn start:01-rsc`.
- For production, use an export script like `yarn export:web-workers` and then serve it with `npx expo serve`.
