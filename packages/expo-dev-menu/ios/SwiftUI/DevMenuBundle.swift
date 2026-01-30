// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

func getDevMenuBundle() -> Bundle? {
  if let bundleURL = Bundle.main.url(forResource: "EXDevMenu", withExtension: "bundle"),
     let bundle = Bundle(url: bundleURL) {
    return bundle
  }
  return .main
}
