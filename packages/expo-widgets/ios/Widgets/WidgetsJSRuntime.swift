import Foundation
import JavaScriptCore

struct WidgetJavaScriptError: Error {
  let message: String
}

typealias WidgetJavaScriptResult<Value> = Result<Value, WidgetJavaScriptError>

private final class WidgetsJSRuntime {
  static let shared = WidgetsJSRuntime()

  private let lock = NSRecursiveLock()
  private var context: JSContext?
  private var bundleScript: String?
  private var layoutCache: [String: JSValue] = [:]

  private init() {}

  func render(layout: String, props: [String: Any]?, environment: [String: Any]) -> WidgetJavaScriptResult<[String: Any]> {
    call(layout: layout, functionName: "__expoWidgetRender") { context in
      [props.map { $0 } ?? JSValue(undefinedIn: context) as Any, environment]
    }.flatMap { result in
      guard let renderedNode = result?.toObject() as? [String: Any] else {
        return .failure(WidgetJavaScriptError(message: "Expo widget render did not produce any results."))
      }
      return .success(renderedNode)
    }
  }

  func handlePress(layout: String, props: [String: Any], environment: [String: Any]) -> WidgetJavaScriptResult<[String: Any]?> {
    call(layout: layout, functionName: "__expoWidgetHandlePress") { _ in [props, environment] }
      .map { $0?.toObject() as? [String: Any] }
  }

  private func call(
    layout: String,
    functionName: String,
    arguments: (JSContext) -> [Any]
  ) -> WidgetJavaScriptResult<JSValue?> {
    lock.lock()
    defer { lock.unlock() }

    guard let context = getContext() else {
      return .failure(WidgetJavaScriptError(message: "Could not create context for layout evaluation."))
    }
    guard let layoutValue = getLayoutValue(layout, in: context) else {
      return .failure(WidgetJavaScriptError(message: contextExceptionMessage(context) ?? "Could not evaluate layout."))
    }

    context.exception = nil
    context.setObject(layoutValue, forKeyedSubscript: "__expoWidgetLayout" as NSString)

    let function = context.objectForKeyedSubscript(functionName)
    guard let function, function.isObject else {
      return .failure(WidgetJavaScriptError(message: "Expo widget runtime function \(functionName) is unavailable."))
    }

    let result = function.call(withArguments: arguments(context))
    if let exceptionMessage = contextExceptionMessage(context) {
      return .failure(WidgetJavaScriptError(message: exceptionMessage))
    }
    return .success(result)
  }

  private func getContext() -> JSContext? {
    if let context {
      return context
    }

    guard let context = JSContext() else {
      return nil
    }

    guard let script = getBundleScript() else {
      print("[ExpoWidgets] Missing ExpoWidgets.bundle")
      return nil
    }

    context.evaluateScript(script)
    if let exceptionMessage = contextExceptionMessage(context) {
      print("[ExpoWidgets] Bundle evaluation failed: \(exceptionMessage)")
      return nil
    }

    self.context = context
    return context
  }

  private func getBundleScript() -> String? {
    if let bundleScript {
      return bundleScript
    }

    guard let bundleURL = Bundle.main.url(forResource: "ExpoWidgets", withExtension: "bundle"),
          let bundle = Bundle(url: bundleURL),
          let url = bundle.url(forResource: "ExpoWidgets", withExtension: "bundle"),
          let script = try? String(contentsOf: url, encoding: .utf8) else {
      return nil
    }

    bundleScript = script
    return script
  }

  private func getLayoutValue(_ layout: String, in context: JSContext) -> JSValue? {
    if let layoutValue = layoutCache[layout] {
      return layoutValue
    }

    context.exception = nil
    guard let layoutValue = context.evaluateScript("(\(layout))"),
          !layoutValue.isUndefined else {
      return nil
    }
    guard context.exception == nil else {
      return nil
    }

    layoutCache[layout] = layoutValue
    return layoutValue
  }

  private func contextExceptionMessage(_ context: JSContext) -> String? {
    guard let exception = context.exception else {
      return nil
    }

    context.exception = nil
    return exception.toString() ?? "Unknown JavaScript exception."
  }
}

func evaluateWidgetLayout(
  layout: String,
  props: [String: Any]?,
  environment: [String: Any]
) -> WidgetJavaScriptResult<[String: Any]> {
  WidgetsJSRuntime.shared.render(layout: layout, props: props, environment: environment)
}

func evaluateWidgetButtonPress(
  layout: String,
  props: [String: Any],
  environment: [String: Any]
) -> WidgetJavaScriptResult<[String: Any]?> {
  WidgetsJSRuntime.shared.handlePress(layout: layout, props: props, environment: environment)
}
