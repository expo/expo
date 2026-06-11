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
  func `quoted commas in cache-control do not split into spurious directives`() {
    // `public` here is a quoted field-name inside the `private` directive's
    // value, not a real cache directive. A naive comma split would surface it as
    // a standalone directive and wrongly enable Authorization reuse. (Quoted
    // lists only ever appear in Cache-Control, never in Vary.)
    let policy = CachePolicy.evaluate(
      responseHeaders: ["Cache-Control": "private=\"X-Foo, public, X-Bar\""],
      statusCode: 200
    )

    #expect(policy.isCacheable)
    #expect(policy.allowsAuthorizedReuse == false)
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
