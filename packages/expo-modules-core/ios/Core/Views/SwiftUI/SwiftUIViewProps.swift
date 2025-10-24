// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

internal let GLOBAL_EVENT_NAME = "onGlobalEvent"

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
    public var children: [any AnyChild]?

    public internal(set) weak var appContext: AppContext?

    /**
     A global event dispatcher that allows views to call `view.dispatchEvent(_:payload)` directly
     */
    public let globalEventDispatcher = EventDispatcher(GLOBAL_EVENT_NAME)

    internal func updateRawProps(_ rawProps: [String: Any], appContext: AppContext) throws {
      // Update the props just like the records
      try update(withDict: rawProps, appContext: appContext)

      // Notify subscribed views about the change to re-render them.
      objectWillChange.send()
    }

    internal func setUpEvents(_ dispatcher: @escaping (_ eventName: String, _ payload: Any) -> Void) {
      globalEventDispatcher.handler = { payload in
        dispatcher(GLOBAL_EVENT_NAME, payload)
      }

      let mirror = Mirror(reflecting: self)
      allMirrorChildren(mirror).forEach { (label: String?, value: Any) in
        guard let event = value as? EventDispatcher else {
          return
        }
        guard let eventName = event.customName ?? convertLabelToKey(label) else {
          fatalError("The event has no name")
        }
        event.handler = { payload in
          dispatcher(eventName, payload)
        }
      }
    }
  }
}
