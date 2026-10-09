import Testing

@testable import EXDevLauncher

@Suite("EXDevLauncher")
struct EXDevLauncherTest {
  @Test
  func `exported constants should contain correct fields`() {
    let module = EXDevLauncher()

    let exportedConstants = module.constantsToExport()!

    #expect(exportedConstants["manifestString"] != nil)
    #expect(exportedConstants["manifestURL"] != nil)
  }
}
