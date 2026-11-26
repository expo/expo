import Testing
import UIKit

@testable import ExpoRouter

// Fabric gives a `display: contents` view an empty box. React Native sets `center`, then `bounds`.
@Suite("DisplayContentsView")
@MainActor
struct DisplayContentsViewTests {
  @Test
  func `wrapper takes the box of its child`() {
    let host = UIView(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    let wrapper = NativeLinkPreviewView(appContext: nil)
    host.addSubview(wrapper)
    wrapper.center = CGPoint(x: 16, y: 100)
    wrapper.bounds = .zero
    let child = UIView()
    child.center = CGPoint(x: 100, y: 20)
    child.bounds = CGRect(x: 0, y: 0, width: 200, height: 40)

    wrapper.mountChildComponentView(child, index: 0)

    #expect(wrapper.frame == CGRect(x: 16, y: 100, width: 200, height: 40))
    #expect(child.convert(child.bounds, to: host) == CGRect(x: 16, y: 100, width: 200, height: 40))
  }

  @Test
  func `wrapper follows its child when only the child moves`() {
    let host = UIView(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    let wrapper = NativeLinkPreviewView(appContext: nil)
    host.addSubview(wrapper)
    wrapper.center = CGPoint(x: 16, y: 100)
    wrapper.bounds = .zero
    let child = UIView()
    child.center = CGPoint(x: 100, y: 20)
    child.bounds = CGRect(x: 0, y: 0, width: 200, height: 40)
    wrapper.mountChildComponentView(child, index: 0)

    child.center = CGPoint(x: 110, y: 30)
    child.bounds = CGRect(x: 0, y: 0, width: 220, height: 60)

    #expect(wrapper.frame == CGRect(x: 16, y: 100, width: 220, height: 60))
    #expect(child.convert(child.bounds, to: host) == CGRect(x: 16, y: 100, width: 220, height: 60))
  }

  @Test
  func `wrapper keeps the box of its child when Fabric moves the wrapper`() {
    let host = UIView(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    let wrapper = NativeLinkPreviewView(appContext: nil)
    host.addSubview(wrapper)
    wrapper.center = CGPoint(x: 16, y: 100)
    wrapper.bounds = .zero
    let child = UIView()
    child.center = CGPoint(x: 100, y: 20)
    child.bounds = CGRect(x: 0, y: 0, width: 200, height: 40)
    wrapper.mountChildComponentView(child, index: 0)

    wrapper.center = CGPoint(x: 16, y: 300)
    wrapper.bounds = .zero

    #expect(wrapper.frame == CGRect(x: 16, y: 300, width: 200, height: 40))
    #expect(child.convert(child.bounds, to: host) == CGRect(x: 16, y: 300, width: 200, height: 40))
  }

  @Test
  func `wrapper is empty at its Fabric position after the child unmounts`() {
    let host = UIView(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    let wrapper = NativeLinkPreviewView(appContext: nil)
    host.addSubview(wrapper)
    wrapper.center = CGPoint(x: 16, y: 100)
    wrapper.bounds = .zero
    let child = UIView()
    child.center = CGPoint(x: 100, y: 20)
    child.bounds = CGRect(x: 0, y: 0, width: 200, height: 40)
    wrapper.mountChildComponentView(child, index: 0)
    #expect(wrapper.frame == CGRect(x: 16, y: 100, width: 200, height: 40))

    wrapper.unmountChildComponentView(child, index: 0)
    child.center = CGPoint(x: 300, y: 300)

    #expect(wrapper.frame == CGRect(x: 16, y: 100, width: 0, height: 0))
  }

  @Test
  func `outer wrapper follows a child that moves inside a nested wrapper`() {
    let host = UIView(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    let outer = NativeLinkPreviewView(appContext: nil)
    host.addSubview(outer)
    outer.center = CGPoint(x: 16, y: 100)
    outer.bounds = .zero
    let inner = LinkZoomTransitionSource(appContext: nil)
    inner.center = CGPoint(x: 10, y: 20)
    inner.bounds = .zero
    let leaf = UIView()
    leaf.center = CGPoint(x: 100, y: 20)
    leaf.bounds = CGRect(x: 0, y: 0, width: 200, height: 40)
    inner.mountChildComponentView(leaf, index: 0)
    outer.mountChildComponentView(inner, index: 0)

    leaf.center = CGPoint(x: 110, y: 30)
    leaf.bounds = CGRect(x: 0, y: 0, width: 220, height: 60)

    #expect(outer.frame == CGRect(x: 26, y: 120, width: 220, height: 60))
    #expect(leaf.convert(leaf.bounds, to: host) == CGRect(x: 26, y: 120, width: 220, height: 60))
  }
}
