// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import SwiftUI
import Testing

@testable import ExpoModulesCore

@ViewProps
private struct SwiftUICardProps {
  var title = "Untitled"
  var showsChildren = true
  var onTap: () -> Void
}

@ExpoView<SwiftUICardProps>
private struct SwiftUICardView: View {
  var body: some View {
    VStack {
      Text(props.title)
      if props.showsChildren {
        children
      }
    }
  }
}

@ExpoView<SwiftUICardProps>("FancySwiftUICard")
private struct RenamedSwiftUICardView: View {
  var body: some View {
    EmptyView()
  }
}

@ExpoModule("SwiftUICards", views: [SwiftUICardView.self])
private final class SwiftUICardsModule: Module {}

private final class V1ParentProps: ExpoSwiftUI.ViewProps {}

private struct V1ParentView: ExpoSwiftUI.View {
  @ObservedObject var props: V1ParentProps

  var body: some SwiftUI.View {
    VStack {
      Children()
    }
  }
}

/// Records the events in place of the event emitter of a component view.
private final class RecordingEventEmitter: NSObject, ViewEventEmitting {
  nonisolated(unsafe) var eventNames: [String] = []

  nonisolated func dispatchEvent(_ name: String, encodePayload: ViewEventPayloadEncoder?) {
    eventNames.append(name)
  }
}

private extension SwiftUINativeView {
  /// Applies decoded props the way `ExpoSwiftUIViewObjC` does in `finalizeUpdates:`, as an unretained pointer.
  func update(_ decodedProps: AnyObject?) {
    withExtendedLifetime(decodedProps) {
      updateDecodedProps(decodedProps.map { UnsafeRawPointer(Unmanaged.passUnretained($0).toOpaque()) })
    }
  }
}

/// Mounts SwiftUI views of Expo Modules v2 the way Fabric does, through their component views.
@MainActor
@Suite
struct SwiftUINativeViewTests {
  private let view = SwiftUINativeView<SwiftUICardView>()

  private func decoded(
    _ props: SwiftUICardProps,
    changed: SwiftUICardProps.PropSet,
    previous: DecodedViewProps<SwiftUICardProps>? = nil
  ) -> DecodedViewProps<SwiftUICardProps> {
    return DecodedViewProps(props: props, changedProps: changed, previous: previous)
  }

  /// The view struct that the component view renders now.
  private func content(of view: SwiftUINativeView<SwiftUICardView>) -> SwiftUICardView {
    return ExpoSwiftUI.NativeChild(model: view.model).content
  }

  private func render(_ window: UIWindow) async throws {
    window.layoutIfNeeded()
    try await Task.sleep(nanoseconds: 100_000_000)
    window.layoutIfNeeded()
  }

  /// Passes a component view the way Fabric does, as a `UIView`, although it's an `NSObject`.
  private func componentView(_ view: ExpoSwiftUIViewObjC) -> UIView {
    return unsafeBitCast(view, to: UIView.self)
  }

  /// Creates a component view the way `RCTComponentViewFactory` does, with `+new`.
  private func newComponentView(of viewClass: AnyClass) throws -> AnyObject {
    let view = (viewClass as AnyObject).perform(NSSelectorFromString("new"))?.takeRetainedValue()
    return try #require(view)
  }

  @Test
  func `registers a subclass of the component view class`() throws {
    ExpoNativeView.registerComponent(SwiftUICardView.self, componentName: "swiftui_native_view_tests_SwiftUICardView")

    let viewClass: AnyClass = try #require(NSClassFromString("swiftui_native_view_tests_SwiftUICardView"))
    #expect(class_getSuperclass(viewClass) == swiftUIComponentViewClass(of: SwiftUICardView.self))
    #expect(try newComponentView(of: viewClass) is any ExpoSwiftUI.AnyChild)
  }

  @Test
  func `component view that Fabric creates takes props and children`() throws {
    let componentView = try newComponentView(of: SwiftUINativeView<SwiftUICardView>.self)
    let view = try #require(componentView as? SwiftUINativeView<SwiftUICardView>)
    let child = try #require(componentView as? any ExpoSwiftUI.AnyChild)
    var props = SwiftUICardProps()
    props.title = "Card"

    view.update(decoded(props, changed: .title))
    view.mountChildComponentView(UIView(), index: 0)

    #expect(view.model.props.title == "Card")
    #expect(view.model.children.count == 1)
    #expect(child.id == ObjectIdentifier(view))
  }

  @Test
  func `module lists the SwiftUI view with its props and events`() throws {
    let viewTypes = SwiftUICardsModule._viewTypes
    #expect(viewTypes.count == 1)
    let viewType = try #require(viewTypes.first)
    #expect(viewType._jsName == "SwiftUICardView")
    #expect(viewType.propNames == ["title", "showsChildren"])
    #expect(viewType.eventNames == ["onTap"])
    #expect(RenamedSwiftUICardView._jsName == "FancySwiftUICard")
  }

  @Test
  func `view struct gets the mounted props`() {
    var props = SwiftUICardProps()
    props.title = "Card"
    view.update(decoded(props, changed: .title))

    #expect(content(of: view).props.title == "Card")
  }

