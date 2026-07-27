// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A group of the most common exceptions that might be necessary for modules.
 */
public struct Exceptions {
  /**
   The Expo app context is no longer available.
   */
  public final class AppContextLost: Exception {
    override public var reason: String {
      "The app context has been lost"
    }
  }

  /**
   The JavaScript runtime is no longer available.
   */
  public final class RuntimeLost: Exception {
    override public var reason: String {
      "The JavaScript runtime has been lost"
    }
  }

  /**
   The UI runtime is no longer available.
   */
  public final class UIRuntimeLost: Exception {
    override public var reason: String {
      "The UI runtime has been lost"
    }
  }

  /// No app context is associated with a JavaScript runtime because that runtime was never prepared
  /// by Expo modules (its `global.expo` object carries no native state). Thrown by code that only
  /// has a runtime and recovers the context via `AppContext.from(runtime:)`.
  public final class AppContextNotFound: Exception {
    override public var reason: String {
      "Cannot find an app context associated with the JavaScript runtime"
    }
  }

  /**
   An exception to throw when the operation is not supported on the simulator.
   */
  public final class SimulatorNotSupported: Exception {
    override public var reason: String {
      "This operation is not supported on the simulator"
    }
  }

  /**
   An exception to throw when the view with the given tag and class cannot be found.
   */
  public final class ViewNotFound<ViewType: UIView>: GenericException<(tag: Int, type: ViewType.Type)> {
    override public var reason: String {
      "Unable to find the '\(param.type)' view with tag '\(param.tag)'"
    }
  }
  public final class SwiftUIViewNotFound<ViewType: ExpoSwiftUIView>: GenericException<(tag: Int, type: ViewType.Type)> {
    override public var reason: String {
      "Unable to find the '\(param.type)' view with tag '\(param.tag)'"
    }
  }

  /**
   An exception to throw when a JavaScript caller passes a number of arguments outside the range the
   native function accepts. The accepted range spans the required count (total minus the trailing run
   of parameters that have a default value or an optional type) through the maximum (total parameters).
   Thrown by the bindings the Expo Modules macros synthesize for `@JS` functions.
   */
  public final class ArgumentsRangeMismatch: GenericException<(functionName: String, received: Int, required: Int, maximum: Int)> {
    override public var reason: String {
      if param.required == param.maximum {
        return "'\(param.functionName)' takes \(param.maximum) argument(s), but received \(param.received)"
      }
      return "'\(param.functionName)' takes from \(param.required) to \(param.maximum) arguments, but received \(param.received)"
    }
  }

  /**
   An exception to throw when there is no module implementing the `EXFileSystemInterface` interface.
   */
  public final class FileSystemModuleNotFound: Exception {
    override public var reason: String {
      "FileSystem module not found, make sure 'expo-file-system' is linked correctly"
    }
  }

  /**
   An exception to throw when there is no module implementing the `EXPermissionsInterface` interface.
   - Note: This should never happen since the module is a part of `expo-modules-core`, but for compatibility reasons
   `appContext.permissions` is still an optional value.
   */
  public final class PermissionsModuleNotFound: Exception {
    override public var reason: String {
      "Permissions module not found"
    }
  }
}
