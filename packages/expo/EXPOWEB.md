Hey Wijnand,

@ide and I have been investigating that track of work. Recently we have been merging in web compatible platform modules.
This is building on the existing Unimodule work that we've been doing to make the native layer of code agnostic and more modular. There currently is no spec for how a web module should be crafted but I can lay out a few principles here.

> All information here is "pre-rc" and subject to changes.

## Terminology

- Platform Module: Native Module gets hard to use when you have a _"web Native Module"_ written in JS.
- Unimodule: An agnostic Platform Module that uses the universal [`expo-core`](https://github.com/expo/expo/tree/master/packages/expo-core) package.
- `[front-end]`: The "front-end" represents the user-facing side of a Unimodule.
- `[back-end]`: The platform specific API of a Unimodule. For instance: Objective-C, Java, & JavaScript.

# Platform Modules

- Currently all alterations to modules should be written in TypeScript.
- All unimplemented methods should be detected, and an `UnavailabilityError` from `expo-errors` should be thrown.
- Avoid creating platform specific features in the "front-end" TypeScript API.

## Tracking progress

We are currently making all changes in the [Expo/expo monorepo with the **[web]** tag](https://github.com/expo/expo/pulls?utf8=%E2%9C%93&q=is%3Apr+label%3A%22project%3A+web%22+)

## Adding web support to an Expo project.

The go-to example of an expo-web app can be found here: [Native Component List](https://github.com/expo/expo/tree/master/apps/native-component-list). All work has been done with **Babel 7**. [Initial NCL web support commit](https://github.com/expo/expo/commit/c8e34fbeb9cb298e9f87b45a93e312b0f7b625b3#diff-1bc4d1d1bb07b272d29a8715e54c8c84)

- Add [`web/`](https://github.com/expo/expo/tree/master/apps/native-component-list/web)
- Add [`webpack.config.js`](https://github.com/expo/expo/blob/master/apps/native-component-list/webpack.config.js) You will also need to change `modules: absolutePath('../../node_modules'),` to `modules: absolutePath('./node_modules'),`. Currently we are targeting all the `node_modules/` to prevent silly errors.
- If you have a `.babelrc` file, upgrade to [`babel.config.js`](https://github.com/expo/expo/blob/master/apps/native-component-list/babel.config.js). Notice that there is platform specific code in here.
- Ensure your main entry point is `App.js` (Default for Expo)
- Make the following changes to your `package.json`

```json
"scripts": {
    ...
    // To test secure features like iOS permissions, you need to add: --https --host <YOUR_IP>
    "web": "webpack-dev-server -d --config ./webpack.config.js --inline --colors --content-base web/",
    "build": "NODE_ENV=production webpack -p --config ./webpack.config.js",
}
```

```json
"dependencies": {
    ...
    "@react-navigation/web": "^1.0.0-alpha.7",
    "case-sensitive-paths-webpack-plugin": "^2.1.2",
    "html-loader": "^0.5.5",
    "html-webpack-plugin": "4.0.0-alpha.2",
    "pnp-webpack-plugin": "^1.2.1",
    "react-art": "^16.6.1",
    "react-dev-utils": "6.0.5",
    "react-dom": "16.6.1",
    "react-native-web": "^0.9.6",
    "webpack-manifest-plugin": "^2.0.4"
}
```

```json
"devDependencies": {
    ...
    "babel-loader": "^8.0.4",
    "babel-plugin-react-native-web": "^0.9.6",
    "babel-preset-expo": "^5.0.0",
    "css-loader": "^1.0.1",
    "expo-yarn-workspaces": "^1.0.0",
    "file-loader": "^2.0.0",
    "react-native-scripts": "^2.0.1",
    "style-loader": "^0.23.1",
    "webpack": "^4.24.0",
    "webpack-cli": "^3.1.2",
    "webpack-dev-server": "3.1.10"
}
```

```json
"browserslist": [
    ">0.2%",
    "not dead",
    "not ie <= 11",
    "not op_mini all"
]
```

You should now be able to run `yarn web` to start webpack. Expo may not work as all of the web changes may not be published to NPM.

## Contributing

Initially you should clone [expo](https://github.com/expo/expo) and work in `apps/` & `packages/`. The following process will outline how to add web support to existing Unimodules.

### Importing Platform Modules

The first step is to make sure the code can be imported in a web project. We do this by moving the native module to a separate file, and creating a web version with the same name and a `.web` extension.

```js
// Print.ts
import { NativeModulesProxy } from 'expo-core';
const { ExpoPrint } = NativeModulesProxy;
```

Becomes:

```js
// Print.ts
import ExpoPrint from './ExpoPrint';
```

```js
// ExpoPrint.ts
import { NativeModulesProxy } from 'expo-core';
export default NativeModulesProxy.ExpoPrint;
```

Now create a web module: `(.web.ts)`

```js
// ExpoPrint.web.ts

export default {
  get name(): string {
    return 'ExpoPrint';
  },
};
```

### Handling Unsupported Features

More often than not you will need to guard for support. To this you should start methods that contain Platform Modules with an availability check.

```js
import { UnavailabilityError } from 'expo-errors';

async function selectPrinter(): Promise<SelectResult> {
  /*
   * Check if a Platform Module method exists before using it.
   * If it doesn't then throw an error.
   */

  if (!ExpoPrint.selectPrinter) {
    throw new UnavailabilityError('Print', 'selectPrinter');
  }

  /*
   * The Expo module audit specifies that all promises should be evaluated.
   */
  return await ExpoPrint.selectPrinter();
}
```

### Creating Platform Modules for web

#### Exporting

```js
// ✅
export default {

}

// ❌ - This may be used in the future do to TypeScript code elimination

export const name = "";

export function foo() {

}

// ❌
class ExpoPrint {

}

export default new ExpoPrint();
```

#### Name

Each module has a name property.

##### Web

```js
export default {
  get name(): string {
    return 'ExpoPrint';
  },
};
```

##### iOS

```objc
EX_EXPORT_MODULE(ExpoPrint);
```

##### Android

```java
@Override
public String getName() {
    return "ExpoPrint";
}
```

#### Constants

Constants are defined as `getters` after the `name` property.

##### Web

```js
export default {
  get name(): string {
    return 'ExpoPrint';
  },
  get EVENTS(): string {
    return 'EVENTS';
  },
};
```

##### iOS

```objc

- (NSDictionary *)constantsToExport {
    return @{
        @"EVENTS": @"EVENTS"
    };
}

```

##### Android:

```java
@Override
public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("EVENTS", "EVENTS");
    return constants;
}
```

#### Methods

Methods are all defined after the `name` property & any constants.

##### Web

```js
export default {
  get name(): string {
    return 'ExpoPrint';
  },
  get Orientation(): OrientationConstant {
    return {
      portrait: 'portrait',
      landscape: 'landscape',
    };
  },
  async printAsync(): Promise<void> {
    return null;
  },
};
```

##### iOS

```objc

EX_EXPORT_MODULE(ExpoPrint);

- (NSDictionary *)constantsToExport
{
    return @{
            @"Orientation": @{
                @"portrait": @"portrait",
                @"landscape": @"landscape"
            }
        };
}

EX_EXPORT_METHOD_AS(printAsync,
                    printAsync:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
    resolve(nil);
}

```

##### Android

```java
 @Override
  public String getName() {
    return "ExpoPrint";
  }

  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("Orientation", Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("portrait", "portrait");
            put("landscape", "landscape");
          }
        }));
      }
    });
  }

  @ExpoMethod
  public void printAsync(final Promise promise) {
      promise.resolve(null);
  }
```

#### Return value

Currently all methods are `async` & return a `Promise`.

```js
// ✅

export default {
  //...
  async getStringAsync(): Promise<string> {
    return 'String';
  },
};

// ❌

export default {
  //...
  getStringAsync(): string {
    return 'String';
  },
};


// ❌

export default {
  //...
  getStringAsync(): Promise<string> {
    return Promise.resolve('String');
  },
};

```

### Views

[Here are some examples](https://github.com/expo/expo/tree/master/packages/expo/src/effects)

- Create separate views for web
- No `CSS`
- Use `JSX` over `createElement`
- Avoid using non-React(-Native) components. ie: `View` instead of `div`
