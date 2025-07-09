import ExpoModulesCore

internal final class FailedToFetchContactsException: Exception {
  override var reason: String {
    "Error while fetching contacts"
  }
}

internal final class FailedToCacheContacts: Exception {
  override var reason: String {
    "Failed to cache contacts"
  }
}

internal final class FailedToGetContactException: GenericException<String> {
  override var reason: String {
    "Failed to get contact with id: \(param)"
  }
}

internal final class FailedToGetGroupException: GenericException<String> {
  override var reason: String {
    "Failed to get group with id: \(param)"
  }
}

internal final class FailedToSaveException: Exception {
  override var reason: String {
    "Failed to provide a contact identifier"
  }
}

internal final class FilePermissionException: GenericException<String?> {
  override var reason: String {
    "File '\(String(describing: param))' isn't readable."
  }
}

internal final class FailedToOpenImageException: Exception {
  override var reason: String {
    "Could not open provided image"
  }
}

internal final class FetchContainersException: Exception {
  override var reason: String {
    "Error fetching containers"
  }
}

internal final class FetchGroupException: GenericException<String> {
  override var reason: String {
    "Failed to get group for name: \(param)"
  }
}

internal final class GroupQueryException: Exception {
  override var reason: String {
    "Failed to get groups"
  }
}

internal final class FailedToUnifyContactException: Exception {
  override var reason: String {
    "Failed to unify contact"
  }
}

internal final class FailedToCreateViewControllerException: Exception {
  override var reason: String {
    "Could not build controller, invalid props"
  }
}

internal final class FailedToFindContactException: Exception {
  override var reason: String {
    "Failed to find contact"
  }
}

internal final class ContactPickingInProgressException: Exception {
  override var reason: String {
    "Different contact picking in progress. Await other contact picking first"
  }
}

internal final class ContactManipulationInProgressException: Exception {
  override var reason: String {
    "Different contact manipulation in progress. Await other contact manipulation first"
  }
}

internal final class MissingCurrentViewControllerException: Exception {
  override var reason: String {
    "Cannot determine currently presented view controller"
  }
}

internal final class AccessPickerUnavailableException: Exception {
  override var reason: String {
    "Contact access picker is only available as of iOS 18.0"
  }
}

internal final class AccessPickerAlreadyPresentedException: Exception {
  override var reason: String {
    "Contact access picker is already presented"
  }
}
