// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 A SharedObject that conforms to ObservableObject, enabling SwiftUI views
 to observe state changes that originate from JavaScript.

 Subclass this to create typed state objects:

     class ToggleState: ObservableState {
         @Published var isOn: Bool = false {
             didSet {
                 if oldValue != isOn {
                     safeEmit(event: "isOnChange", arguments: ["isOn": isOn])
                 }
             }
         }
     }

 Register in the module via `Class()`:

     Class(ToggleState.self) {
         Constructor { ToggleState() }
         Property("isOn") { $0.isOn }
             .set { $0.isOn = $1 }
     }

 Use in SwiftUI view props via `@Field`:

     final class ToggleProps: UIBaseViewProps {
         @Field var state: ToggleState?
     }

 The `@Field` system receives the SharedObject ID from JS and resolves
 it to the native instance via `DynamicSharedObjectType.cast`.
 */
internal class ObservableState: SharedObject, ObservableObject {
}
