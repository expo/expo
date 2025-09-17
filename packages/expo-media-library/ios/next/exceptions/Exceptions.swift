import ExpoModulesCore

internal final class FailedToGetPropertyException: GenericException<String> {
  override var reason: String {
    "Unable to get a property \(param)"
  }
}

internal final class FailedToCreateAssetException: GenericException<String> {
  override var reason: String {
    "Unable to create an asset \(param)"
  }
}

internal final class FailedToCreateAlbumException: GenericException<String> {
  override var reason: String {
    "Unable to create an asset \(param)"
  }
}

internal final class FailedToDeleteAssetException: GenericException<String> {
  override var reason: String {
    "Unable to delete an asset \(param)"
  }
}

internal final class FailedToGrantPermissions: Exception {
  override var reason: String {
    "Unable to grant permissions"
  }
}

internal final class FailedToGetAlbumException: GenericException<String> {
  override var reason: String {
    "Unable to get an album \(param)"
  }
}

internal final class AssetNotFoundException: GenericException<String> {
  override var reason: String {
    "Asset not found: \(param)"
  }
}

internal final class AssetCouldNotBeAddedToAlbumException: GenericException<String> {
  override var reason: String {
    "Asset could not be added to album: \(param)"
  }
}

internal final class AlbumNotFoundException: GenericException<String> {
  override var reason: String {
    "Album not found: \(param)"
  }
}

internal final class AssetMediaTypeCouldNotBeResolved: GenericException<String> {
  override var reason: String {
    "Asset media type could not be resolved: \(param)"
  }
}

internal final class QueryValueCouldNotBeParsed: GenericException<String> {
  override var reason: String {
    "Failed to parse query value: \(param)"
  }
}

internal final class MediaTypeFailedToParseString: GenericException<String> {
  override var reason: String {
    "Failed to parse string to MediaType: \(param)"
  }
}

internal final class PredicateBuilderException: GenericException<String> {
  override var reason: String {
    "Failed to build a predicate: \(param)"
  }
}
