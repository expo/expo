package expo.modules.calendar.next

import expo.modules.kotlin.sharedobjects.SharedObject

class ExpoCalendarAttendee : SharedObject {
  val id: String

  constructor(id: String) {
    this.id = id
  }
}
