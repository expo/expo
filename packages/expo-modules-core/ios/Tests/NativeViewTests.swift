// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

// MARK: - Test view

@ViewProps
private struct NativeCardProps {
  var title = "Untitled"
  var radius: Double = 4
  var onTap: () -> Void
}

@ExpoView<NativeCardProps>
private final class NativeCardView: ExpoNativeView {
  var diffs: [NativeCardProps.Diff] = []

  func didUpdateProps(_ diff: NativeCardProps.Diff) {
    diffs.append(diff)
  }
}

@ExpoView<NativeCardProps>
private final class OtherCardView: ExpoNativeView {}

@ExpoModule("NativeCards", views: [NativeCardView.self])
private final class NativeCardsModule: Module {}

private enum First {
  @ExpoView<NativeCardProps>
  final class MarkerView: ExpoNativeView {}
}

private enum Second {
  @ExpoView<NativeCardProps>
  final class MarkerView: ExpoNativeView {}
}

@ExpoModule("Markers", views: [First.MarkerView.self, Second.MarkerView.self])
private final class MarkersModule: Module {}

private enum V1 {
  final class NativeCardView: ExpoView {}
}

@ExpoModule("MixedCards", views: [NativeCardView.self, OtherCardView.self])
private final class MixedCardsModule: Module {
  func definition() -> ModuleDefinition {
    View(V1.NativeCardView.self) {}
  }
}

@ExpoModule("CollidingCards", views: [NativeCardView.self])
private final class CollidingCardsModule: Module {
  func definition() -> ModuleDefinition {
    Constant("NativeCardView") { "constant" }
  }
}

// MARK: - Tests

/// Applies decoded props to an `@ExpoView` the way `ExpoNativeViewObjC` does when Fabric mounts them.
@Suite
@MainActor
struct NativeViewTests {
  private let view = NativeCardView(frame: .zero)

  private func decoded(
    _ props: NativeCardProps,
    changed: NativeCardProps.PropSet,
    previous: DecodedViewProps<NativeCardProps>? = nil
  ) -> DecodedViewProps<NativeCardProps> {
    return DecodedViewProps(props: props, changedProps: changed, previous: previous)
  }

  @Test
  func `props are the defaults before the first update`() {
    #expect(view.props.title == "Untitled")
    #expect(view.diffs.isEmpty)
  }

  @Test
  func `first update without decoded props applies the defaults`() {
    view.updateDecodedProps(nil)

    #expect(view.diffs.count == 1)
    #expect(view.diffs[0].isInitial)
    #expect(view.diffs[0].changedNames == [.title, .radius])
    #expect(view.props.radius == 4)

    // Later props without decoded props have nothing to apply.
    view.updateDecodedProps(nil)
    #expect(view.diffs.count == 1)
  }

  @Test
  func `updates give the props changed since the mounted ones`() {
    var props = NativeCardProps()
    props.title = "Card"
    let created = decoded(props, changed: .title)
    view.updateDecodedProps(created)

    props.radius = 8
    let updated = decoded(props, changed: .radius, previous: created)
    view.updateDecodedProps(updated)

    #expect(view.diffs.count == 2)
    #expect(view.diffs[0].isInitial)
    #expect(!view.diffs[1].isInitial)
    #expect(view.diffs[1].changedNames == [.radius])
    #expect(view.diffs[1].oldValue(\.radius) == 4)
    #expect(view.props.title == "Card")
    #expect(view.props.radius == 8)
  }

  @Test
  func `first decoded props after the defaults change all props`() {
    view.updateDecodedProps(nil)

    // The defaults aren't decoded props that the decoder knows about, so the first decoded props
    // can't be compared with them and all props count as changed.
    var props = NativeCardProps()
    props.title = "Card"
    view.updateDecodedProps(decoded(props, changed: .title))

    #expect(view.diffs.count == 2)
    #expect(!view.diffs[1].isInitial)
    #expect(view.diffs[1].changedNames == [.title, .radius])
    #expect(view.props.title == "Card")
  }

