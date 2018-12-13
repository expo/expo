# expo-core

## JavaScript installation

```sh
$ yarn add expo-core

# or

$ npm install expo-core --save
```

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the following dependency to your `Podfile`:

`pod 'EXCore', path: '../node_modules/expo-core/ios'`

and run `pod install`.

### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-core')
    ```
3.  If you're using ProGuard, you'll need to append these lines to your ProGuard rules file for it not to strip out methods required for Expo modules to work.
    ```pro
    -keepclassmembers class * {
      @expo.core.interfaces.ExpoProp *;
    }
    -keepclassmembers class * {
      @expo.core.interfaces.ExpoMethod *;
    }
    ```

## Usage

### Glossary

- **Native code** — iOS/Android native code.
- **Client code** — code _over the bridge_, for React Native it would be the JavaScript app, for Flutter it would be Flutter code.
- **Internal module** — a class implementing `EXInternalModule`/`expo.core.interfaces.InternalModule` interface. Its instance can be exposed internally to other modules via *Module Registry* (how dependants reference modules differs between platforms).
- **Module interface** — an interface that should be implemented by the dependency so it can act as an implementation of it.

    On Android modules implement an external interface (`expo-file-system` package implements interface provided by `expo-file-system-interface`). Dependants may access the implementations by calling
    ```java
    public <T> T getModule(Class<T> interfaceClass);
    ```
    method on the module registry.

    On iOS its the consumer who defines required protocol. Implementations are identified by a protocol. Dependants access the implementation by calling
    ```objc
    - (id)getModuleImplementingProtocol:(Protocol *)protocol;
    ```
    method on the module registry.
- **Module Registry** — well, a registry of modules. Instance of this class is used to fetch another internal or exported module.
- **Exported methods** — a subset of instance methods of a given module that should get exposed to client code by specific platform adapter.
- **Exported module** — a subclass of `{EX,expo.core.}ExportedModule`. Its methods annotated with `expo.core.ExpoMethod`/`EX_EXPORT_METHOD_AS` are exported to client code.
- **View manager** — a class capable of providing platform adapter with custom views.

### Registering modules in the registry

#### iOS

1. Open the header file for your module.
2. Import `<EXCore/EXInternalModule.h>`.
3. Add `EXModule` to a list of implemented interfaces by the module instances (eg. `NSObject <EXInternalModule>`). 
4. Open the implementation file for your module and implement methods required by the protocol.
5. Use `EX_REGISTER_MODULE();` macro to register the module.
6. That's it!

#### Android

1. Add `expo.core.interfaces.InternalModule` to your class's imports.
2. Make your module class implement `InternalModule` interface.
    1. Implement `public List<Class> getExportedInterfaces();`. Return a list of module interfaces implemented by the class, for example:
        ```java
        return Collections.singletonList((Class) expo.interfaces.filesystem.FileSystem.class);
        ```
3. Create a `Package` class for your module, unless you already have one.
    1. A `Package` class should implement `expo.core.Package` interface (a `BasePackage` class is provided for you not to have to implement all the initialization flavors at once).
    2. Add the `Package` to a `List` provided to `ModuleRegistryBuilder`.
        ```java
        new ModuleRegistryBuilder(
          Arrays.<Package>asList(
            new FileSystemPackage()
          )
        )
        ```
4. Add your module to be returned by `List<InternalModule> createInternalModules(Context context);`.
5. You're good to go!

### Exporting module to client code

#### iOS

When registering your module for export to client code, you must first decide whether the class will only be exported to client code or will it be both internal and exported module. If the former is applicable, you easily just subclass `EXExportedModule` and use macro `EX_EXPORT_MODULE(clientCodeName)` to provide a name under which it should be exported. If your module should be both internal and exported module, you also have to subclass `EXExportedModule`, but this time use `EX_REGISTER_MODULE()` in the implementation and then manually override methods `exportedInterfaces` and `exportedModuleName`.

#### Android

Subclass `expo.core.ExportedModule` and add your module to a list returned by `Package` in `createExportedModules()`.

### Exporting methods and calling exported methods

#### iOS

Use `EX_EXPORT_METHOD_AS(exportedName, definition)` macro to export given method to client code. Note that for the module to be available in the client code you have to provide a non-empty client code name in `EX_EXPORT_MODULE(clientCodeName)` or `- (const NSString *)exportedModuleName`. For now, arguments have to use basic, object types, like `NSString *`, `NSDictionary *`, `NSNumber *`. Methods are required to receive `EXPromiseResolveBlock` and `EXPromiseRejectBlock` as two last arguments.

#### Android

Given that your module subclasses `expo.core.ExportedModule` and it is returned by the respective `Package`, you just have to annotate the given method with `@ExpoMethod` annotation. Methods are required to receive `expo.core.Promise` as the last argument.

### Exporting constants to client code

#### iOS

Implement `- (NSDictionary *)constantsToExport` method to export constants to client code.

#### Android

Override `public Map<String, Object> getConstants();` method to export constants to client code.

### Creating a custom view manager

#### iOS

Subclass `EXViewManager` and override at least `- (UIView *)view` and `- (NSString *)viewName`. Register it with `EX_REGISTER_MODULE()`.

Use `EX_VIEW_PROPERTY(propName, propClass, viewClass)` to define custom view properties.

#### Android

TODO: ViewManager from interface to a class

Implement `expo.core.interfaces.ViewManager` in your class and respond with its instance in `List<ViewManager> createViewManagers(Context context);` in corresponding `Package`.

Annotate prop setter methods with `@ExpoProp(name = <name>)` to define custom view properties.
