# expo-core

## JavaScript installation

```sh
$ yarn add expo-core

# or

$ npm install expo-core --save
```

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXCore'`

and run `pod install`.

### iOS (no Cocoapods)

1.  In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2.  Go to `node_modules` ➜ `expo-core` and add `EXCore.xcodeproj`
3.  In XCode, in the project navigator, select your project. Add `libEXCore.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4.  Run your project (`Cmd+R`).

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


## Usage

### Glossary

- **Native code** — iOS/Android native code.
- **Client code** — code _over the bridge_, for React Native it would be JavaScript app, for Flutter it would be Flutter code.
- **Module** — a class implementing `EXModule`/`expo.core.Module` interface. Its instance can be exported to client code or exposed internally to other modules via *Module Registry*.
- **Module interface** — an interface that should be implemented by the dependency so it can act as an implementation of it.

    On Android modules implement an external interface (`expo-file-system` package implements interface provided by `expo-file-system-interface`). Dependents may access the implementations by calling
    ```java
    public <T> T getModule(Class<T> interfaceClass);
    ```
    method on the module registry.

    On iOS its the consumer who defines required protocol. Implementations are identified by string. Dependents access the implementation by calling
    ```objc
    - (id)getModuleForName:(NSString *)name downcastedTo:(Protocol *)protocol exception:(NSException * __autoreleasing *)outException;
    ```
    method on the module registry. If `outException` argument is provided and an exception occurs (eg. argument mismatch is detected), it is filled with concrete exception data. Call to this function takes the module registered under `name` and tries to downcast it to the protocol provided.
- **Module Registry** — well, a registry of modules. It initializes all the registered modules and provides them with itself, so they can ask for their dependencies (eg. `Camera` would ask for `FileSystem` module).
- **Exported methods** — a subset of instance methods of a given module that should get exposed to client code by specific platform adapter.
- **Exported module** — a class implementing `{EX,expo.core.}ExportedModule` interface. Its methods annotated with `expo.core.ExpoMethod`/`EX_EXPORT_METHOD_AS` are exported to client code.

### Registering modules in the registry

#### iOS

1. Open the header file for your module.
2. Import `<EXCore/EXModule.h>`.
3. Add `EXModule` to a list of implemented interfaces by the module instances (eg. `NSObject <EXModule>`). 
4. Open the implementation file for your module.
5. Use `EX_REGISTER_INTERNAL_MODULE` macro to register the module. Macro requires two arguments (`internalName`). One of them may be empty, eg. `EX_REGISTER_INTERNAL_MODULE(Camera)`.
    > You can also use `EX_REGISTER_MODULE` macro, which expects two arguments (`clientCodeName`, `internalName`). Use it if you want to register a module which should be both accessible internally and exported to client code.
6. That's it!


#### Android

1. Add `expo.core.Module` to your class's imports.
2. Make your module class implement `Module` interface.
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
4. Add your module to be returned by either `List<Module> createModules();` or `List<Module> createModules(Context context);`, depending on whether your module requires `Context` during initialization.
5. You're good to go!

### Exporting module to client code

#### iOS

When registering your module for export to client code, use either `EX_REGISTER_EXPORTED_MODULE(clientCodeName)` or `EX_REGISTER_MODULE(clientCodeName, internalName)`. (You cannot put both `EX_REGISTER_EXPORTED_MODULE` and `EX_REGISTER_INTERNAL_MODULE` in the same file, so for a module exported both internally and exported, use `EX_REGISTER_MODULE`.)

#### Android

Subclass `expo.core.ExportedModule` and add your module to a list returned by `Package` in `createExportedModules()`.

### Exporting methods and calling exported methods

#### iOS

Use `EX_EXPORT_METHOD_AS(exportedName, definition)` macro to export given method to client code. Note that for the module to be available in the client code you have to provide a non-empty client code name in `EX_REGISTER_MODULE(clientCodeName, internalName)`. For now, arguments have to use basic, object types, like `NSString *`, `NSDictionary *`, `NSNumber *`. Methods are required to receive `EXPromiseResolveBlock` and `EXPromiseRejectBlock` as two last arguments.

#### Android

Given that your module class implements `expo.core.ExportedModule` and it is return by the respective `Package`, you just have to annotate the given method with `@ExpoMethod` annotation. Methods are required to receive `expo.core.Promise` as the last argument.

### Exporting constants to client code

#### iOS

Implement `- (NSDictionary *)constantsToExport` method to export constants to client code.

#### Android

Override `public Map<String, Object> getConstants();` method to export constants to client code.
