// Copyright 2022-present 650 Industries. All rights reserved.

import SwiftUI

open class ViewProps: ObservableObject, Record {
  public required init() {}

  internal func updateRawProps(_ rawProps: [String: Any], appContext: AppContext) throws {
    // Update the props just like the records
    try update(withDict: rawProps, appContext: appContext)

    // Notify subscribed views about the change to re-render them.
    objectWillChange.send()
  }
}

public protocol SwiftUIViewProps: ObservableObject, Record {}

public typealias Props = SwiftUI.EnvironmentObject