  @Test
  func `the same decoded props are applied once`() {
    let created = decoded(NativeCardProps(), changed: [])
    view.updateDecodedProps(created)
    view.updateDecodedProps(created)

    #expect(view.diffs.count == 1)
  }

  @Test
  func `module registers its views by type name and as the default view`() throws {
    let appContext = AppContext()
    let holder = ModuleHolder(appContext: appContext, module: NativeCardsModule(appContext: appContext), name: nil)
    let viewType = try #require(holder.nativeViewTypes["NativeCardView"])

    #expect(holder.nativeViewTypes.keys.sorted() == [DEFAULT_MODULE_VIEW, "NativeCardView"])
    #expect(ObjectIdentifier(viewType) == ObjectIdentifier(NativeCardView.self))
    #expect(viewType.propNames == ["title", "radius"])
    #expect(viewType.eventNames == ["onTap"])
  }

  @Test
  func `module skips a view with the name of another view`() throws {
    let appContext = AppContext()
    let holder = ModuleHolder(appContext: appContext, module: MarkersModule(appContext: appContext), name: nil)
    let viewType = try #require(holder.nativeViewTypes["MarkerView"])

    #expect(holder.nativeViewTypes.keys.sorted() == [DEFAULT_MODULE_VIEW, "MarkerView"])
    #expect(ObjectIdentifier(viewType) == ObjectIdentifier(First.MarkerView.self))
  }

  @Test
  func `module skips a view with the name of a view in its definition`() {
    let appContext = AppContext()
    let holder = ModuleHolder(appContext: appContext, module: MixedCardsModule(appContext: appContext), name: nil)

    // The definition's view is also the default view.
    #expect(holder.nativeViewTypes.keys.sorted() == ["OtherCardView"])
    #expect(holder.definition.views.keys.sorted() == [DEFAULT_MODULE_VIEW, "NativeCardView"])
  }

  @Test
  func `registered component class is a subclass that applies the props`() throws {
    ExpoNativeView.registerComponent(NativeCardView.self, moduleName: "NativeViewTests", viewName: "NativeCardView")

    let viewClass: AnyClass = try #require(NSClassFromString("ViewManagerAdapter_NativeViewTests_NativeCardView"))
    #expect(class_getSuperclass(viewClass) == NativeCardView.self)

    // `RCTComponentViewFactory` creates the views with `+new`.
    let object = (viewClass as AnyObject).perform(NSSelectorFromString("new"))?.takeRetainedValue()
    let view = try #require(object as? NativeCardView)
    view.updateDecodedProps(nil)

    #expect(view.diffs.count == 1)
  }

  @Test
  func `another view type with a registered component name isn't registered`() throws {
    ExpoNativeView.registerComponent(NativeCardView.self, moduleName: "NativeViewTests", viewName: "SharedName")
    ExpoNativeView.registerComponent(OtherCardView.self, moduleName: "NativeViewTests", viewName: "SharedName")

    let viewClass: AnyClass = try #require(NSClassFromString("ViewManagerAdapter_NativeViewTests_SharedName"))
    #expect(class_getSuperclass(viewClass) == NativeCardView.self)
  }
}

/// Reads the view configs that `requireNativeView` gets from native.
@Suite
@JavaScriptActor
struct NativeViewConfigTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(moduleType: NativeCardsModule.self, name: nil)
  }

  @Test
  func `view config has the props and events of the view`() throws {
    for viewName in ["'NativeCardView'", "undefined"] {
      let config = "expo.getViewConfig('NativeCards', \(viewName))"

      // Sorted, because native builds the attributes from a dictionary, which has no order.
      #expect(try runtime.eval("Object.keys(\(config).validAttributes).sort().join()").asString() == "radius,title")
      #expect(
        try runtime.eval("JSON.stringify(\(config).directEventTypes)").asString()
          == #"{"topTap":{"registrationName":"onTap"}}"#
      )
    }
  }

  @Test
  func `view config of an unknown view is null`() throws {
    #expect(try runtime.eval("expo.getViewConfig('NativeCards', 'UnknownView')").isNull())
  }
}

