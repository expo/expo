package expo.modules.kotlin.records.formatters

import expo.modules.kotlin.records.Record

fun <R : Record> R.format(formatter: Formatter<R>): FormattedRecord<R> {
  return FormattedRecord(this, formatter)
}
