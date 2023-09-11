import ExpoModulesCore
import MobileCoreServices

struct DocumentPickerOptions: Record {
  @Field
  var copyToCacheDirectory: Bool

  @Field
  var type: [String]

  @Field
  var multiple: Bool
}
