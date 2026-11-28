// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

func getDevMenuBundle() -> Bundle? {
  if let bundle = resourceBundle(named: "EXDevMenu", in: .main) {
    return bundle
  }
  // A prebuilt framework holds the bundle inside itself, under the name SwiftPM gives it.
  return resourceBundle(named: "expo-dev-menu_EXDevMenu", in: Bundle(for: DevMenuManager.self)) ?? .main
}

private func resourceBundle(named name: String, in container: Bundle) -> Bundle? {
  guard let url = container.url(forResource: name, withExtension: "bundle") else {
    return nil
  }
  return Bundle(url: url)
}
