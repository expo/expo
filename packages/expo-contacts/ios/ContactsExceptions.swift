import ExpoModulesCore

internal class FailedToFetchContactsException: Exception {
  override var reason: String {
    "Error while fetching contacts"
  }
}

internal class FailedToCacheContacts: Exception {
  override var reason: String {
    "Failed to cache contacts"
  }
}

internal class FailedToGetContactException: GenericException<String> {
  override var reason: String {
    "Failed to get contact with id: \(param)"
  }
}

internal class FailedToGetGroupException: GenericException<String> {
  override var reason: String {
    "Failed to get group with id: \(param)"
  }
}

internal class FailedToSaveException: Exception {
  override var reason: String {
    "Failed to provide a contact identifier"
  }
}

internal class FilePermissionException: GenericException<String?> {
  override var reason: String {
    "File '\(String(describing: param))' isn't readable."
  }
}

internal class FailedToOpenImageException: Exception {
  override var reason: String {
    "Could not open provided image"
  }
}

internal class FetchContainersException: Exception {
  override var reason: String {
    "Error fetching containers"
  }
}

internal class FetchGroupException: GenericException<String> {
  override var reason: String {
    "Failed to get group for name: \(param)"
  }
}

internal class GroupQueryException: Exception {
  override var reason: String {
    "Failed to get groups"
  }
}

internal class FailedToUnifyContactException: Exception {
  override var reason: String {
    "Failed to unify contact"
  }
}

internal class FailedToCreateViewControllerException: Exception {
  override var reason: String {
    "Could not build controller, invalid props"
  }
}

internal class FailedToFindContactException: Exception {
  override var reason: String {
    "Failed to find contact"
  }
}

internal class ContactPickingInProgressException: Exception {
  override var reason: String {
    "Different contact picking in progress. Await other contact picking first"
  }
}

internal class ContactManipulationInProgressException: Exception {
  override var reason: String {
    "Different contact manipulation in progress. Await other contact manipulation first"
  }
}
