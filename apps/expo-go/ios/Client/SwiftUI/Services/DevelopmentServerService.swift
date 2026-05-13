// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Network

enum LocalNetworkPermissionStatus: Equatable {
  case unknown
  case checking
  case granted
  case denied
}

@MainActor
class DevelopmentServerService: ObservableObject {
  @Published var developmentServers: [DevelopmentServer] = []
  @Published var permissionStatus: LocalNetworkPermissionStatus = .unknown

  static let networkPermissionGrantedKey = "expo.go.hasGrantedNetworkPermission"
  private let remoteRefreshInterval: TimeInterval = 10.0
  private let remoteCacheKey = "expo-dev-sessions-cache"
  private var remoteFailureCount = 0
  private var nextRemoteFetchAllowedAt: Date = .distantPast
  private let bonjourType = "_expo._tcp"
  private var remoteServers: [DevelopmentServer] = []
  private var bonjourServers: [DevelopmentServer] = []
  private var sessionSecret: String?
  private var remoteRefreshTask: Task<Void, Never>?
  private var browser: NWBrowser?
  private var pingTask: Task<Void, Never>?
  private var isFetchingRemote = false

  var hasGrantedNetworkPermission: Bool {
    UserDefaults.standard.bool(forKey: Self.networkPermissionGrantedKey)
  }

  static var isSimulator: Bool {
    #if targetEnvironment(simulator)
    return true
    #else
    return false
    #endif
  }

  func startDiscovery() {
    stopDiscovery()
    loadCachedRemoteSessions()
    startRemoteRefreshLoop()
    startBonjourBrowser()
  }

  func stopDiscovery() {
    remoteRefreshTask?.cancel()
    remoteRefreshTask = nil
    stopBonjourBrowser()
  }

  func markNetworkPermissionGranted() {
    UserDefaults.standard.set(true, forKey: Self.networkPermissionGrantedKey)
    permissionStatus = .granted
  }

  func checkLocalNetworkAccess() async -> Bool {
    let serviceType = bonjourType
    let queue = DispatchQueue(label: "expo.go.permissioncheck")

    return await withCheckedContinuation { continuation in
      var done = false

      let listener = try? NWListener(using: .tcp, on: .any)
      listener?.service = NWListener.Service(type: serviceType)
      listener?.stateUpdateHandler = { _ in }
      listener?.newConnectionHandler = { $0.cancel() }
      listener?.start(queue: queue)

      let browser = NWBrowser(for: .bonjour(type: serviceType, domain: nil), using: .tcp)
      browser.browseResultsChangedHandler = { results, _ in
        guard !done else { return }
        if !results.isEmpty {
          done = true
          continuation.resume(returning: true)
          browser.cancel()
          listener?.cancel()
        }
      }

      browser.stateUpdateHandler = { state in
        guard !done else { return }
        if case .waiting(let error) = state,
           case .dns(let dnsError) = error,
           dnsError == kDNSServiceErr_PolicyDenied {
          done = true
          continuation.resume(returning: false)
          browser.cancel()
          listener?.cancel()
        }
      }

      browser.start(queue: queue)

      queue.asyncAfter(deadline: .now() + 2) {
        guard !done else { return }
        done = true
        continuation.resume(returning: false)
        browser.cancel()
        listener?.cancel()
      }
    }
  }

  func setSessionSecret(_ sessionSecret: String?) {
    guard self.sessionSecret != sessionSecret else { return }
    self.sessionSecret = sessionSecret
  }

  func refreshRemoteSessions() async {
    await fetchRemoteSessions()
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

    guard let url = URL(string: "\(APIClient.shared.apiOrigin)/--/api/v2/development-sessions") else {
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
    for server in bonjourServers + remoteServers {
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

  // MARK: - Bonjour Discovery

  private func startBonjourBrowser() {
    stopBonjourBrowser()

    let params = NWParameters()
    params.includePeerToPeer = true
    params.allowLocalEndpointReuse = true

    browser = NWBrowser(
      for: NWBrowser.Descriptor.bonjourWithTXTRecord(type: bonjourType, domain: nil),
      using: params
    )

    browser?.stateUpdateHandler = { [weak self] state in
      Task { @MainActor [weak self] in
        guard let self else { return }
        switch state {
        case .waiting(let error):
          if case .dns(let dnsError) = error, dnsError == kDNSServiceErr_PolicyDenied {
            self.permissionStatus = .denied
          }
        case .failed(let error):
          if case .dns(let dnsError) = error, dnsError == kDNSServiceErr_PolicyDenied {
            self.permissionStatus = .denied
          }
        default:
          break
        }
      }
    }

    browser?.browseResultsChangedHandler = { [weak self] results, _ in
      guard let self else { return }
      Task { @MainActor [weak self, results] in
        guard let self else { return }
        self.markNetworkPermissionGranted()
        self.pingTask?.cancel()
        self.pingTask = Task {
          defer { self.pingTask = nil }
          await self.pingDiscoveryResults(results.map { result in
            DiscoveryResult(
              name: NetworkUtilities.getNWBrowserResultName(result),
              endpoint: result.endpoint
            )
          })
        }
      }
    }

    browser?.start(queue: DispatchQueue(label: "expo.go.bonjour.discovery"))
  }

  private func stopBonjourBrowser() {
    pingTask?.cancel()
    browser?.cancel()
    pingTask = nil
    browser = nil
  }

  private func pingDiscoveryResults(_ results: [DiscoveryResult]) async {
    guard !Task.isCancelled else { return }

    var discoveredServers: [DevelopmentServer] = []
    await withTaskGroup(of: DevelopmentServer?.self) { group in
      for result in results {
        group.addTask {
          return await self.resolveBonjourServer(result)
        }
      }

      for await server in group {
        if let server {
          discoveredServers.append(server)
        }
      }
    }

    guard !Task.isCancelled else { return }

    bonjourServers = discoveredServers
    updateDevelopmentServers()
  }

  private func resolveBonjourServer(_ result: DiscoveryResult) async -> DevelopmentServer? {
    do {
      if let host = try await NetworkUtilities.resolveBundlerEndpoint(
        endpoint: result.endpoint,
        queue: DispatchQueue(label: "expo.go.bonjour.resolve")
      ) {
        let manifestInfo = await fetchLocalManifestInfo(url: host)
        let description = result.name ?? manifestInfo?.name ?? host
        return DevelopmentServer(
          url: host,
          description: description,
          source: "bonjour",
          isRunning: true,
          iconUrl: manifestInfo?.iconUrl
        )
      }
    } catch {}

    return nil
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
