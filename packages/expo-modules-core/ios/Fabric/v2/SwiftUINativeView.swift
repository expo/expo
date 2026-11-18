// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI

/// Returns the class of the Fabric component views of the given SwiftUI view type.
@MainActor
internal func swiftUIComponentViewClass<Content: AnyNativeSwiftUIView>(of viewType: Content.Type) -> AnyClass {
  return SwiftUINativeView<Content>.self
}

/// The Fabric component view of a SwiftUI view of Expo Modules v2. It holds the props and the children, and the SwiftUI
/// view or the `Host` that it's mounted in renders `Content` with them.
internal final class SwiftUINativeView<Content: AnyNativeSwiftUIView>: ExpoSwiftUIViewObjC, @MainActor ExpoSwiftUI.AnyChild {
  let model = SwiftUINativeViewModel<Content>()

  override func updateDecodedProps(_ decodedProps: UnsafeRawPointer?) {
    model.apply(decodedProps, eventEmitter: self)
  }

  override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    model.mountChild(childComponentView, at: index)
  }

  override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    model.unmountChild(childComponentView)
  }

  override func removeFromSuperview() {
    model.resignFirstResponderInChildren()
    super.removeFromSuperview()
  }

  // MARK: - ExpoSwiftUI.AnyChild

  @MainActor
  var body: some View {
    ExpoSwiftUI.NativeChild(model: model)
  }

  @MainActor
  var childView: some View {
    body
  }

  var id: ObjectIdentifier {
    ObjectIdentifier(self)
  }

  var uiView: UIView? {
    nil
  }

  @MainActor
  func `as`<Requested: AnyNativeSwiftUIView>(_ type: Requested.Type) -> ExpoSwiftUI.NativeChild<Requested>? {
    return model.nativeChild(as: type)
  }
}

/// The props and the children of a SwiftUI view of Expo Modules v2, which its component view updates on the main
/// thread. `ExpoSwiftUI.NativeChild` observes it and creates `Content` again when they change.
internal final class SwiftUINativeViewModel<Content: AnyNativeSwiftUIView>: ObservableObject {
  // Stored so `objectWillChange` is a plain property read instead of Combine's O(live objects) side-table lookup.
  let objectWillChange = ObservableObjectPublisher()

  /// The app context that the view belongs to. `ExpoSwiftUI.NativeChild` passes it to `Content`.
  private(set) weak var appContext: AppContext?

  init() {
    // Fabric creates the component views, and so their models, on the main thread.
    appContext = MainActor.assumeIsolated { AppContext.appContextForNewViews }
  }

  /// The mounted props, or `nil` before Fabric mounts the first props.
  private(set) var decodedProps: DecodedViewProps<Content.Props>?

  /// The React children, in order: the component views of SwiftUI views, and `UIViewHost` for the other views.
  private(set) var children: [ExpoSwiftUI.Child] = []

  var props: Content.Props {
    return decodedProps?.props ?? Content.Props()
  }

  /// Applies the decoded props that Fabric mounts, an unretained `DecodedViewProps<Content.Props>`, or `nil` when no
  /// props of the view were decoded. Like `ExpoNativeView`, the view gets the defaults when React sets none of its props.
  @MainActor
  func apply(_ pointer: UnsafeRawPointer?, eventEmitter: any ViewEventEmitting) {
    let old = decodedProps
    let new: DecodedViewProps<Content.Props>

    if let pointer {
      let object = Unmanaged<AnyObject>.fromOpaque(pointer).takeUnretainedValue()
      new = unsafeDowncast(object, to: DecodedViewProps<Content.Props>.self)
    } else if old == nil {
      let (props, events) = initialViewProps(Content.Props.self)
      new = DecodedViewProps(props: props, changedProps: [], previous: nil, events: events)
    } else {
      return
    }
    if new === old {
      return
    }
    if let events = new.events, events !== old?.events {
      events.connect(eventEmitter)
    }
    objectWillChange.send()
    decodedProps = new
  }

  @MainActor
  func mountChild(_ childComponentView: UIView, at index: Int) {
    let child: any ExpoSwiftUI.AnyChild
    if let view = childComponentView as AnyObject as? (any ExpoSwiftUI.AnyChild) {
      child = view
    } else {
      child = ExpoSwiftUI.UIViewHost(view: childComponentView)
    }
    objectWillChange.send()
    children.insert(ExpoSwiftUI.Child(child), at: index)
  }

  @MainActor
  func unmountChild(_ childComponentView: UIView) {
    // React Native asserts that the view has no superview after it's unmounted.
    childComponentView.removeFromSuperview()

    let childId = (childComponentView as AnyObject as? (any ExpoSwiftUI.AnyChild))?.id ?? ObjectIdentifier(childComponentView)
    guard let index = children.firstIndex(where: { $0.base.id == childId }) else {
      return
    }
    (children[index].base as? ExpoSwiftUI.UIViewHost)?.didUnmount()
    objectWillChange.send()
    children.remove(at: index)
  }

  /// Resigns the first responder in the children, as `UIView.removeFromSuperview` does for its subviews. A text field
  /// that stays the first responder while SwiftUI tears it down crashes.
  @MainActor
  func resignFirstResponderInChildren() {
    for child in children {
      (child.base as? any ExpoSwiftUI.FocusableViewContainer)?.resignFirstResponderInSubtree()
    }
  }

  /// Returns the view as a child of the given type, or `nil` when `Content` is another type.
  @MainActor
  func nativeChild<Requested: AnyNativeSwiftUIView>(as type: Requested.Type) -> ExpoSwiftUI.NativeChild<Requested>? {
    guard Requested.self == Content.self else {
      return nil
    }
    // `Requested` is `Content`, so the model is a `SwiftUINativeViewModel<Requested>`.
    return ExpoSwiftUI.NativeChild(model: unsafeDowncast(self, to: SwiftUINativeViewModel<Requested>.self))
  }
}

extension SwiftUINativeView: ExpoSwiftUI.FocusableViewContainer {
  @MainActor
  func resignFirstResponderInSubtree() {
    model.resignFirstResponderInChildren()
  }
}
