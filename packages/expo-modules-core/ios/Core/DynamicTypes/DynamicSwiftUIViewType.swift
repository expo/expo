// Copyright 2025-present 650 Industries. All rights reserved.

internal struct DynamicSwiftUIViewType<ViewType: ExpoSwiftUIView>: AnyDynamicType {
  let innerType: ViewType.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let viewType = type as? Self {
      return viewType.innerType == innerType
    }
    return false
  }

  /**
   Casts from the React component instance to the view tag (`Int`).
   */
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    guard let viewTag = findViewTag(jsValue) else {
      throw InvalidViewTagException()
    }
    return viewTag
  }

  /**
   Converts a value of type `Int` to a native view with that tag in the given app context.
   */
  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    guard let viewTag = value as? Int else {
      throw InvalidViewTagException()
    }
    guard Thread.isMainThread else {
      throw NonMainThreadException()
    }
    if let view = appContext.findView(withTag: viewTag, ofType: ExpoSwiftUI.SwiftUIVirtualView<ViewType.Props, ViewType>.self) {
      return view.contentView
    }
    guard let view = appContext.findView(withTag: viewTag, ofType: AnyExpoSwiftUIHostingView.self) else {
      throw Exceptions.SwiftUIViewNotFound((tag: viewTag, type: innerType.self))
    }
    return view.getContentView()
  }

  var description: String {
    return "View<\(innerType)>"
  }
}

private func findViewTag(_ value: JavaScriptValue) -> Int? {
  if value.isNumber() {
    return value.getInt()
  }
  if value.isObject() {
    let nativeTag = value.getObject().getProperty("nativeTag")
    if nativeTag.isNumber() {
      return nativeTag.getInt()
    }
  }
  return nil
}
