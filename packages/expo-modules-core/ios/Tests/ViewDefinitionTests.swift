// Copyright 2022-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoModulesCore

// `createView` and the UIKit views these tests construct must be touched on the main thread.
// Swift Testing runs tests on the cooperative pool by default, where `MainActor.assumeIsolated`
// inside `createView` traps.
@Suite("ViewDefinition")
@MainActor
struct ViewDefinitionTests {
  @Suite("View")
  struct ViewTests {
    @Test
    func `creates a view`() {
      let definition = View(UIImageView.self) {}
      let view = definition.createView(appContext: AppContext())
      #expect((try? view?.toUIView()) is UIImageView)
    }
  }

  @Suite("Prop")
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
