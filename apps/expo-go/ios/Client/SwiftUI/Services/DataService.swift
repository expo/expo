// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@MainActor
class DataService: ObservableObject {
  @Published var projects: [ExpoProject] = []
  @Published var snacks: [Snack] = []
  @Published var isLoadingData = false
  @Published var dataError: APIError?

  private let pollingInterval: TimeInterval = 10.0
  private var pollingTask: Task<Void, Never>?
  private var hasCompletedInitialFetch = false

  func startPolling(accountName: String) {
    stopPolling()

    pollingTask = Task { [weak self] in
      guard let self else { return }
      while !Task.isCancelled {
        await self.fetchProjectsAndData(accountName: accountName)
        try? await Task.sleep(nanoseconds: UInt64(self.pollingInterval * 1_000_000_000))
      }
    }
  }

  func stopPolling() {
    pollingTask?.cancel()
    pollingTask = nil
  }

  func fetchProjectsAndData(accountName: String) async {
    if !hasCompletedInitialFetch {
      isLoadingData = true
    }
    dataError = nil

    defer {
      isLoadingData = false
      hasCompletedInitialFetch = true
    }

    do {
      let response: HomeScreenDataResponse = try await APIClient.shared.request(
        Queries.getHomeScreenData(),
        variables: [
          "accountName": accountName,
          "platform": "IOS"
        ]
      )

      if Task.isCancelled {
        return
      }

      let newProjects = response.data.account.byName.apps.map { $0.toExpoProject() }
      let newSnacks = response.data.account.byName.snacks

      if newProjects != self.projects {
        self.projects = newProjects
      }
      if newSnacks != self.snacks {
        self.snacks = newSnacks
      }
      if self.dataError != nil {
        self.dataError = nil
      }
    } catch is CancellationError {
      return
    } catch let error as APIError {
      self.dataError = error
    } catch {
      self.dataError = .networkError(error)
    }
  }

  func clearData() {
    projects = []
    snacks = []
    dataError = nil
    hasCompletedInitialFetch = false
  }
}
