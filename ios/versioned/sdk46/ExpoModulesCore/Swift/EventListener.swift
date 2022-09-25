/**
 Represents a listener for the specific event.
 */
internal struct EventListener: AnyDefinition {
  let name: EventName
  let call: (Any?, Any?) throws -> Void

  /**
   Listener initializer for events without sender and payload.
   */
  init(_ name: EventName, _ listener: @escaping () -> Void) {
    self.name = name
    self.call = { _, _ in listener() }
  }

  /**
   Listener initializer for events with no payload.
   */
  init<Sender>(_ name: EventName, _ listener: @escaping (Sender) -> Void) {
    self.name = name
    self.call = { sender, _ in
      guard let sender = sender as? Sender else {
        throw InvalidSenderTypeException((eventName: name, senderType: Sender.self))
      }
      listener(sender)
    }
  }

  /**
   Listener initializer for events that specify the payload.
   */
  init<Sender, PayloadType>(_ name: EventName, _ listener: @escaping (Sender, PayloadType?) -> Void) {
    self.name = name
    self.call = { sender, payload in
      guard let sender = sender as? Sender else {
        throw InvalidSenderTypeException((eventName: name, senderType: Sender.self))
      }
      listener(sender, payload as? PayloadType)
    }
  }
}

class InvalidSenderTypeException: GenericException<(eventName: EventName, senderType: Any.Type)> {
  override var reason: String {
    "Sender for event '\(param.eventName)' must be of type \(param.senderType)"
  }
}

public enum EventName: Equatable {
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
