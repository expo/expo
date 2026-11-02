import RNScreens
import Testing
import UIKit

@testable import ExpoRouter

@Suite("SplitView observer trait delegation")
@MainActor
struct SplitViewTraitDelegationTests {
  @Test
  func `an observer preserves the deeper Stack screen's window traits`() {
    let outer = RNSScreenView(frame: .zero)
    let child = RNSScreenView(frame: .zero)
    child.statusBarStyle = .light
    child.statusBarHidden = true
    child.statusBarAnimation = .slide
    child.homeIndicatorHidden = true
    child.screenOrientation = .landscapeLeft
    let navigation = RNSNavigationController(rootViewController: child.controller)
    outer.controller.addChild(navigation)
    outer.addSubview(navigation.view)
    navigation.didMove(toParent: outer.controller)
    #expect(outer.controller.childForStatusBarStyle === child.controller)
    #expect(outer.controller.supportedInterfaceOrientations == .landscapeLeft)

    let observer = SplitViewLifecycleObserver()
    observer.attach(to: outer.controller, in: outer)
    defer { observer.detach() }

    #expect(outer.controller.childForStatusBarStyle === child.controller)
    #expect(outer.controller.childForStatusBarHidden === child.controller)
    #expect(outer.controller.preferredStatusBarUpdateAnimation == .slide)
    #expect(outer.controller.childForHomeIndicatorAutoHidden === child.controller)
    #expect(outer.controller.supportedInterfaceOrientations == .landscapeLeft)
    #expect(outer.controller.evaluateOrientation() == .landscapeLeft)
  }

  @Test
  func `removing the deeper navigator restores the outer screen's traits`() {
    let outer = RNSScreenView(frame: .zero)
    outer.statusBarStyle = .dark
    outer.screenOrientation = .portrait
    let child = RNSScreenView(frame: .zero)
    child.statusBarStyle = .light
    child.screenOrientation = .landscapeLeft
    let navigation = RNSNavigationController(rootViewController: child.controller)
    outer.controller.addChild(navigation)
    outer.addSubview(navigation.view)
    navigation.didMove(toParent: outer.controller)
    let observer = SplitViewLifecycleObserver()
    observer.attach(to: outer.controller, in: outer)
    defer { observer.detach() }
    #expect(outer.controller.childForStatusBarStyle === child.controller)
    #expect(outer.controller.evaluateOrientation() == .landscapeLeft)

    navigation.willMove(toParent: nil)
    navigation.view.removeFromSuperview()
    navigation.removeFromParent()

    #expect(outer.controller.childForStatusBarStyle == nil)
    #expect(outer.controller.preferredStatusBarStyle == .darkContent)
    #expect(outer.controller.supportedInterfaceOrientations == .portrait)
    #expect(outer.controller.evaluateOrientation() == .portraitUp)
  }
}
