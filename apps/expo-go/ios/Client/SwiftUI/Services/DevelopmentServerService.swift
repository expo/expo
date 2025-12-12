// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

@MainActor
class DevelopmentServerService: ObservableObject {
  @Published var developmentServers: [DevelopmentServer] = []

  private var discoveryCancellables = Set<AnyCancellable>()
  private let discoveryInterval: TimeInterval = 2.0

  func startDiscovery() {
    stopDiscovery()
    discoverDevelopmentServers()

    Timer.publish(every: discoveryInterval, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak self] _ in
        self?.discoverDevelopmentServers()
      }
      .store(in: &discoveryCancellables)
  }

  func stopDiscovery() {
    discoveryCancellables.removeAll()
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
        self.developmentServers = discoveredServers.sorted { $0.url < $1.url }
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
          return DevelopmentServer(
            url: url,
            description: url,
            source: "local",
            isRunning: true
          )
        }
      }
    } catch {}

    return nil
  }
}
