import Foundation
import JavaScriptCore

func createWidgetContext(layout: String, props: [String: Any]) -> JSContext? {
  guard let context = JSContext() else {
    return nil
  }

  context.exceptionHandler = { _, exception in
    if let exception {
      print("[ExpoWidgets] Layout evaluation failed: \(exception)")
    }
  }

  // Inject ExpoUI bundle
  context.evaluateScript(expoUIBundleJS)
  context.evaluateScript("""
  (function () {
    if (typeof __r !== 'function') {
      return;
    }
    __r(0)
  })();
  """)
  let layoutValue = context.evaluateScript("(\(layout))")
  context.setObject(layoutValue, forKeyedSubscript: "__expoWidgetLayout" as NSString)
  context.setObject(props, forKeyedSubscript: "__expoWidgetProps" as NSString)
  return context
}

