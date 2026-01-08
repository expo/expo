// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine
import UIKit

@MainActor
class DevelopmentServerService: ObservableObject {
  @Published var developmentServers: [DevelopmentServer] = []

  private var discoveryCancellables = Set<AnyCancellable>()
  private let discoveryInterval: TimeInterval = 2.0
  private let remoteRefreshInterval: TimeInterval = 10.0
  private var localServers: [DevelopmentServer] = []
  private var remoteServers: [DevelopmentServer] = []
  private var sessionSecret: String?

  func startDiscovery() {
    stopDiscovery()
    discoverDevelopmentServers()
    refreshRemoteSessions()

    Timer.publish(every: discoveryInterval, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak self] _ in
        self?.discoverDevelopmentServers()
      }
      .store(in: &discoveryCancellables)

    Timer.publish(every: remoteRefreshInterval, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak self] _ in
        self?.refreshRemoteSessions()
      }
      .store(in: &discoveryCancellables)
  }

  func stopDiscovery() {
    discoveryCancellables.removeAll()
  }

  func setSessionSecret(_ sessionSecret: String?) {
    self.sessionSecret = sessionSecret
    refreshRemoteSessions()
  }

  func discoverDevelopmentServers() {
    Task {
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

      await MainActor.run {
        self.localServers = discoveredServers
        self.updateDevelopmentServers()
      }
    }
  }

  func refreshRemoteSessions() {
    Task {
      await fetchRemoteSessions()
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
    let manifestPaths = [
      "\(url)/manifest",
      "\(url)/manifest?platform=ios"
    ]

    for manifestPath in manifestPaths {
      guard let manifestURL = URL(string: manifestPath) else {
        continue
      }

      var request = URLRequest(url: manifestURL)
      request.setValue("application/expo+json,application/json", forHTTPHeaderField: "Accept")
      request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
      request.setValue("client", forHTTPHeaderField: "Expo-Client-Environment")
      request.setValue(EXVersions.sharedInstance().sdkVersion, forHTTPHeaderField: "Expo-SDK-Version")

      do {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
          continue
        }

        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
          if let parsed = parseManifestInfo(json: json, baseUrl: url) {
            return parsed
          }
        }
      } catch {}
    }

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
    guard let sessionSecret, !sessionSecret.isEmpty else {
      await MainActor.run {
        self.remoteServers = []
        self.updateDevelopmentServers()
      }
      return
    }

    guard let url = URL(string: "\(APIClient.shared.apiOrigin)/--/api/v2/development-sessions") else {
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue(sessionSecret, forHTTPHeaderField: "Expo-Session")
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue(EXVersions.sharedInstance().sdkVersion, forHTTPHeaderField: "Expo-SDK-Version")

    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse,
            (200..<300).contains(httpResponse.statusCode) else {
        return
      }

      let decoder = JSONDecoder()
      let sessions: [DevSession]
      if let response = try? decoder.decode(DevSessionsResponse.self, from: data) {
        sessions = response.data
      } else if let directSessions = try? decoder.decode([DevSession].self, from: data) {
        sessions = directSessions
      } else {
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

      await MainActor.run {
        self.remoteServers = mappedServers
        self.updateDevelopmentServers()
      }
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
    developmentServers = merged.values.sorted { $0.url < $1.url }
  }

  private func dedupeKey(for server: DevelopmentServer) -> String {
    if !server.description.isEmpty && server.description != server.url {
      return server.description.lowercased()
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
  
  private func isLocalhostURL(_ url: String) -> Bool {
    guard let components = URLComponents(string: url),
          let host = components.host?.lowercased() else {
      return false
    }
    return host == "localhost" || host == "127.0.0.1"
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

private struct DevSessionsResponse: Decodable {
  let data: [DevSession]
}

private struct DevSession: Decodable {
  let description: String
  let url: String
  let source: String
  let iconUrl: String?
}
