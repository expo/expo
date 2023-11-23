import ExpoModulesCore

public class MediaLibraryModule: Module {
  private var allAssetsFetchResult: PHFetchResult<AnyObject>?
  private var writeOnly = false
  
  public func definition() -> ModuleDefinition {
    Name("ExpoMediaLibrary")
    
    Events("mediaLibraryDidChange")
    
    Constants {
      [
        "MediaType": [
          "audio": "audio",
          "photo": "photo",
          "video": "video",
          "all": "all"
        ],
        "SortBy": [
          "default": "default",
          "creationTime": "creationTime",
          "modificationTime": "modificationTime",
          "mediaType": "mediaType",
          "width": "width",
          "height": "height",
          "duration": "duration",
        ],
        "CHANGE_LISTENER_NAME": "mediaLibraryDidChange"]
    }
    
    OnCreate {
      self.appContext?.permissions?.register([
        MediaLibraryPermissionRequester(),
        MediaLibraryWriteOnlyPermissionRequester()
      ])
    }
    
    AsyncFunction("getPermissionsAsync") {
      
    }
    
    AsyncFunction("requestPermissionsAsync") {
      
    }
    
    AsyncFunction("presentPermissionsPickerAsync") {
      
    }
    
    AsyncFunction("createAssetAsync") {
      
    }
    
    AsyncFunction("saveToLibraryAsync") {
      
    }
    
    AsyncFunction("addAssetsToAlbumAsync") {
      
    }
    
    AsyncFunction("removeAssetsFromAlbumAsync") {
      
    }
    
    AsyncFunction("deleteAssetsAsync") {
      
    }
    
    AsyncFunction("getAlbumsAsync") {
      
    }
    
    AsyncFunction("getMomentsAsync") {
      
    }
    
    AsyncFunction("getAlbumAsync") {
      
    }
    
    AsyncFunction("createAlbumAsync") {
      
    }
    
    AsyncFunction("deleteAlbumsAsync") {
      
    }
    
    AsyncFunction("getAssetInfoAsync") {
      
    }
    
    AsyncFunction("getAssetsAsync") {
      
    }
    
    OnStartObserving {
      
    }
    
    OnStopObserving {
      allAssetsFetchResult = nil
    }
  }
  
  private func requesterClass() -> EXPermissionsRequester.Type {
    if writeOnly {
      return MediaLibraryPermissionRequester.self
    } else {
      return MediaLibraryWriteOnlyPermissionRequester.self
    }
  }
}

let extensionLookupFallback: [String: PHAssetMediaType] = [
    "jpeg": .image,
    "jpg": .image,
    "jpe": .image,
    "png": .image,
    "mp3": .audio,
    "mpga": .audio,
    "mov": .video,
    "qt": .video,
    "mpg": .video,
    "mpeg": .video,
    "mpe": .video,
    "m75": .video,
    "m15": .video,
    "m2v": .video,
    "ts": .video,
    "mp4": .video,
    "mpg4": .video,
    "m4p": .video,
    "avi": .video,
    "vfw": .video,
    "aiff": .audio,
    "aif": .audio,
    "wav": .audio,
    "wave": .audio,
    "bwf": .audio,
    "midi": .audio,
    "mid": .audio,
    "smf": .audio,
    "kar": .audio,
    "tiff": .image,
    "tif": .image,
    "gif": .image,
    "qtif": .image,
    "qti": .image,
    "icns": .image
]

