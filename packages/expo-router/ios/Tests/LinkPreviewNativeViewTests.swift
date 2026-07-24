import Testing
import UIKit

@testable import ExpoRouter

@Suite("NativeLinkPreviewView accessibility")
@MainActor
struct NativeLinkPreviewViewAccessibilityTests {
  @Test
  func `forwards accessibility elements to trigger view`() throws {
    let linkPreviewView = NativeLinkPreviewView()
    let triggerView = UIView(frame: CGRect(x: 10, y: 20, width: 100, height: 44))

    linkPreviewView.directChild = triggerView

    #expect(!linkPreviewView.isAccessibilityElement)
    let elements = try #require(linkPreviewView.accessibilityElements as? [UIView])
    #expect(elements == [triggerView])
  }

  @Test
  func `reports trigger frame for accessibility`() {
    let containerView = UIView(frame: CGRect(x: 0, y: 0, width: 200, height: 200))
    let linkPreviewView = NativeLinkPreviewView()
    let triggerView = UIView(frame: CGRect(x: 12, y: 34, width: 56, height: 78))

    containerView.addSubview(linkPreviewView)
    linkPreviewView.addSubview(triggerView)
    linkPreviewView.directChild = triggerView

    #expect(linkPreviewView.accessibilityFrame == triggerView.convert(triggerView.bounds, to: nil))
  }
}
