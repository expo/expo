import Foundation
import Network

struct DiscoveryResult {
  let metadata: DevServerMetadata
  let endpoint: NWEndpoint
}

/// Tracks offset-based pagination, used by GraphQL fields that page with `offset`/`limit`.
struct OffsetPaginationState {
  let pageSize: Int
  private(set) var offset = 0
  private(set) var hasMore = true

  init(pageSize: Int) {
    self.pageSize = pageSize
  }

  mutating func reset() {
    offset = 0
    hasMore = true
  }

  mutating func didReceivePage(itemCount: Int) {
    offset += itemCount
    hasMore = itemCount == pageSize
  }
}

/// Tracks cursor-based pagination, used by GraphQL connections that page with `first`/`after`.
struct CursorPaginationState {
  let pageSize: Int
  private(set) var cursor: String?
  private(set) var hasMore = true

  init(pageSize: Int) {
    self.pageSize = pageSize
  }

  mutating func reset() {
    cursor = nil
    hasMore = true
  }

  mutating func didReceivePage(endCursor: String?, hasNextPage: Bool) {
    cursor = endCursor
    hasMore = hasNextPage
  }
}

struct DevServer: Hashable {
  let url: String
  let description: String
  let source: String
  let slug: String?
  let bundleIdentifier: String?
  let username: String?

  static func == (lhs: Self, rhs: Self) -> Bool {
    return lhs.url == rhs.url
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(url)
  }

  static func < (lhs: Self, rhs: Self) -> Bool {
    return lhs.url < rhs.url
  }
}

struct BuildInfo {
  let appId: String
  let runtimeVersion: String
  let usesEASUpdates: Bool
  let projectUrl: String?
  let sdkVersion: String?

  init(buildInfo: [AnyHashable: Any], updatesConfig: [AnyHashable: Any]) {
    self.appId = (updatesConfig["appId"] as? String) ?? (buildInfo["appId"] as? String) ?? ""
    self.runtimeVersion = (updatesConfig["runtimeVersion"] as? String) ?? (buildInfo["runtimeVersion"] as? String) ?? ""
    self.usesEASUpdates = updatesConfig["usesEASUpdates"] as? Bool ?? false
    self.projectUrl = updatesConfig["projectUrl"] as? String
    self.sdkVersion = buildInfo["sdkVersion"] as? String
  }
}

struct RecentlyOpenedApp: Identifiable {
  let id = UUID().uuidString
  let name: String
  let url: String
  let timestamp: Date
  let isEasUpdate: Bool?
}
