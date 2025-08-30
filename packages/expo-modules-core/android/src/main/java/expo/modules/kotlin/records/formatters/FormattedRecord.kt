package expo.modules.kotlin.records.formatters

import expo.modules.kotlin.records.Record

data class FormattedRecord<RecordType : Record>(
  internal val record: RecordType,
  internal val formatter: Formatter<RecordType>
)
