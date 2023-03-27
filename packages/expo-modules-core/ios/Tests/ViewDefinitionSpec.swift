// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class ViewDefinitionSpec: ExpoSpec {
  override func spec() {
    describe("View") {
      it("creates a view") {
        let definition = View(UIImageView.self) {}
        let view = definition.createView(appContext: AppContext())
        expect(view).to(beAKindOf(UIImageView.self))
      }
    }

    describe("Prop") {
      let appContext = AppContext.create()

      it("sets the prop") {
        let textView = UITextView()
        let content = "hello"
        let definition = View(UITextView.self) {
          Prop("content") { (view: UITextView, value: String) in
            view.text = value
          }
        }
        try definition.propsDict()["content"]?.set(value: content, onView: textView, appContext: appContext)
        expect(textView.text) == content
      }

      it("infers view type") {
        let textView = UITextView()
        let content = "hello"
        let definition = View(UITextView.self) {
          // The type of `view` is inferred and equals to the type passed to `View` component.
          Prop("content") { (view, _: String) in
            expect(view).to(beAKindOf(UITextView.self))
          }
        }
        try definition.propsDict()["content"]?.set(value: content, onView: textView, appContext: appContext)
      }
    }

    describe("Events") {
      it("defines events") {
        let imageLoadedEvent = "imageLoaded"
        let imageFailedEvent = "imageFailed"
        let definition = View(UIImageView.self) {
          Events(imageLoadedEvent, imageFailedEvent)
        }
        expect(definition.eventNames).to(contain(imageLoadedEvent, imageFailedEvent))
      }
    }
  }
}
