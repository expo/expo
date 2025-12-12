// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

@MainActor
class DataService: ObservableObject {
  @Published var projects: [ExpoProject] = []
  @Published var snacks: [Snack] = []
  @Published var isLoadingData = false
  @Published var dataError: APIError?

  private var pollingCancellables = Set<AnyCancellable>()
  private let pollingInterval: TimeInterval = 10.0

  func startPolling(accountName: String) {
    stopPolling()

    Task {
      await fetchProjectsAndData(accountName: accountName)
    }

    Timer.publish(every: pollingInterval, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak self] _ in
        Task {
          await self?.fetchProjectsAndData(accountName: accountName)
        }
      }
      .store(in: &pollingCancellables)
  }

  func stopPolling() {
    pollingCancellables.removeAll()
  }

  func fetchProjectsAndData(accountName: String) async {
    isLoadingData = true
    dataError = nil
    defer { Task { @MainActor in isLoadingData = false } }

    do {
      let response: HomeScreenDataResponse = try await APIClient.shared.request(
        Queries.getHomeScreenData(),
        variables: [
          "accountName": accountName,
          "platform": "IOS"
        ]
      )

      await MainActor.run {
        self.projects = response.data.account.byName.apps.map { $0.toExpoProject() }
        self.snacks = response.data.account.byName.snacks
        self.dataError = nil
      }
    } catch let error as APIError {
      await MainActor.run {
        self.dataError = error
      }
    } catch {
      await MainActor.run {
        self.dataError = .networkError(error)
      }
    }
  }

  func clearData() {
    projects = []
    snacks = []
    dataError = nil
  }
}
