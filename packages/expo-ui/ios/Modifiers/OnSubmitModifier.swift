import ExpoModulesCore
import SwiftUI

internal struct OnSubmitModifier: ViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    content.onSubmit {
      eventDispatcher?(["onSubmit": [:]])
    }
  }
}
