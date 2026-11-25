import Testing
import UIKit

@testable import ExpoModulesCore
@testable import ExpoRouter

@Suite("Toolbar item accessibility")
@MainActor
struct ToolbarItemAccessibilityTests {
  @Test
  func `accessibility props are applied to the bar button item`() throws {
    let appContext = AppContext.create()
    let definition = try #require(
      RouterToolbarModule(appContext: appContext).definition().views["RouterToolbarItemView"])
    let view = RouterToolbarItemView(appContext: appContext)
    let props = definition.propsDict()

    try #require(props["accessibilityLabel"]).set(value: "Favorite", onView: view, appContext: appContext)
    try #require(props["accessibilityHint"]).set(
      value: "Adds to favorites", onView: view, appContext: appContext)

    #expect(view.barButtonItem.accessibilityLabel == "Favorite")
    #expect(view.barButtonItem.accessibilityHint == "Adds to favorites")
  }
}
