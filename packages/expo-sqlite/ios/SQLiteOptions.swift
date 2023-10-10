// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct OpenDatabaseOptions: Record {
  @Field
  var enableCRSQLite: Bool = false

  @Field
  var enableChangeListener: Bool = false
}
