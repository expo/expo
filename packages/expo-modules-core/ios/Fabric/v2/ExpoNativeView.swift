// Copyright 2026-present 650 Industries. All rights reserved.

/// The base class of the views of Expo Modules v2. A view subclasses it, binds its props type
/// with `@ExpoView<Props>` and is registered with `@ExpoModule(views:)`:
///
///     @ExpoView<CardProps>
///     final class CardView: ExpoNativeView {
///       func didUpdateProps(_ diff: CardProps.Diff) {
///         if diff.changed(.color) {
///           backgroundColor = props.color
///         }
///       }
///     }
///
/// The view is the Fabric component view itself, so it has no wrapper view and takes React Native's view
/// styles, such as the background, borders and transforms.
@objc(ExpoNativeView)
open class ExpoNativeView: ExpoNativeViewObjC {
  /// The app context that the view belongs to.
  public private(set) weak var appContext: AppContext?

  /// The `DecodedViewProps` of the mounted props, or `nil` before the first props are applied.
  internal var decodedProps: AnyObject?

  public override init(frame: CGRect) {
    self.appContext = AppContext.appContextForNewViews
    super.init(frame: frame)
  }

  @available(*, unavailable)
  public required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  public final override func updateDecodedProps(_ decodedProps: Any?) {
    guard let view = self as? any AnyNativeView else {
      log.error(
        "The view '\(type(of: self))' doesn't conform to AnyNativeView, so its props aren't applied. Add @ExpoView<Props> to the class"
      )
      return
    }
    view.applyDecodedProps(decodedProps.map { $0 as AnyObject })
  }

  // MARK: - Registration

  /// The types of the registered views, keyed by the component name.
  @MainActor
  private static var registeredViewTypes = [String: ObjectIdentifier]()

  /// Registers the view type in `RCTComponentViewFactory` under the given component name. Each component is
  /// registered once per process. A view of a module has the same name as the views of `ExpoFabricView`
  /// (`ExpoFabricView.componentName`), so `requireNativeView` finds it, and a view of a package has
  /// `packageComponentName`.
  ///
  /// `RCTComponentViewFactory` maps each component to a class and creates the views with `+[viewClass new]`.
  /// So the registered class is a subclass of the view type that is named after the component, the same way
  /// that `ExpoFabricView.viewClass` does it. The subclass adds no methods.
  @MainActor
  internal static func registerComponent(_ viewType: any AnyNativeView.Type, componentName: String) {
    guard viewType is ExpoNativeView.Type else {
      log.error("The view '\(viewType)' isn't registered as '\(componentName)', because it isn't an ExpoNativeView")
      return
    }
    if let registeredViewType = registeredViewTypes[componentName] {
      if registeredViewType != ObjectIdentifier(viewType) {
        log.error(
          "The view '\(viewType)' has the same component name '\(componentName)' as another view, so it isn't registered"
        )
      }
      return
    }
    guard let viewClass = objc_allocateClassPair(viewType, componentName, 0) else {
      log.error("Cannot register the view '\(viewType)' because a class named '\(componentName)' already exists")
      return
    }
    objc_registerClassPair(viewClass)
    registeredViewTypes[componentName] = ObjectIdentifier(viewType)

    let propsDecoder = viewType._makePropsDecoder(viewName: unqualifiedTypeName(viewType))
    ExpoNativeViewObjC.registerComponentViewClass(viewClass, propsDecoder: propsDecoder)
  }

  /// Returns the component name of a view that the package with the given name exports, for example
  /// `expo_blur_ExpoBlurView`. It's also the name of an Objective-C class, so the characters that a class name
  /// can't have are replaced with `_`, and the `@` of a scoped package name is left out (`@expo/ui` is `expo_ui`).
  nonisolated internal static func packageComponentName(packageName: String, viewName: String) -> String {
    let unscopedName = packageName.hasPrefix("@") ? String(packageName.dropFirst()) : packageName
    let sanitizedName = String(unscopedName.map { $0.isASCII && ($0.isLetter || $0.isNumber) ? $0 : "_" })
    return "\(sanitizedName)_\(viewName)"
  }
}
