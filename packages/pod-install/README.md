<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>pod-install</code>
</h1>

<p align="center">A fast, zero-dependency package for cutting down on common issues developers have when running <code>pod install</code>.</p>

<p align="center">
  <img src="https://flat.badgen.net/packagephobia/install/pod-install">
  
  <a href="https://www.npmjs.com/package/pod-install">
    <img alt="Install pod-install instantly" src="https://flat.badgen.net/npm/dw/pod-install" target="_blank" />
  </a>
</p>

<!-- Body -->

## 🚀 Usage

```sh
npx pod-install
```

👋 **Notice:** This package is not limited to native React projects, you can use it with any iOS or Xcode project using CocoaPods (like Ionic, or Flutter).

## 🤔 Why?

All native packages (especially those installed with NPM) often need to explain the following:

- What is CocoaPods.
- What is gem.
- How to install CocoaPods.
- `cd` into the proper directory before running `pod install`.
- You may need run `pod repo update` to fix your project.
- Why CocoaPods requires a darwin machine.

But now you can simply instruct users to run `npx pod-install`.

This package will do the following:

- Check if the machine is darwin.
  - If not then it'll quit with a helpful error message.
- Ensure CocoaPods CLI is installed on the machine.
  - If not then it'll try to install CocoaPods CLI, first with gem, then with homebrew.
- Check if there is an Xcode project in the current directory
  - If not then it'll try again in `ios/` than `macos/` directories (if any exists).
- Run `pod install`
  - If `pod install` fails because the repo is out of date, then it'll run `pod repo update` and try again.

## ⚙️ Options

For more information run `npx pod-install --help` (or `-h`)

| Flag                | Input       | Description                                   | Default                |
| ------------------- | ----------- | --------------------------------------------- | ---------------------- |
| `--non-interactive` | `[boolean]` | Skip prompting to install CocoaPods with sudo | `process.stdout.isTTY` |
| `--quiet`           | `[boolean]` | Only print errors                             | `false`                |

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.
