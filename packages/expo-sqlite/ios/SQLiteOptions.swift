// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

@Record
struct OpenDatabaseOptions: Equatable {
  var enableChangeListener: Bool = false
  var useNewConnection: Bool = false
  var finalizeUnusedStatementsBeforeClosing: Bool = true
}
