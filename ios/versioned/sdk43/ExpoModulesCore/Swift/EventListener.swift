/**
 Represents a listener for the specific event.
 */
internal struct EventListener: AnyDefinition {
  let name: EventName
  let call: (Any?) -> Void

  init(_ name: EventName, _ listener: @escaping () -> Void) {
    self.name = name
    self.call = { payload in listener() }
  }

  init<PayloadType>(_ name: EventName, _ listener: @escaping (PayloadType?) -> Void) {
    self.name = name
    self.call = { payload in listener(payload as? PayloadType) }
  }
}

internal enum EventName: Equatable {
  case custom(_ name: String)

  // MARK: Module lifecycle

  case moduleCreate
  case moduleDestroy
  case appContextDestroys

  // MARK: App (UIApplication) lifecycle

  case appEntersForeground
  case appBecomesActive
  case appEntersBackground
}
