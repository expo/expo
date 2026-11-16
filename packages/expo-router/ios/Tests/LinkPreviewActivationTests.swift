import RNScreens
import Testing
import UIKit

@testable import ExpoRouter

private final class ActivationStack: RNSScreenStackView {
  var screens: [UIView] = []
  var updates = 0
  override func reactSubviews() -> [UIView]! { screens }
  override func markChildUpdated() { updates += 1 }
}

@Suite("LinkPreview activation ownership")
@MainActor
struct LinkPreviewActivationTests {
  @Test
  func `a captured activation cannot promote a replacement screen`() {
    let stack = ActivationStack(frame: .zero)
    let first = RNSScreenView(frame: .zero)
    first.screenId = "first"
    first.activityState = 0
    stack.screens = [first]
    let activation = LinkPreviewActivation(screen: first, stack: stack, tabChangeCommands: [])
    let second = RNSScreenView(frame: .zero)
    second.screenId = "second"
    second.activityState = 0
    stack.screens = [second]
    activation.commit()
    #expect(first.activityState == 0)
    #expect(second.activityState == 0)
    #expect(stack.updates == 0)
    let reopened = LinkPreviewActivation(screen: second, stack: stack, tabChangeCommands: [])
    reopened.commit()
    reopened.commit()
    #expect(second.activityState == 2)
    #expect(stack.updates == 1)
  }

  @Test
  func `JS already promoting the screen makes native commit a no-op`() {
    let stack = ActivationStack(frame: .zero)
    let screen = RNSScreenView(frame: .zero)
    screen.screenId = "preview"
    screen.activityState = 0
    stack.screens = [screen]
    let activation = LinkPreviewActivation(screen: screen, stack: stack, tabChangeCommands: [])
    screen.activityState = 2
    activation.commit()
    #expect(screen.activityState == 2)
    #expect(stack.updates == 0)
  }

  @Test
  func `a differently keyed or cancelled activation cannot be committed`() {
    let stack = ActivationStack(frame: .zero)
    let screen = RNSScreenView(frame: .zero)
    screen.screenId = "preview"
    screen.activityState = 0
    stack.screens = [screen]
    let activation = LinkPreviewActivation(screen: screen, stack: stack, tabChangeCommands: [])
    screen.screenId = "replacement"
    activation.commit()
    #expect(screen.activityState == 0)
    #expect(stack.updates == 0)
    let cancelled = LinkPreviewActivation(screen: screen, stack: stack, tabChangeCommands: [])
    cancelled.cancel()
    cancelled.commit()
    #expect(screen.activityState == 0)
  }
}
