// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum StorageKey: String {
  case recentlyOpenedApps = "expo-recently-opened-apps"
  case lastRefreshTimestamp = "expo-last-refresh-timestamp"
}

class PersistenceManager {
  static let shared = PersistenceManager()

  private init() {}

  func saveRecentlyOpened(_ apps: [RecentlyOpenedApp]) {
    do {
      let encoder = JSONEncoder()
      encoder.dateEncodingStrategy = .iso8601
      let data = try encoder.encode(apps)
      UserDefaults.standard.set(data, forKey: StorageKey.recentlyOpenedApps.rawValue)
    } catch {
      print("Failed to save recently opened apps: \(error)")
    }
  }

  func loadRecentlyOpened() -> [RecentlyOpenedApp] {
    guard let data = UserDefaults.standard.data(forKey: StorageKey.recentlyOpenedApps.rawValue) else {
      return []
    }

    do {
      let decoder = JSONDecoder()
      decoder.dateDecodingStrategy = .iso8601
      return try decoder.decode([RecentlyOpenedApp].self, from: data)
    } catch {
      print("Failed to load recently opened apps: \(error). Clearing corrupt data.")
      // Clear corrupt data
      UserDefaults.standard.removeObject(forKey: StorageKey.recentlyOpenedApps.rawValue)
      return []
    }
  }

  func saveLastRefreshTimestamp(_ timestamp: Date) {
    UserDefaults.standard.set(timestamp.timeIntervalSince1970, forKey: StorageKey.lastRefreshTimestamp.rawValue)
  }

  func loadLastRefreshTimestamp() -> Date? {
    let timestamp = UserDefaults.standard.double(forKey: StorageKey.lastRefreshTimestamp.rawValue)
    guard timestamp > 0 else { return nil }
    return Date(timeIntervalSince1970: timestamp)
  }
}
