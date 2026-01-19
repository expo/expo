package expo.modules.contacts.next.records

import expo.modules.kotlin.records.Record

interface RecordWithId : Record {
  val id: String
}

interface ExistingRecord : RecordWithId
interface PatchRecord : RecordWithId
interface NewRecord : Record
