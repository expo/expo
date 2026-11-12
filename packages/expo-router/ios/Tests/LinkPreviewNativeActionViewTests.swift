import Testing
import UIKit

@testable import ExpoRouter

@Suite("Menu action tint")
@MainActor
struct LinkPreviewNativeActionViewTests {
  @Test
  func `an enabled action's icon is drawn in the tint`() {
    let action = LinkPreviewNativeActionView(appContext: nil)
    action.icon = "star.fill"
    action.customTintColor = .orange

    let image = (action.uiAction as? UIAction)?.image
    #expect(image != nil)
    #expect(image?.renderingMode == .alwaysOriginal)
  }

  @Test
  func `a disabled action's icon is not tinted`() {
    let action = LinkPreviewNativeActionView(appContext: nil)
    action.icon = "star.fill"
    action.customTintColor = .orange
    action.disabled = true

    let image = (action.uiAction as? UIAction)?.image
    #expect(image != nil)
    #expect(image?.renderingMode != .alwaysOriginal)
  }
}
