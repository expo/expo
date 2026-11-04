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

internal final class ContactFieldNotAccessibleException: GenericException<String> {
  override var reason: String {
    "Could not write the '\(param)' field of the contact, because the app cannot access this field. On iOS the note field requires the com.apple.developer.contacts.notes entitlement: set `ios.accessesContactNotes` to `true` in the app config and create a development build"
  }
}