/// Creates the React components of `@ExpoView` views through the module object, with a stub factory in place of
/// the one that expo-modules-core's JS installs.
@Suite
@JavaScriptActor
struct NativeViewComponentTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() throws {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(moduleType: NativeCardsModule.self, name: nil)
    appContext.moduleRegistry.register(moduleType: CollidingCardsModule.self, name: nil)
    try runtime.eval(
      """
      configs = [];
      expo.__createNativeViewComponent = (config) => {
        configs.push(config);
        return function NativeView() {};
      };
      """
    )
  }

  @Test
  func `module object has a lazy getter for each view`() throws {
    let descriptor = try runtime.eval("Object.getOwnPropertyDescriptor(expo.modules.NativeCards, 'NativeCardView')").asObject()

    let isGetter = descriptor.getProperty("get").isFunction()
    #expect(isGetter)
    #expect(try descriptor.getProperty("enumerable").asBool() == true)
    #expect(try descriptor.getProperty("configurable").asBool() == true)
    #expect(try runtime.eval("configs.length").asInt() == 0)
  }

  @Test
  func `reading a view creates its component once`() throws {
    #expect(try runtime.eval("expo.modules.NativeCards.NativeCardView === expo.modules.NativeCards.NativeCardView").asBool())
    #expect(try runtime.eval("configs.length").asInt() == 1)

    let config = try runtime.eval("configs[0]").asObject()
    #expect(try config.getProperty("name").asString() == "ViewManagerAdapter_NativeCards_NativeCardView")
    #expect(try config.getProperty("displayName").asString() == "NativeCardView")
    #expect(try runtime.eval("JSON.stringify(configs[0].validAttributes)").asString() == #"{"title":true,"radius":true}"#)
    #expect(try runtime.eval("JSON.stringify(configs[0].directEventTypes)").asString() == #"{"topTap":{"registrationName":"onTap"}}"#)

    let descriptor = try runtime.eval("Object.getOwnPropertyDescriptor(expo.modules.NativeCards, 'NativeCardView')").asObject()
    let isComponent = descriptor.getProperty("value").isFunction()
    #expect(isComponent)
    #expect(try descriptor.getProperty("enumerable").asBool() == true)
    #expect(try descriptor.getProperty("writable").asBool() == false)
  }

  @Test
  func `default view is a separate non-enumerable component`() throws {
    let property = ModuleHolder.defaultViewPropertyName

    #expect(try runtime.eval("Object.keys(expo.modules.NativeCards).includes('\(property)')").asBool() == false)
    #expect(try runtime.eval("typeof expo.modules.NativeCards.\(property)").asString() == "function")
    #expect(try runtime.eval("expo.modules.NativeCards.\(property) !== expo.modules.NativeCards.NativeCardView").asBool())
    #expect(try runtime.eval("configs[0].name").asString() == "ViewManagerAdapter_NativeCards")
    #expect(try runtime.eval("configs[0].displayName").asString() == "NativeCardView")
  }

  @Test
  func `view does not replace a module property with the same name`() throws {
    #expect(try runtime.eval("expo.modules.CollidingCards.NativeCardView").asString() == "constant")
    #expect(try runtime.eval("configs.length").asInt() == 0)
  }

  @Test
  func `reading a view without the factory throws`() throws {
    try runtime.eval("delete expo.__createNativeViewComponent")

    #expect(throws: (any Error).self) {
      try runtime.eval("expo.modules.NativeCards.NativeCardView")
    }
    // The getter stays, so a later read can create the component.
    try runtime.eval("expo.__createNativeViewComponent = () => function NativeView() {}")
    #expect(try runtime.eval("typeof expo.modules.NativeCards.NativeCardView").asString() == "function")
  }
}
