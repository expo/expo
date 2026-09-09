import Testing
import UIKit

@testable import ExpoRouter

// MARK: - Mock views

/// Stands in for an RNScreens screen view (`RNSScreenView` and friends).
private class MockScreenView: UIView {}

/// Stands in for a nested navigator host (`RNSScreenStackView` and friends).
private class MockNavigatorHostView: UIView {}

private func mockKind(of view: UIView) -> ScrollViewPathViewKind {
  if view is MockScreenView {
    return .screen
  }
  if view is MockNavigatorHostView {
    return .navigatorHost
  }
  return .other
}

// MARK: - Tree builders

/// Keeps the screen alive for the duration of a test: a view only retains its subviews,
/// so a locally built screen would be released and the container left without a superview.
@MainActor
private struct ScreenTree {
  let screen: UIView
  let container: UIView

  init(height: CGFloat = 800, containerIsFirstChild: Bool = true) {
    let bounds = CGRect(x: 0, y: 0, width: 400, height: height)
    screen = MockScreenView(frame: bounds)
    container = UIView(frame: bounds)
    if !containerIsFirstChild {
      screen.addSubview(UIView(frame: bounds))
    }
    screen.addSubview(container)
  }

  func classify() -> ScrollViewPathClassification? {
    ScrollViewPathInspector.classify(container: container, kindOf: mockKind(of:))
  }
}

@MainActor
private func makeVerticalScrollView(height: CGFloat) -> UIScrollView {
  let scrollView = UIScrollView(frame: CGRect(x: 0, y: 0, width: 400, height: height))
  scrollView.alwaysBounceVertical = true
  return scrollView
}

@MainActor
private func makeHorizontalScrollView(height: CGFloat) -> UIScrollView {
  let scrollView = UIScrollView(frame: CGRect(x: 0, y: 0, width: 400, height: height))
  scrollView.alwaysBounceVertical = false
  scrollView.alwaysBounceHorizontal = true
  return scrollView
}

@MainActor
private func makeHeader() -> UIView {
  UIView(frame: CGRect(x: 0, y: 0, width: 400, height: 50))
}

// MARK: - Tests

@Suite("ScrollViewPathInspector")
@MainActor
struct ScrollViewPathInspectorTests {

  @Suite("on the first-child path")
  @MainActor
  struct OnPath {
    @Test
    func `detects a scroll view as the direct first child`() {
      let tree = ScreenTree()
      tree.container.addSubview(makeVerticalScrollView(height: 800))

      #expect(tree.classify() == .firstChild)
    }

    @Test
    func `detects a scroll view behind a react native wrapper view`() {
      let tree = ScreenTree()
      let wrapper = UIView(frame: tree.container.bounds)
      wrapper.addSubview(makeVerticalScrollView(height: 800))
      tree.container.addSubview(wrapper)

      #expect(tree.classify() == .firstChild)
    }

    @Test
    func `detects a nested navigator host`() {
      let tree = ScreenTree()
      tree.container.addSubview(MockNavigatorHostView(frame: tree.container.bounds))

      #expect(tree.classify() == .nestedNavigator)
    }
  }

  @Suite("off the first-child path")
  @MainActor
  struct OffPath {
    @Test
    func `reports a screen-filling scroll view after a header`() throws {
      let tree = ScreenTree()
      tree.container.addSubview(makeHeader())
      tree.container.addSubview(makeVerticalScrollView(height: 800))

      let result = tree.classify()
      guard case .offPath(let firstChildPath, let scrollViewPath) = try #require(result) else {
        Issue.record("Expected .offPath, got \(String(describing: result))")
        return
      }
      #expect(firstChildPath == ["UIView"])
      #expect(scrollViewPath == ["UIScrollView"])
    }

    @Test
    func `reports the full path to a nested scroll view`() throws {
      let tree = ScreenTree()
      tree.container.addSubview(makeHeader())
      let wrapper = UIView(frame: tree.container.bounds)
      wrapper.addSubview(makeVerticalScrollView(height: 800))
      tree.container.addSubview(wrapper)

      let result = tree.classify()
      guard case .offPath(_, let scrollViewPath) = try #require(result) else {
        Issue.record("Expected .offPath, got \(String(describing: result))")
        return
      }
      #expect(scrollViewPath == ["UIView", "UIScrollView"])
    }

    @Test
    func `treats a half-height scroll view as embedded`() {
      let tree = ScreenTree()
      tree.container.addSubview(makeHeader())
      tree.container.addSubview(makeVerticalScrollView(height: 400))

      #expect(tree.classify() == .embedded)
    }

    @Test
    func `treats two screen-filling scroll views as ambiguous`() {
      let tree = ScreenTree()
      tree.container.addSubview(makeHeader())
      tree.container.addSubview(makeVerticalScrollView(height: 800))
      tree.container.addSubview(makeVerticalScrollView(height: 800))

      #expect(tree.classify() == .ambiguous)
    }

    @Test
    func `ignores a horizontal scroll view`() {
      let tree = ScreenTree()
      tree.container.addSubview(makeHeader())
      tree.container.addSubview(makeHorizontalScrollView(height: 800))

      #expect(tree.classify() == ScrollViewPathClassification.none)
    }

    @Test
    func `reports no scroll view at all`() {
      let tree = ScreenTree()
      tree.container.addSubview(makeHeader())
      tree.container.addSubview(UIView(frame: tree.container.bounds))

      #expect(tree.classify() == ScrollViewPathClassification.none)
    }
  }

  @Suite("skipped containers")
  @MainActor
  struct Skipped {
    @Test
    func `skips a container that is not the first child of the screen`() {
      let tree = ScreenTree(containerIsFirstChild: false)
      tree.container.addSubview(makeHeader())
      tree.container.addSubview(makeVerticalScrollView(height: 800))

      #expect(tree.classify() == nil)
    }

    @Test
    func `skips a container without a screen ancestor`() {
      let root = UIView(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
      let container = UIView(frame: root.bounds)
      root.addSubview(container)
      container.addSubview(makeHeader())
      container.addSubview(makeVerticalScrollView(height: 800))

      #expect(ScrollViewPathInspector.classify(container: container, kindOf: mockKind(of:)) == nil)
    }

    @Test
    func `skips a container that has not been laid out`() {
      let tree = ScreenTree(height: 0)
      tree.container.addSubview(makeHeader())
      tree.container.addSubview(makeVerticalScrollView(height: 800))

      #expect(tree.classify() == nil)
    }
  }

  @Suite("default kind resolver")
  @MainActor
  struct DefaultKind {
    @Test
    func `treats an unknown view class as other`() {
      #expect(ScrollViewPathInspector.kind(of: UIView()) == .other)
      #expect(ScrollViewPathInspector.kind(of: UIScrollView()) == .other)
    }
  }
}
