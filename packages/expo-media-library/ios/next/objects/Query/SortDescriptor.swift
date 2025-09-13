import Photos
import ExpoModulesCore

struct SortDescriptor: Record {
  @Field var key: AssetField = AssetField.MODIFICATION_TIME
  @Field var ascending: Bool?

  func toNSSortDescriptor() -> NSSortDescriptor {
    return NSSortDescriptor(key: key.photosKey(), ascending: ascending ?? true)
  }
}
