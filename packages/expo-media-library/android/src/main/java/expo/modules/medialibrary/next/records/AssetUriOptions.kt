package expo.modules.medialibrary.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

// MediaStore has no edited/original renditions, so this is accepted for signature parity with
// iOS and otherwise ignored.
@OptimizedRecord
data class AssetUriOptions(
  @Field val version: AssetUriVersion? = AssetUriVersion.CURRENT
) : Record
