import Testing

@testable import ExpoTaskManager

@Suite("EXTaskService")
struct EXTaskServiceTests {
  @Test
  func `exposes a shared singleton`() {
    #expect(EXTaskService.shared != nil)
  }
}