  @Test
  func `view struct gets the defaults when React sets no props`() {
    view.update(nil)

    #expect(content(of: view).props.title == "Untitled")
    #expect(view.model.decodedProps != nil)
  }

  @Test
  func `only new props notify SwiftUI`() {
    var notifications = 0
    let subscription = view.model.objectWillChange.sink { notifications += 1 }
    var props = SwiftUICardProps()
    props.title = "Card"
    let created = decoded(props, changed: .title)

    view.update(created)
    view.update(created)
    view.update(nil)

    #expect(notifications == 1)
    withExtendedLifetime(subscription) {}
  }

  @Test
  func `event props dispatch through the component view`() {
    let emitter = RecordingEventEmitter()
    let model = SwiftUINativeViewModel<SwiftUICardView>()
    model.apply(nil, eventEmitter: emitter)

    model.props.onTap()

    #expect(emitter.eventNames == ["onTap"])
  }

  @Test
  func `mounts and unmounts children`() {
    let uiView = UIView()
    let swiftUIView = SwiftUINativeView<SwiftUICardView>()

    view.mountChildComponentView(uiView, index: 0)
    view.mountChildComponentView(componentView(swiftUIView), index: 1)

    #expect(content(of: view).children.count == 2)
    #expect((content(of: view).children[0].base as? ExpoSwiftUI.UIViewHost)?.view === uiView)
    #expect(content(of: view).children[1].base as AnyObject === swiftUIView)

    view.unmountChildComponentView(uiView, index: 0)

    #expect(content(of: view).children.count == 1)
    #expect(content(of: view).children[0].base as AnyObject === swiftUIView)
  }

  @Test
  func `parent finds a child by its type`() {
    let cardView = SwiftUINativeView<SwiftUICardView>()
    let renamedView = SwiftUINativeView<RenamedSwiftUICardView>()
    var props = SwiftUICardProps()
    props.title = "Child"
    cardView.update(decoded(props, changed: .title))

    view.mountChildComponentView(UIView(), index: 0)
    view.mountChildComponentView(componentView(renamedView), index: 1)
    view.mountChildComponentView(componentView(cardView), index: 2)
    let children = content(of: view).children

    let cards = children.compactMap { $0.as(SwiftUICardView.self) }
    #expect(cards.count == 1)
    #expect(cards.first?.props.title == "Child")
    #expect(children[0].as(SwiftUICardView.self) == nil)
    #expect(children[1].as(RenamedSwiftUICardView.self) != nil)
  }

  // The views of `ExpoSwiftUI.View` find a v2 child through `AnyChild`.
  @Test
  func `component view is found by the type of its view struct`() throws {
    let componentView = try newComponentView(of: SwiftUINativeView<SwiftUICardView>.self)
    let child = try #require(componentView as? any ExpoSwiftUI.AnyChild)

    #expect(child.as(SwiftUICardView.self) != nil)
    #expect(child.as(RenamedSwiftUICardView.self) == nil)
  }

  @Test
  func `child of a known type gives its current props and children`() {
    let cardView = SwiftUINativeView<SwiftUICardView>()
    view.mountChildComponentView(componentView(cardView), index: 0)
    let card = content(of: view).children[0].as(SwiftUICardView.self)

    var props = SwiftUICardProps()
    props.title = "Updated"
    cardView.update(decoded(props, changed: .title))
    cardView.mountChildComponentView(UIView(), index: 0)

    #expect(card?.props.title == "Updated")
    #expect(card?.children.count == 1)
    #expect(card?.content.props.title == "Updated")
  }

  @Test
  func `children keep their identity when the props change`() {
    let cardView = SwiftUINativeView<SwiftUICardView>()
    view.mountChildComponentView(UIView(), index: 0)
    view.mountChildComponentView(componentView(cardView), index: 1)
    let ids = content(of: view).children.map(\.id)

    var props = SwiftUICardProps()
    props.title = "Updated"
    cardView.update(decoded(props, changed: .title))
    view.update(decoded(props, changed: .title))

    #expect(content(of: view).children.map(\.id) == ids)
    #expect(ids[0] != ids[1])
  }

  @Test
  func `renders the children that the props show`() async throws {
    let hostedView = UIView()
    view.update(nil)
    view.mountChildComponentView(hostedView, index: 0)

    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 200, height: 200))
    window.rootViewController = UIHostingController(rootView: view.body)
    window.makeKeyAndVisible()
    try await render(window)
    #expect(hostedView.window === window)

    var props = SwiftUICardProps()
    props.showsChildren = false
    view.update(decoded(props, changed: .showsChildren))
    try await render(window)

    #expect(hostedView.window == nil)
  }

  @Test
  func `v1 SwiftUI view renders a v2 child`() async throws {
    let hostedView = UIView()
    view.update(nil)
    view.mountChildComponentView(hostedView, index: 0)

    // What `virtualViewMountChild` does for a SwiftUI child of a v1 view.
    let parentProps = V1ParentProps()
    let child = try #require(view as AnyObject as? (any ExpoSwiftUI.AnyChild))
    parentProps.children = [child]

    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 200, height: 200))
    window.rootViewController = UIHostingController(rootView: V1ParentView(props: parentProps))
    window.makeKeyAndVisible()
    try await render(window)

    #expect(hostedView.window === window)
  }
}
