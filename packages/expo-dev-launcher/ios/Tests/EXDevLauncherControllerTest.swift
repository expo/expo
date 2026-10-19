import Testing
import React

@testable import EXDevLauncher

@Suite("EXDevLauncherController")
struct EXDevLauncherControllerTest {
  @Test
  func `should return correct version`() {
    let version = EXDevLauncherController.version()

    #expect(version != nil)
  }

  @Test
  func `sharedInstance should always return the same instance`() {
    let sharedInstance = EXDevLauncherController.sharedInstance()

    #expect(sharedInstance != nil)
    #expect(sharedInstance === EXDevLauncherController.sharedInstance())
  }

  @Test
  func `controller should have access to managers classes`() {
    let module = EXDevLauncherController.sharedInstance()

    #expect(module.errorManager() != nil)
    #expect(module.pendingDeepLinkRegistry != nil)
  }
}
