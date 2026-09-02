package expo.modules.camera.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class DocumentScannerOptions : Record {
  @Field
  var requestPdf: Boolean = false

  // Unused on Android.
  @Field
  var quality: Double = 1.0
}
