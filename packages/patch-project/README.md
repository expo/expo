# patch-project

An Expo config-plugin and tool to support patch-based CNG.

## Usage

First, install the package:

```sh
$ npx expo install patch-project
```

### Generate patches

After manually modifying files inside the **android** or **ios** directories, you can run the following command to generate the patches:

```sh
$ npx patch-project
```

The patches will be generated in the **cng-patches** directory. Whenever you run `npx expo prebuild`, these patches will be applied.

### Advanced usage

The tool also supports more advanced usage, such as converting a bare project back to a managed project. Run `npx patch-project` for more details.
