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

  /// Registers the view type of the given module in `RCTComponentViewFactory`. Each component is registered
  /// once per process, under the same name as the views of `ExpoFabricView`, so `requireNativeView` finds it.
  ///
  /// `RCTComponentViewFactory` maps each component to a class and creates the views with `+[viewClass new]`.
  /// So the registered class is a subclass of the view type that is named after the component, the same way
  /// that `ExpoFabricView.viewClass` does it. The subclass adds no methods.
  @MainActor
  internal static func registerComponent(_ viewType: any AnyNativeView.Type, moduleName: String, viewName: String) {
    let componentName = ExpoFabricView.componentName(moduleName: moduleName, viewName: viewName)

    guard viewType is ExpoNativeView.Type else {
      log.error("The view '\(viewName)' from module '\(moduleName)' isn't registered, because it isn't an ExpoNativeView")
      return
    }
    if let registeredViewType = registeredViewTypes[componentName] {
      if registeredViewType != ObjectIdentifier(viewType) {
        log.error(
          "The view '\(viewName)' from module '\(moduleName)' has the same component name as another view, so it isn't registered"
        )
      }
      return
    }
    guard let viewClass = objc_allocateClassPair(viewType, componentName, 0) else {
      log.error(
        "Cannot register the view '\(viewName)' from module '\(moduleName)' because a class named '\(componentName)' already exists"
      )
      return
    }
    objc_registerClassPair(viewClass)
    registeredViewTypes[componentName] = ObjectIdentifier(viewType)

    let propsDecoder = viewType._makePropsDecoder(viewName: unqualifiedTypeName(viewType))
    ExpoNativeViewObjC.registerComponentViewClass(viewClass, propsDecoder: propsDecoder)
  }
}
