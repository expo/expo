import ExpoModulesCore

internal struct DocumentScannerOptions: Record {
  @Field var requestPdf: Bool = false
  @Field var quality: Double = 1
}
