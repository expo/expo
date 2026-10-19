import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("NetworkTracesConfiguration")
struct NetworkTracesConfigurationTests {
  private let url = URL(string: "https://api.example.com/v1/items")!

  @Test
  func `records nothing by default`() {
    // Opt-in: an app that never configures `networkTraces` records no spans, so upgrading can't
    // silently add to a customer's event bill.
    let config = NetworkTracesConfiguration()
    #expect(!config.allows(url: url, method: "GET"))
    #expect(!config.allows(url: URL(string: "https://other.dev/x")!, method: "DELETE"))
  }

  @Test
  func `allows every request once enabled without a filter`() {
    let config = NetworkTracesConfiguration(enabled: true)
    #expect(config.allows(url: url, method: "GET"))
    #expect(config.allows(url: URL(string: "https://other.dev/x")!, method: "DELETE"))
  }

  @Test
  func `blocks every request while disabled, even ones matching the filter`() {
    let config = NetworkTracesConfiguration(enabled: false, hosts: ["api.example.com"], methods: nil)
    #expect(!config.allows(url: url, method: "GET"))
  }

  @Test
  func `matches hosts for exact case-insensitive equality`() {
    let config = NetworkTracesConfiguration(enabled: true, hosts: ["API.Example.com"], methods: nil)
    #expect(config.allows(url: url, method: "GET"))
    #expect(!config.allows(url: URL(string: "https://sub.api.example.com/x")!, method: "GET"))
    #expect(!config.allows(url: URL(string: "https://other.dev/x")!, method: "GET"))
  }

  @Test
  func `an empty host list blocks every request`() {
    // `nil` means unconstrained; an empty array is an allowlist with no entries.
    let config = NetworkTracesConfiguration(enabled: true, hosts: [], methods: nil)
    #expect(!config.allows(url: url, method: "GET"))
  }

  @Test
  func `matches methods case-insensitively`() {
    let config = NetworkTracesConfiguration(enabled: true, hosts: nil, methods: ["get", "Post"])
    #expect(config.allows(url: url, method: "GET"))
    #expect(config.allows(url: url, method: "POST"))
    #expect(!config.allows(url: url, method: "DELETE"))
  }

  @Test
  func `a request whose URL has no host never matches a host list`() {
    // A host allowlist means "only these hosts"; a hostless URL can't prove membership.
    let config = NetworkTracesConfiguration(enabled: true, hosts: ["api.example.com"], methods: nil)
    #expect(!config.allows(url: URL(string: "file:///tmp/payload.json")!, method: "GET"))
  }

  @Test
  func `round-trips through its persisted encoding`() throws {
    let full = NetworkTracesConfiguration(
      enabled: false,
      hosts: ["api.example.com", "cdn.example.com"],
      methods: ["GET"]
    )
    let decodedFull = try JSONDecoder().decode(
      NetworkTracesConfiguration.self,
      from: JSONEncoder().encode(full)
    )
    #expect(decodedFull.enabled == false)
    #expect(decodedFull.hosts == ["api.example.com", "cdn.example.com"])
    #expect(decodedFull.methods == ["GET"])
    let minimal = NetworkTracesConfiguration()
    let decodedMinimal = try JSONDecoder().decode(
      NetworkTracesConfiguration.self,
      from: JSONEncoder().encode(minimal)
    )
    #expect(!decodedMinimal.enabled)
    #expect(decodedMinimal.hosts == nil)
    #expect(decodedMinimal.methods == nil)
  }

  @Test
  func `a corrupt blob decodes to nothing, so callers fall back to the default policy`() {
    // The decode returns nil rather than a partial value, and both call sites apply
    // `?? NetworkTracesConfiguration()`. Falling open matters more than the mechanism here: a
    // corrupt preferences entry must never silently disable recording.
    for blob in ["", "not json", "[1,2]", #"{"enabled":false,"hosts":"nope"}"#] {
      let decoded = try? JSONDecoder().decode(
        NetworkTracesConfiguration.self,
        from: Data(blob.utf8)
      )
      #expect(decoded == nil, "expected \(blob) to fail decoding")
    }
  }
}
