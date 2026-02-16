// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

@MainActor
class DevelopmentServerService: ObservableObject {
  @Published var developmentServers: [DevelopmentServer] = []

  private let discoveryInterval: TimeInterval = 3.0
  private let remoteRefreshInterval: TimeInterval = 10.0
  private let remoteCacheKey = "expo-dev-sessions-cache"
  private var remoteFailureCount = 0
  private var nextRemoteFetchAllowedAt: Date = .distantPast
  private var localServers: [DevelopmentServer] = []
  private var remoteServers: [DevelopmentServer] = []
  private var sessionSecret: String?
  private var discoveryTask: Task<Void, Never>?
  private var remoteRefreshTask: Task<Void, Never>?
  private var isDiscovering = false
  private var isFetchingRemote = false

  func startDiscovery() {
    stopDiscovery()
    loadCachedRemoteSessions()
    #if targetEnvironment(simulator)
    startDiscoveryLoop()
    #endif
    startRemoteRefreshLoop()
  }

  func stopDiscovery() {
    discoveryTask?.cancel()
    remoteRefreshTask?.cancel()
    discoveryTask = nil
    remoteRefreshTask = nil
  }

  func setSessionSecret(_ sessionSecret: String?) {
    guard self.sessionSecret != sessionSecret else { return }
    self.sessionSecret = sessionSecret
  }

  func refreshRemoteSessions() async {
    await fetchRemoteSessions()
  }

  func discoverDevelopmentServers() async {
    guard !isDiscovering else {
      return
    }
    isDiscovering = true
    defer { isDiscovering = false }

    var discoveredServers: [DevelopmentServer] = []
    // swiftlint:disable number_separator
    let portsToCheck = [8081, 8082, 8083, 8084, 8085, 19000, 19001, 19002]
    // swiftlint:enable number_separator
    let baseAddress = "http://localhost"

    await withTaskGroup(of: DevelopmentServer?.self) { group in
      for port in portsToCheck {
        group.addTask {
          await self.checkDevelopmentServer(url: "\(baseAddress):\(port)")
        }
      }

      for await server in group {
        if let server = server {
          discoveredServers.append(server)
        }
      }
    }

    localServers = discoveredServers
    updateDevelopmentServers()
  }

  private func startDiscoveryLoop() {
    discoveryTask?.cancel()
    discoveryTask = Task { [weak self] in
      guard let self else { return }
      while !Task.isCancelled {
        await self.discoverDevelopmentServers()
        try? await Task.sleep(nanoseconds: UInt64(self.discoveryInterval * 1_000_000_000))
      }
    }
  }

  private func startRemoteRefreshLoop() {
    remoteRefreshTask?.cancel()
    remoteRefreshTask = Task { [weak self] in
      guard let self else { return }
      while !Task.isCancelled {
        await self.fetchRemoteSessions()
        try? await Task.sleep(nanoseconds: UInt64(self.remoteRefreshInterval * 1_000_000_000))
      }
    }
  }

  private func checkDevelopmentServer(url: String) async -> DevelopmentServer? {
    guard let statusURL = URL(string: "\(url)/status") else {
      return nil
    }

    do {
      let (data, response) = try await URLSession.shared.data(from: statusURL)

      if let httpResponse = response as? HTTPURLResponse,
         httpResponse.statusCode == 200 {
        if let statusString = String(data: data, encoding: .utf8),
           statusString.contains("packager-status:running") {
          let manifestInfo = await fetchLocalManifestInfo(url: url)
          let description = manifestInfo?.name ?? url
          return DevelopmentServer(
            url: url,
            description: description,
            source: "desktop",
            isRunning: true,
            iconUrl: manifestInfo?.iconUrl
          )
        }
      }
    } catch {}

    return nil
  }

