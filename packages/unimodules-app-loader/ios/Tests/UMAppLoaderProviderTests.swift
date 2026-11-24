import Testing

@testable import UMAppLoader

@Suite("UMAppLoaderProvider")
struct UMAppLoaderProviderTests {
  @Test
  func `exposes a shared singleton`() {
    #expect(UMAppLoaderProvider.sharedInstance() != nil)
  }
}
