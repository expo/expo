import ExpoModulesCore

internal final class FailedToGetMutableContact: Exception {
  override var reason: String {
    "Could not get a mutable contact from the contact"
  }
}

internal final class FailedToGetContactField: GenericException<String> {
  override var reason: String {
    "Could not get a field from the contact for key: \(param)"
  }
}

internal final class FailedToGetContactProperty: GenericException<String> {
  override var reason: String {
    "Could not get a property from the contact for id: \(param)"
  }
}

internal final class ContactNotFoundException: GenericException<String> {
  override var reason: String {
    "Failed to find a contact with id: \(param)"
  }
}

internal final class GroupNotFoundException: GenericException<String> {
  override var reason: String {
    "Failed to find a group with id: \(param)"
  }
}

internal final class FailedToCacheContactImage: GenericException<String> {
  override var reason: String {
    "Failed to save contact image to cache: \(param)"
  }
}

internal final class FailedToSetReadOnlyProperty: Exception {
  override var reason: String {
    "Tried to set a value on a read-only property"
  }
}

internal final class FailedToParseDate: Exception {
  override var reason: String {
    "Could not parse date"
  }
}

internal final class ContactNotesNotAccessibleException: Exception {
  override var reason: String {
    "Could not access the note of the contact, because the app does not have the com.apple.developer.contacts.notes entitlement. "
      + "Request the entitlement from Apple, set `ios.accessesContactNotes` to `true` in the app config, and create a development build"
  }
}

internal final class ContactKeyNotFetchedException: GenericException<String> {
  override var reason: String {
    "The contact was fetched without the key '\(param)'. This is a bug in expo-contacts, please report it"
  }
}
