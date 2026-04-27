// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

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
    // Direct match, the virtual view's content type matches exactly.
    // e.g. View(SlotView.self)
    // Both the production (`SwiftUIVirtualView`, NSObject-based) and dev
    // (`SwiftUIVirtualViewDev`, UIView-based) concrete classes are checked —
    // only one is instantiated at runtime per build, but the type-erased
    // `findView` lookup needs to know about both. Without this, dev builds
    // would fall through to the `ViewWrapper` branch below, which recursively
    // unwraps and is not strictly equivalent to returning `contentView` as-is.
    // TODO: Migrate to @MainActor to get compile-time thread safety instead of runtime dispatch
    return try performSynchronouslyOnMainThread {
      if let view = appContext.findView(withTag: viewTag, ofType: ExpoSwiftUI.SwiftUIVirtualView<ViewType.Props, ViewType>.self) {
        return view.contentView
      }
      if let view = appContext.findView(withTag: viewTag, ofType: ExpoSwiftUI.SwiftUIVirtualViewDev<ViewType.Props, ViewType>.self) {
        return view.contentView
      }
      // For wrapper types
      // e.g. ExpoUIView(SecureFieldView.self)
      if let provider = appContext.findView(withTag: viewTag, ofType: ExpoSwiftUI.ViewWrapper.self),
         let innerView = provider.getWrappedView() as? ViewType {
        return innerView
      }
      // For views using WithHostingView protocol.
      // e.g. View(HostView.self) where HostView conforms to WithHostingView
      guard let view = appContext.findView(withTag: viewTag, ofType: AnyExpoSwiftUIHostingView.self) else {
        throw Exceptions.SwiftUIViewNotFound((tag: viewTag, type: innerType.self))
      }
      return view.getContentView()
    }
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
