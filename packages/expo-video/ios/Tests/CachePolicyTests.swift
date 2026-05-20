import Testing

@testable import ExpoVideo

@Suite("CachePolicy")
struct CachePolicyTests {
  @Test
  func `non playable status is not cacheable`() {
    let policy = CachePolicy.evaluate(responseHeaders: [:], statusCode: 401)

    #expect(policy.isCacheable == false)
    #expect(policy.varyHeaders.isEmpty)
  }

  @Test
  func `vary star is not cacheable`() {
    let policy = CachePolicy.evaluate(responseHeaders: ["Vary": "*"], statusCode: 200)

    #expect(policy.isCacheable == false)
  }

  @Test
  func `quoted commas do not split header tokens`() {
    let policy = CachePolicy.evaluate(
      responseHeaders: ["Vary": "Accept-Language, \"X-Foo, X-Bar\""],
      statusCode: 200
    )

    #expect(policy.varyHeaders == ["\"x-foo, x-bar\"", "accept-language"])
  }

  @Test
  func `public cache control allows authorization reuse`() {
    let policy = CachePolicy.evaluate(responseHeaders: ["Cache-Control": "public"], statusCode: 206)

    #expect(policy.isCacheable)
    #expect(policy.allowsAuthorizedReuse)
  }

  @Test
  func `missing reuse directives block authorization reuse`() {
    let policy = CachePolicy.evaluate(responseHeaders: ["Cache-Control": "max-age=3600"], statusCode: 200)

    #expect(policy.isCacheable)
    #expect(policy.allowsAuthorizedReuse == false)
  }
}
