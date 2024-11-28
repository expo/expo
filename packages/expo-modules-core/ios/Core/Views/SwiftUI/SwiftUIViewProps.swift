// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   Base implementation of the view props object for SwiftUI views.
   It's a record that can be observed by SwiftUI to re-render on its changes.
   */
  open class ViewProps: ObservableObject, Record {
    public required init() {}

    /**
     An array of views passed by React as children.
     */
    @Field public var children: [Child]?

    internal func updateRawProps(_ rawProps: [String: Any], appContext: AppContext) throws {
      // Update the props just like the records
      try update(withDict: rawProps, appContext: appContext)

      // Notify subscribed views about the change to re-render them.
      objectWillChange.send()
    }
  }
}
