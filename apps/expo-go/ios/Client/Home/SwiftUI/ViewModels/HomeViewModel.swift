import Foundation
import SwiftUI

@MainActor
class HomeViewModel: ObservableObject {
  @Published var devServers: [DevServer] = []
  @Published var recentProjects: [Project] = []
  @Published var userProjects: [Project] = []
  @Published var userSnacks: [Snack] = []
  @Published var isLoading = false
  @Published var showQRScanner = false
  @Published var showAccountModal = false
  @Published var isAuthenticated = false
  @Published var currentUser: User?
  @Published var errorMessage: String?
  @Published var showError = false
  
  private var pollingTask: Task<Void, Never>?
  
  init() {
    loadInitialData()
    startDevServerPolling()
  }
  
  deinit {
    pollingTask?.cancel()
  }
  
  // MARK: - Public Methods (Integration with EXHomeAppManager)
  
  func addHistoryItem(url: URL, manifest: [String: Any]) {
    // TODO: Add to recently opened projects
    // This would integrate with the existing history system
    loadRecentProjects()
  }
  
  // MARK: - Data Loading Methods
  
  private func loadInitialData() {
    loadRecentProjects()
    loadUserData()
  }
  
  private func loadRecentProjects() {
    // TODO: Integrate with EXKernel history system
    // For now, using mock data
    recentProjects = Project.mockList
  }
  
  private func loadUserData() {
    // TODO: Integrate with existing auth system
    // Check if user is authenticated and load projects/snacks
    if isAuthenticated {
      loadUserProjects()
      loadUserSnacks()
    }
  }
  
  private func loadUserProjects() {
    // TODO: Replace with actual GraphQL query
    Task {
      isLoading = true
      defer { isLoading = false }
      
      // Simulate API call
      try? await Task.sleep(nanoseconds: 1_000_000_000)
      userProjects = Project.mockList
    }
  }
  
  private func loadUserSnacks() {
    // TODO: Replace with actual GraphQL query
    Task {
      isLoading = true
      defer { isLoading = false }
      
      // Simulate API call
      try? await Task.sleep(nanoseconds: 1_000_000_000)
      userSnacks = Snack.mockList
    }
  }
  
  func refresh() async {
    await withTaskGroup(of: Void.self) { group in
      group.addTask {
        await self.discoverDevServers()
      }
      
      group.addTask {
        await self.loadUserProjects()
      }
      
      group.addTask {
        await self.loadUserSnacks()
      }
    }
  }
  
  private func startDevServerPolling() {
    pollingTask = Task {
      while !Task.isCancelled {
        await discoverDevServers()
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 10 seconds
      }
    }
  }
  
  func discoverDevServers() async {
    var discoveredServers: [DevServer] = []
    
    let portsToCheck = [8081, 8082, 8083, 8084, 8085, 19000, 19001, 19002]
    let baseAddress = "http://localhost"
    
    await withTaskGroup(of: DevServer?.self) { group in
      for port in portsToCheck {
        group.addTask {
          await self.checkDevServer(url: "\(baseAddress):\(port)")
        }
      }
      
      for await server in group {
        if let server = server {
          discoveredServers.append(server)
        }
      }
    }
    
    devServers = discoveredServers.sorted { $0.url < $1.url }
  }
  
  private func checkDevServer(url: String) async -> DevServer? {
    guard let statusURL = URL(string: "\(url)/status") else {
      return nil
    }
    
    do {
      let (data, response) = try await URLSession.shared.data(from: statusURL)
      
      if let httpResponse = response as? HTTPURLResponse,
         httpResponse.statusCode == 200 {
        if let statusString = String(data: data, encoding: .utf8),
           statusString.contains("packager-status:running") {
          return DevServer(
            url: url,
            description: url,
            source: "local"
          )
        }
      }
    } catch {
      // Server not running or not reachable
    }
    
    return nil
  }
  
  func openProject(url: String) {
    // TODO: Integrate with EXKernel to launch project
    // This would call the existing project loading mechanism
    print("Opening project: \(url)")
  }
  
  func clearRecentProjects() {
    // TODO: Clear history in EXKernel
    recentProjects.removeAll()
  }
  
  // MARK: - Authentication Actions
  
  func signIn() {
    // TODO: Integrate with existing auth system
    showAccountModal = true
  }
  
  func signOut() {
    // TODO: Integrate with existing auth system
    isAuthenticated = false
    currentUser = nil
    userProjects.removeAll()
    userSnacks.removeAll()
  }
  
  // MARK: - Error Handling
  
  func showError(_ message: String) {
    errorMessage = message
    showError = true
  }
  
  func dismissError() {
    errorMessage = nil
    showError = false
  }
}