  private func fetchLocalManifestInfo(url: String) async -> (name: String?, iconUrl: String?)? {
    guard let manifestURL = URL(string: "\(url)/manifest?platform=ios") else {
      return nil
    }

    var request = URLRequest(url: manifestURL)
    request.setValue("application/expo+json,application/json", forHTTPHeaderField: "Accept")
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue("client", forHTTPHeaderField: "Expo-Client-Environment")
    request.setValue(Versions.sharedInstance.sdkVersion, forHTTPHeaderField: "Expo-SDK-Version")

    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse,
            (200..<300).contains(httpResponse.statusCode) else {
        return nil
      }

      if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
        return parseManifestInfo(json: json, baseUrl: url)
      }
    } catch {}

    return nil
  }

  private func parseManifestInfo(json: [String: Any], baseUrl: String) -> (name: String?, iconUrl: String?)? {
    var name: String?
    var iconUrl: String?

    if let extra = json["extra"] as? [String: Any],
       let expoClient = extra["expoClient"] as? [String: Any] {
      if let expoName = expoClient["name"] as? String, !expoName.isEmpty {
        name = expoName
      }
      if let expoIcon = expoClient["iconUrl"] as? String, !expoIcon.isEmpty {
        iconUrl = absoluteIconUrl(expoIcon, baseUrl: baseUrl)
      }
      if iconUrl == nil, let expoIcon = expoClient["icon"] as? String, !expoIcon.isEmpty {
        iconUrl = absoluteIconUrl(expoIcon, baseUrl: baseUrl)
      }
    }

    if name == nil, let manifestName = json["name"] as? String, !manifestName.isEmpty {
      name = manifestName
    }

    if iconUrl == nil, let manifestIcon = json["iconUrl"] as? String, !manifestIcon.isEmpty {
      iconUrl = absoluteIconUrl(manifestIcon, baseUrl: baseUrl)
    }
    if iconUrl == nil, let manifestIcon = json["icon"] as? String, !manifestIcon.isEmpty {
      iconUrl = absoluteIconUrl(manifestIcon, baseUrl: baseUrl)
    }
    if iconUrl == nil,
       let iosConfig = json["ios"] as? [String: Any],
       let iosIcon = iosConfig["iconUrl"] as? String ?? iosConfig["icon"] as? String,
       !iosIcon.isEmpty {
      iconUrl = absoluteIconUrl(iosIcon, baseUrl: baseUrl)
    }

    return (name, iconUrl)
  }

  private func fetchRemoteSessions() async {
    guard !isFetchingRemote else {
      return
    }
    isFetchingRemote = true
    defer { isFetchingRemote = false }

    guard Date() >= nextRemoteFetchAllowedAt else {
      return
    }

    guard let sessionSecret, !sessionSecret.isEmpty else {
      self.remoteServers = []
      self.updateDevelopmentServers()
      return
    }

    guard let url = URL(string: "\(APIClient.shared.apiOrigin)/--/api/v2/active-sessions") else {
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue(sessionSecret, forHTTPHeaderField: "Expo-Session")
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue(Versions.sharedInstance.sdkVersion, forHTTPHeaderField: "Expo-SDK-Version")

    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse,
            (200..<300).contains(httpResponse.statusCode) else {
        applyRemoteFailureBackoff()
        return
      }

      let decoder = JSONDecoder()
      let sessions: [DevSession]
      if let response = try? decoder.decode(DevSessionsResponse.self, from: data) {
        sessions = response.data
      } else if let directSessions = try? decoder.decode([DevSession].self, from: data) {
        sessions = directSessions
      } else {
        applyRemoteFailureBackoff()
        return
      }

      let mappedServers = sessions.map { session in
        DevelopmentServer(
          url: session.url,
          description: session.description,
          source: session.source,
          isRunning: true,
          iconUrl: session.iconUrl
        )
      }

      self.remoteServers = mappedServers
      self.updateDevelopmentServers()
      cacheRemoteSessions(sessions)
      remoteFailureCount = 0
      nextRemoteFetchAllowedAt = .distantPast
    } catch {}
  }

  private func updateDevelopmentServers() {
    var merged: [String: DevelopmentServer] = [:]
    for server in localServers + remoteServers {
      let key = dedupeKey(for: server)
      if let existing = merged[key] {
        merged[key] = preferredServer(existing: existing, candidate: server)
      } else {
        merged[key] = server
      }
    }
    let newServers = merged.values.sorted { $0.url < $1.url }
    if newServers != developmentServers {
      developmentServers = newServers
    }
  }

  private func dedupeKey(for server: DevelopmentServer) -> String {
    if !server.description.isEmpty && server.description != server.url {
      return normalizeDescriptionKey(server.description).lowercased()
    }
    return normalizeUrl(server.url).lowercased()
  }

  private func preferredServer(existing: DevelopmentServer, candidate: DevelopmentServer) -> DevelopmentServer {
    if isLocalhostURL(existing.url) && !isLocalhostURL(candidate.url) {
      return candidate
    }
    if isLocalhostURL(candidate.url) && !isLocalhostURL(existing.url) {
      return existing
    }
    return existing
  }

  private func normalizeDescriptionKey(_ description: String) -> String {
    if let range = description.range(of: " on ", options: .backwards) {
      let prefix = String(description[..<range.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines)
      let suffix = String(description[range.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
      if !prefix.isEmpty && !suffix.isEmpty && !suffix.contains("/") {
        return prefix
      }
    }
    return description
  }

  private func isLocalhostURL(_ url: String) -> Bool {
    guard let components = URLComponents(string: url),
          let host = components.host?.lowercased() else {
      return false
    }
    return host == "localhost" || host == "127.0.0.1"
  }

  private func cacheRemoteSessions(_ sessions: [DevSession]) {
    let cache = DevSessionsCache(
      timestamp: Date(),
      sessions: sessions
    )
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    if let data = try? encoder.encode(cache) {
      UserDefaults.standard.set(data, forKey: remoteCacheKey)
    }
  }

  private func loadCachedRemoteSessions() {
    guard let data = UserDefaults.standard.data(forKey: remoteCacheKey) else {
      return
    }
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    guard let cache = try? decoder.decode(DevSessionsCache.self, from: data) else {
      return
    }
    let mappedServers = cache.sessions.map { session in
      DevelopmentServer(
        url: session.url,
        description: session.description,
        source: session.source,
        isRunning: true,
        iconUrl: session.iconUrl
      )
    }
    remoteServers = mappedServers
    updateDevelopmentServers()
  }

  private func applyRemoteFailureBackoff() {
    remoteFailureCount += 1
    let cappedFailures = min(remoteFailureCount, 5)
    let delay = min(pow(2.0, Double(cappedFailures)) * 2.0, 60.0)
    nextRemoteFetchAllowedAt = Date().addingTimeInterval(delay)
  }

  private func absoluteIconUrl(_ iconUrl: String, baseUrl: String) -> String? {
    if URL(string: iconUrl)?.scheme != nil {
      return iconUrl
    }
    guard let base = URL(string: baseUrl),
          let absolute = URL(string: iconUrl, relativeTo: base) else {
      return nil
    }
    return absolute.absoluteString
  }
}

private struct DevSessionsResponse: Codable {
  let data: [DevSession]
}

private struct DevSession: Codable {
  let description: String
  let url: String
  let source: String
  let iconUrl: String?
}

private struct DevSessionsCache: Codable {
  let timestamp: Date
  let sessions: [DevSession]
}
