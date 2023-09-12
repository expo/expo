import ExpoModulesCore

enum BackgroundFetchStatus: Int, Enumerable {
  case denied = 1
  case restricted = 2
  case available = 3
}

enum BackgroundFetchResult: Int, Enumerable {
  case noData = 1
  case newData = 2
  case failed = 3
}
