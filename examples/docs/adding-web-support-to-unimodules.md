# Adding Web Support to Unimodules

> All information here is in beta and subject to changes.

Below we've outlined the specification for creating high-quality, performant platform modules that run in the browser.

## Importing Universal Modules

The first step is to make sure the web implementation of a native module can be imported in a web project. We do this by moving the import of the native module to a separate file and overriding it with a web implementation with the same name and a `.web.ts` extension.

**`src/Print.ts`**

```diff
- import { NativeModulesProxy } from 'expo-core';
- const { ExpoPrint } = NativeModulesProxy;

+ import ExpoPrint from './ExpoPrint';
```

**`src/ExpoPrint.ts`**

```ts
import { NativeModulesProxy } from 'expo-core';
export default NativeModulesProxy.ExpoPrint;
```

Now create a web module (`.web.ts`):

**`src/ExpoPrint.web.ts`**

```ts
export default {
  get name(): string {
    return 'ExpoPrint';
  },
};
```

## Handling Unsupported Features

More often than not, the API layer will need to guard against unimplemented methods of the native layer. To this you should start methods that contain Platform Modules with an availability check.

**src/Print.ts**

```ts
import { UnavailabilityError } from 'expo-errors';

async function selectPrinter(): Promise<SelectResult> {
  /**
   * Check if a Universal Module method exists before using it.
   * If it doesn't then throw an error.
   */
  if (!ExpoPrint.selectPrinter) {
    throw new UnavailabilityError('Print', 'selectPrinter');
  }

  /**
   * We explicitly await promises before returning, rather than relying on implicit promises
   */
  return await ExpoPrint.selectPrinter();
}
```

## Creating Universal Modules for web

### Exporting

We use default exports instead of named exports in order to better match the native synatx.

**`src/ExpoPrint.web.ts`**

```diff
✅
+ export default {
+
+ };

❌
- class ExpoPrint {
-
- }
-
- export default new ExpoPrint();
```

### Name

Each module has a `name` property. The name should be consistent across all platforms' implementations of the same module. We use a getter property to make `name` an immutable value.

**Web**

**`src/ExpoPrint.web.ts`**

```ts
export default {
  get name(): string {
    return 'ExpoPrint';
  },
};
```

**iOS**

```objc
EX_EXPORT_MODULE(ExpoPrint);
```

**Android**

```java
@Override
public String getName() {
  return "ExpoPrint";
}
```

### Constants

Constants are defined as `get`ters after the `name` property.

**Web**

**`src/ExpoPrint.web.ts`**

```ts
export default {
  get name(): string {
    return 'ExpoPrint';
  },
  get EVENTS(): string {
    return 'EVENTS';
  },
};
```

**iOS**

```objc
- (NSDictionary *)constantsToExport {
    return @{
        @"EVENTS": @"EVENTS"
    };
}
```

**Android**

```java
@Override
public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("EVENTS", "EVENTS");
    return constants;
}
```

## Methods

Methods are all defined after the `name` property and any constants.

**Web**

**`src/ExpoPrint.web.ts`**

```ts
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
    return;
  },
};
```

**iOS**

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

**Android**

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

## Return value

Currently all methods are `async` and return a promise. This is until Turbo Modules are released, at which time we will add synchronous methods.

**`src/ExpoPrint.web.ts`**

```diff
✅
+ export default {
+   //...
+   async getStringAsync(): Promise<string> {
+     return 'String';
+   },
+ };

❌
- export default {
-   //...
-   getStringAsync(): string {
-     return 'String';
-   },
- };

❌
- export default {
-   //...
-   getStringAsync(): Promise<string> {
-     return Promise.resolve('String');
-   },
- };
```

## Views

[Here are some examples](https://github.com/expo/expo/tree/master/packages/expo/src/effects)

- Create separate views for web
- No external `CSS` files
- Use `JSX` over `createElement`
- Avoid using non-React(-Native) components. ie: `View` instead of `div`
