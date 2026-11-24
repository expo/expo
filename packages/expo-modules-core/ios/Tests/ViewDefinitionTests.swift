// Copyright 2022-present 650 Industries. All rights reserved.

import SwiftUI
import Testing
import UIKit

@testable import ExpoModulesCore

private final class PrivateImageView: UIImageView {}

private final class PrivateSwiftUIViewProps: ExpoSwiftUI.ViewProps {}

private struct PrivateSwiftUIView: ExpoSwiftUI.View {
  @ObservedObject var props: PrivateSwiftUIViewProps

  var body: some SwiftUI.View {
    Text("")
  }
}

/**
 A prop declared outside of `ExpoModulesCore`, so it can't classify itself and relies on the cast fallback.
 */
private struct ExternalProp: AnyViewProp {
  let name = "external"

  func set(value: Any, onView: UIView, appContext: AppContext) throws {}
}

// `createView` and `ConcreteViewProp.set` call `MainActor.assumeIsolated`, so these tests must
// run on the main thread. Swift Testing runs tests on the cooperative pool by default, where
// that traps. Actor isolation is not inherited by nested types, so every suite below needs its
// own `@MainActor` annotation.
@Suite("ViewDefinition")
@MainActor
struct ViewDefinitionTests {
  @Suite("View")
  @MainActor
  struct ViewTests {
    @Test
    func `creates a view`() {
      let definition = View(UIImageView.self) {}
      let view = definition.createView(appContext: AppContext())
      #expect((try? view?.toUIView()) is UIImageView)
    }

    @Test
    func `names a private view after its type`() {
      let definition = View(PrivateImageView.self) {}
      #expect(definition.name == "PrivateImageView")
    }

    @Test
    func `names a private SwiftUI view after its type`() {
      let definition = View(PrivateSwiftUIView.self)
      #expect(definition.name == "PrivateSwiftUIView")
    }
  }

  @Suite("Prop")
  @MainActor
  struct PropTests {
    let appContext = AppContext.create()

    @Test
    func `sets the prop`() throws {
      let textView = UITextView()
      let content = "hello"
      let definition = View(UITextView.self) {
        Prop("content") { (view: UITextView, value: String) in
          view.text = value
        }
      }
      try definition.propsDict()["content"]?.set(value: content, onView: textView, appContext: appContext)
      #expect(textView.text == content)
    }

    @Test
    func `collects a prop declared outside of the module`() {
      let definition = ExpoSwiftUI.ViewDefinition(PrivateSwiftUIView.self, name: "PrivateSwiftUIView", elements: [ExternalProp()])
      #expect(definition.propsDict()["external"] != nil)
    }

    @Test
    func `infers view type`() throws {
      let textView = UITextView()
      let content = "hello"
      let definition = View(UITextView.self) {
        // The type of `view` is inferred and equals to the type passed to `View`.
        Prop("content") { (view, _: String) in
          #expect(view is UITextView)
        }
      }
      try definition.propsDict()["content"]?.set(value: content, onView: textView, appContext: appContext)
    }
  }

  @Suite("Events")
  @MainActor
  struct EventsTests {
    @Test
    func `defines events`() {
      let imageLoadedEvent = "imageLoaded"
      let imageFailedEvent = "imageFailed"
      let definition = View(UIImageView.self) {
        Events(imageLoadedEvent, imageFailedEvent)
      }
      #expect(definition.eventNames.contains(imageLoadedEvent) && definition.eventNames.contains(imageFailedEvent))
    }
  }
}
