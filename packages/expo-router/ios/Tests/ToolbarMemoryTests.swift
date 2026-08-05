import Testing
import UIKit

@testable import ExpoRouter

// Guards against strong-reference cycles in the iOS toolbar. Each view is held
// only by a weak ref; once the strong refs drop, ARC must deallocate it.
@Suite("Toolbar memory management")
@MainActor
struct ToolbarMemoryTests {

  // Leak 1: the host holds each item in `toolbarItemsMap`; the item's `host`
  // back-pointer must be weak or the pair never deallocates.
  @Test
  func `host and item are released together`() {
    weak var weakHost: RouterToolbarHostView?
    weak var weakItem: RouterToolbarItemView?

    autoreleasepool {
      let host = RouterToolbarHostView(appContext: nil)
      let item = RouterToolbarItemView(appContext: nil)
      item.identifier = "test-item"
      host.mountChildComponentView(item, index: 0)

      weakHost = host
      weakItem = item
      #expect(weakHost != nil)
      #expect(weakItem != nil)
    }

    #expect(weakHost == nil)
    #expect(weakItem == nil)
  }

  // Leak 2: the view owns `baseUiAction`, whose handler must not capture self
  // strongly or the action view never deallocates.
  @Test
  func `action view is released`() {
    weak var weakAction: LinkPreviewNativeActionView?

    autoreleasepool {
      let action = LinkPreviewNativeActionView(appContext: nil)
      weakAction = action
      #expect(weakAction != nil)
    }

    #expect(weakAction == nil)
  }
}
