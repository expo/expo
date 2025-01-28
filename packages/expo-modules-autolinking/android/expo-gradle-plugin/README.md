# expo-modules-plugin

This project contains two Gradle plugins that are used to inject the necessary dependencies and configurations into an Android project that uses Expo modules. It also provides a shared project that contains common code for both plugins.

### `expo-autolinking-settings-plugin`

The settings plugin is an entry point for our setup. It should be applied to the root `settings.gradle` file of the application. 

Responsibilities:
- Add all modules into the project hierarchy; modules won't be added to the dependency graph. The `expo` package will depend on them rather than adding them directly to the app project.
- Add extra Maven repositories.
- Link and apply custom plugins.
- Expose autolinking configuration.

### `expo-autolinking-plugin`

This plugin shouldn't be applied directly by the end user. It'll be applied by the `expo` package.

Responsibilities:
- Ensure the dependencies are evaluated before the `expo` package.
- Add previously linked modules to the dependency graph.
- Create a task that will generate the package list file.

### `shared`

This project contains common code for both plugins.
