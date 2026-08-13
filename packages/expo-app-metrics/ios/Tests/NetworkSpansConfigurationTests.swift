import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("NetworkSpansConfiguration")
struct NetworkSpansConfigurationTests {
  private let url = URL(string: "https://api.example.com/v1/items")!

  @Test
  func `allows every request by default`() {
    let config = NetworkSpansConfiguration()
    #expect(config.allows(url: url, method: "GET"))
    #expect(config.allows(url: URL(string: "https://other.dev/x")!, method: "DELETE"))
  }

  @Test
  func `blocks every request while disabled, even ones matching the filter`() {
    let config = NetworkSpansConfiguration(enabled: false, hosts: ["api.example.com"], methods: nil)
    #expect(!config.allows(url: url, method: "GET"))
  }

  @Test
  func `matches hosts for exact case-insensitive equality`() {
    let config = NetworkSpansConfiguration(enabled: true, hosts: ["API.Example.com"], methods: nil)
    #expect(config.allows(url: url, method: "GET"))
    #expect(!config.allows(url: URL(string: "https://sub.api.example.com/x")!, method: "GET"))
    #expect(!config.allows(url: URL(string: "https://other.dev/x")!, method: "GET"))
  }

  @Test
  func `an empty host list blocks every request`() {
    // `nil` means unconstrained; an empty array is an allowlist with no entries.
    let config = NetworkSpansConfiguration(enabled: true, hosts: [], methods: nil)
    #expect(!config.allows(url: url, method: "GET"))
  }

  @Test
  func `matches methods case-insensitively`() {
    let config = NetworkSpansConfiguration(enabled: true, hosts: nil, methods: ["get", "Post"])
    #expect(config.allows(url: url, method: "GET"))
    #expect(config.allows(url: url, method: "POST"))
    #expect(!config.allows(url: url, method: "DELETE"))
  }

  @Test
  func `a request whose URL has no host never matches a host list`() {
    // A host allowlist means "only these hosts"; a hostless URL can't prove membership.
    let config = NetworkSpansConfiguration(enabled: true, hosts: ["api.example.com"], methods: nil)
    #expect(!config.allows(url: URL(string: "file:///tmp/payload.json")!, method: "GET"))
  }

  @Test
  func `round-trips through its persisted encoding`() throws {
    let full = NetworkSpansConfiguration(
      enabled: false,
      hosts: ["api.example.com", "cdn.example.com"],
      methods: ["GET"]
    )
    let decodedFull = try JSONDecoder().decode(
      NetworkSpansConfiguration.self,
      from: JSONEncoder().encode(full)
    )
    #expect(decodedFull.enabled == false)
    #expect(decodedFull.hosts == ["api.example.com", "cdn.example.com"])
    #expect(decodedFull.methods == ["GET"])
    let minimal = NetworkSpansConfiguration()
    let decodedMinimal = try JSONDecoder().decode(
      NetworkSpansConfiguration.self,
      from: JSONEncoder().encode(minimal)
    )
    #expect(decodedMinimal.enabled)
    #expect(decodedMinimal.hosts == nil)
    #expect(decodedMinimal.methods == nil)
  }
}
