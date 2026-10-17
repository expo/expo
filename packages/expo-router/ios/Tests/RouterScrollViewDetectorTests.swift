import Testing
import UIKit

@Suite
struct RouterScrollViewDetectorTests {
  @Test
  func returnsFalseWhenScrollViewIsOnFirstSubviewChain() {
    let root = UIView()
    let wrapper = UIView()
    wrapper.addSubview(UIScrollView())
    root.addSubview(wrapper)

    #expect(!RouterScrollViewDetectorView.hasScrollViewOutsideFirstSubviewChain(in: root))
  }

  @Test
  func returnsTrueWhenScrollViewIsBehindSibling() {
    let root = UIView()
    root.addSubview(UIView())
    root.addSubview(UIScrollView())

    #expect(RouterScrollViewDetectorView.hasScrollViewOutsideFirstSubviewChain(in: root))
  }

  @Test
  func returnsFalseWhenThereIsNoScrollView() {
    let root = UIView()
    root.addSubview(UIView())

    #expect(!RouterScrollViewDetectorView.hasScrollViewOutsideFirstSubviewChain(in: root))
  }

  @Test
  func returnsFalseWhenFirstSubviewProvidesContentScrollView() {
    let root = UIView()
    root.addSubview(MockContentScrollViewProvider())
    root.addSubview(UIScrollView())

    #expect(!RouterScrollViewDetectorView.hasScrollViewOutsideFirstSubviewChain(in: root))
  }
}

private final class MockContentScrollViewProvider: UIView {
  private let scrollView = UIScrollView()

  @objc
  func findContentScrollView() -> UIScrollView {
    scrollView
  }
}
