import ExpoModulesCore

internal struct FilePrintResult: Record {
  @Field
  var uri: String = ""

  @Field
  var numberOfPages: Int = 0

  @Field
  var base64: String? = nil
}

internal struct PrinterSelectResult: Record {
  @Field
  var url: String? = nil

  @Field
  var name: String? = nil
}
