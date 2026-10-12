import Dispatch
import ExpoModulesCore

/// A C function from the host that runs `task(taskContext)` later on the JavaScript thread.
public typealias PostToJavaScriptThread =
  @convention(c) (
    _ hostContext: UnsafeMutableRawPointer?,
    _ task: @convention(c) (_ taskContext: UnsafeMutableRawPointer?) -> Void,
    _ taskContext: UnsafeMutableRawPointer?
  ) -> Void

/// The runtime that `expo_windows_tester_install` installed the functions into. It lives as long as
/// the process.
nonisolated(unsafe) private var installedRuntime: JavaScriptRuntime?
nonisolated(unsafe) private var installedAppContext: AppContext?
nonisolated(unsafe) private var installedModule: WindowsTesterModule?

/// Installs `globalThis.expoTester`, written with `ExpoModulesJSI` directly, and
/// `globalThis.windowsTesterModule`, written with the `@ExpoModule` macros, into the runtime of a
/// react-native-windows app. Call it on the JavaScript thread.
///
/// - `runtime`: a `facebook::jsi::Runtime *` from react-native-windows.
/// - `hostContext`, `post`: schedule work on the JavaScript thread. MSVC can't call the Clang block
///   that `ExpoModulesJSI` passes to its scheduler, so the host takes a C function and a context.
@_cdecl("expo_windows_tester_install")
public func install(
  runtime runtimePointer: UnsafeMutableRawPointer,
  hostContext: UnsafeMutableRawPointer?,
  post: PostToJavaScriptThread
) -> Bool {
  let scheduler = HostScheduler(hostContext: hostContext, post: post)
  let runtime = JavaScriptRuntime(
    unsafePointer: runtimePointer,
    scheduler: Unmanaged.passRetained(scheduler).toOpaque(),
    dispatch: unsafeBitCast(dispatchToHost, to: UnsafeRawPointer.self)
  )
  installedRuntime = runtime
  let appContext = AppContext(runtime: runtime)
  installedModule = WindowsTesterModule(appContext: appContext)
  installedAppContext = appContext

  return JavaScriptActor.assumeIsolated {
    let tester = runtime.createObject()

    // A synchronous function: `add(a, b)`.
    tester.setProperty("add") { this, arguments in
      return JavaScriptValue(runtime, arguments[0].getDouble() + arguments[1].getDouble())
    }

    // An asynchronous function whose promise resolves on the JavaScript thread.
    tester.setProperty(
      "multiplyAsync",
      value: runtime.createAsyncFunction("multiplyAsync") { this, arguments in
        let a = arguments[0].getDouble()
        let b = arguments[1].getDouble()
        return {
          return JavaScriptValue(runtime, a * b)
        }
      }.asValue()
    )

    // Schedules work from a background thread and resolves with whether it ran on the JavaScript
    // thread. This goes through the host's `post` function.
    tester.setProperty(
      "scheduleFromBackgroundThread",
      value: runtime.createAsyncFunction("scheduleFromBackgroundThread") { this, arguments in
        return {
          let ranOnJavaScriptThread = await withCheckedContinuation { continuation in
            DispatchQueue.global().async {
              runtime.schedule {
                continuation.resume(returning: runtime.isOnJavaScriptThread())
              }
            }
          }
          return JavaScriptValue(runtime, ranOnJavaScriptThread)
        }
      }.asValue()
    )

    runtime.global().setProperty("expoTester", tester)

    // Decorates a JS object with the module's functions, like `expo-modules-core` does.
    let moduleObject = runtime.createObject()
    do {
      try installedModule?._decorateModule(object: moduleObject, in: runtime)
    } catch {
      print("Could not decorate \(WindowsTesterModule._jsName): \(error)")
      return false
    }
    runtime.global().setProperty("windowsTesterModule", moduleObject)
    return true
  }
}

/// The host's scheduling function and its context. `ExpoModulesJSI` passes a pointer to it to
/// `dispatchToHost` as the native scheduler.
private final class HostScheduler {
  let hostContext: UnsafeMutableRawPointer?
  let post: PostToJavaScriptThread

  init(hostContext: UnsafeMutableRawPointer?, post: @escaping PostToJavaScriptThread) {
    self.hostContext = hostContext
    self.post = post
  }
}

/// The scheduler function that `ExpoModulesJSI` calls with a Clang block. It passes the block to
/// the host as a C function and a retained context.
private let dispatchToHost:
  @convention(c) (UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void) -> Void = {
    nativeScheduler, _, callback in
    let scheduler = Unmanaged<HostScheduler>.fromOpaque(nativeScheduler!).takeUnretainedValue()
    let task = Unmanaged.passRetained(ScheduledTask(callback)).toOpaque()
    scheduler.post(scheduler.hostContext, { taskContext in
      Unmanaged<ScheduledTask>.fromOpaque(taskContext!).takeRetainedValue().run()
    }, task)
  }

/// A scheduled callback, kept as a Swift closure.
private final class ScheduledTask {
  let run: () -> Void

  init(_ run: @escaping () -> Void) {
    self.run = run
  }
}
