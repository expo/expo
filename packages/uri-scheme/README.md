<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>uri-scheme</code>
</h1>

<p align="center">Interact with native URI schemes</p>

<!-- Body -->

This package provides a simple interface for modifying, viewing, and testing a project's native URI schemes.

👋 **Notice:** This package is not limited to Expo projects! You can use it with any iOS, or Android project.

## 🤔 Why?

We created `uri-scheme` to make it easier to setup, test, and modify deep links, and authentication in native apps.

## 🚀 Usage

### CLI

```sh
# Usage
npx uri-scheme [options] [command]

# View all URIs for a project
npx uri-scheme list

# Open a URI in a simulator
npx uri-scheme open <uri> --ios

# Add a URI to your project
npx uri-scheme add <uri>
```

### Node

In order to make this package fast with npx we don't ship types or doc-blocks.

```js
import { Android, Ios } from 'uri-scheme';

Ios.openAsync({ uri: 'http://expo.dev/' });
```

## ⚙️ Options

For more information run `npx uri-scheme --help` (or `-h`)

| Options       | Description               |
| ------------- | ------------------------- |
| -V, --version | output the version number |
| -h, --help    | output usage information  |

### add

Add URI schemes to a native app.

**Options**

| Options                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `-a, --android`            | Apply action to Android                                         |
| `-i, --ios`                | Apply action to iOS                                             |
| `-n, --name <string>`      | Name to use on iOS.                                             |
| `-r, --role <string>`      | Role to use on iOS: Editor, Viewer                              |
| `--manifest-path <string>` | Custom path to use for an Android project's AndroidManifest.xml |
| `--info-path <string>`     | Custom path to use for an iOS project's Info.plist              |
| `--dry-run`                | View the proposed change                                        |
| `-h, --help`               | output usage information                                        |

**Examples**

- `uri-scheme add com.app`
- `uri-scheme add myapp`

### remove

Remove URI schemes from a native app

**Options**

| Options                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `-a, --android`            | Apply action to Android                                         |
| `-i, --ios`                | Apply action to iOS                                             |
| `--manifest-path <string>` | Custom path to use for an Android project's AndroidManifest.xml |
| `--info-path <string>`     | Custom path to use for an iOS project's Info.plist              |
| `--dry-run`                | View the proposed change                                        |
| `-h, --help`               | output usage information                                        |

**Examples**

- `uri-scheme remove com.app`
- `uri-scheme remove myapp`

### open

Open a URI scheme in a running simulator or emulator

**Options**

| Options              | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `-a, --android`      | Apply action to Android                                     |
| `-i, --ios`          | Apply action to iOS                                         |
| `--package <string>` | The Android package name to use when opening in an emulator |
| `-h, --help`         | output usage information                                    |

**Examples**

- `uri-scheme open com.app://oauth --ios`
- `uri-scheme open http://expo.dev --android`

### list

List the existing URI scheme prefixes for a native app

**Options:**

| Options                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `-a, --android`            | Apply action to Android                                         |
| `-i, --ios`                | Apply action to iOS                                             |
| `--manifest-path <string>` | Custom path to use for an Android project's AndroidManifest.xml |
| `--info-path <string>`     | Custom path to use for an iOS project's Info.plist              |
| `-h, --help`               | output usage information                                        |

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.
