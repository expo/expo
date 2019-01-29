# Creating Web Platform Modules

> All information here is "pre-rc" and subject to changes.

Below we've outlined the specification for creating high-quality, performant platform modules that run in the browser.

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
// src/Print.ts

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

Constants are defined as `get`ters after the `name` property.

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

Currently all methods are `async` & return a `Promise`. This is until Turbo Modules are released, at which time we will add synchronous methods.

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
