// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A type with `@Field` members that is only created from a dictionary, such as the params of a modifier.
 Unlike `Record`, it is not converted to or from JavaScript values, so it has none of the JavaScript
 conversion conformances. Use `Record` when JavaScript passes or receives the type.
 */
internal protocol UIRecord {
  init()
}

extension UIRecord {
  typealias Dict = [String: Any]

  // One shared copy for every type, instead of one specialized copy per type.
  @inline(never)
  @_semantics("optimize.sil.specialize.generic.never")
  init(from dict: Dict, appContext: AppContext) throws {
    self.init()
    try updateFields(of: self, withDict: dict, appContext: appContext)
  }
}
