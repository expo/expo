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

  /// The `DecodedViewProps` of the mounted props, or `nil` before the first props are applied. `final` and
  /// without exclusivity checks, because it's read and written on each props update, only on the main
  /// thread and never during another access.
  @usableFromInline
  @exclusivity(unchecked)
  internal final var decodedProps: AnyObject?

  public override init(frame: CGRect) {
    self.appContext = AppContext.appContextForNewViews
    super.init(frame: frame)
  }

  @available(*, unavailable)
  public required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  /// The view's type as an `AnyNativeUIKitView`, found on the first props update, so later updates skip the
  /// conformance check. Accessed only on the main thread, in `updateDecodedProps(_:)`.
  @exclusivity(unchecked)
  nonisolated(unsafe) private var nativeViewType: (any AnyNativeUIKitView.Type)?

  public nonisolated final override func updateDecodedProps(_ decodedProps: UnsafeRawPointer?) {
    assert(Thread.isMainThread, "Fabric mounts the props of a view on the main thread")
    guard let viewType = nativeViewType ?? findNativeViewType() else {
      return
    }
    let object = decodedProps.map { Unmanaged<AnyObject>.fromOpaque($0).takeUnretainedValue() }
    viewType._applyDecodedProps(object, to: self)
  }

  private nonisolated func findNativeViewType() -> (any AnyNativeUIKitView.Type)? {
    guard let viewType = type(of: self) as? any AnyNativeUIKitView.Type else {
      log.error(
        "The view '\(type(of: self))' doesn't conform to AnyNativeUIKitView, so its props aren't applied. Add @ExpoView<Props> to the class"
      )
      return nil
    }
    nativeViewType = viewType
    return viewType
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
  /// `RCTComponentViewFactory` maps each component to a class, asks the class for the descriptor of its component,
  /// and creates the views with `+[viewClass new]`. So a class can be one component only. The component is
  /// `_componentViewBaseClass` itself. When that class is already another component, for example because a module
  /// and a package export the same view type, the component is a subclass named after it, which adds no methods.
  @MainActor
  internal static func registerComponent(_ viewType: any AnyNativeView.Type, componentName: String) {
    if let registeredViewType = registeredViewTypes[componentName] {
      if registeredViewType != ObjectIdentifier(viewType) {
        log.error(
          "The view '\(viewType)' has the same component name '\(componentName)' as another view, so it isn't registered"
        )
      }
      return
    }
    // The decoder is created on the first decode, so registering a view that the app doesn't render doesn't create it.
    // `_makePropsDecoder` is nonisolated, because it runs on the thread that decodes.
    nonisolated(unsafe) let decodedViewType = viewType
    let makePropsDecoder: @Sendable () -> ViewPropsDecoding = {
      return decodedViewType._makePropsDecoder(viewName: unqualifiedTypeName(decodedViewType))
    }
    let baseClass: AnyClass = viewType._componentViewBaseClass

    if !ExpoNativeViewObjC.registerComponentViewClass(baseClass, componentName: componentName, makePropsDecoder: makePropsDecoder) {
      guard let viewClass = objc_allocateClassPair(baseClass, componentName, 0) else {
        log.error("Cannot register the view '\(viewType)' because a class named '\(componentName)' already exists")
        return
      }
      objc_registerClassPair(viewClass)
      ExpoNativeViewObjC.registerComponentViewClass(viewClass, componentName: componentName, makePropsDecoder: makePropsDecoder)
    }
    registeredViewTypes[componentName] = ObjectIdentifier(viewType)
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
