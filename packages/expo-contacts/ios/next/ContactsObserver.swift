typealias OnContactsChange = ([String: Any?]) -> Void

class ContactsObserver {
  private var contactChangeObserver: NSObjectProtocol?
  private let onChange: OnContactsChange

  init(onChange: @escaping OnContactsChange) {
    self.onChange = onChange
  }

  func startObserving() {
    guard contactChangeObserver == nil else {
      return
    }

    contactChangeObserver = NotificationCenter.default.addObserver(
      forName: .CNContactStoreDidChange,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.onChange([
        "body": nil
      ])
    }
  }

  func stopObserving() {
    if let observer = contactChangeObserver {
      NotificationCenter.default.removeObserver(observer)
      contactChangeObserver = nil
    }
  }
}
