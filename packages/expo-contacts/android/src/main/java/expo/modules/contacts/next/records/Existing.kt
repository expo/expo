package expo.modules.contacts.next.records

import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
interface RecordWithId : Record {
  val id: String
}

@OptimizedRecord
interface ExistingRecord : RecordWithId

@OptimizedRecord
interface PatchRecord : RecordWithId

@OptimizedRecord
interface NewRecord : Record
