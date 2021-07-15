package expo.modules.calendar

import android.provider.CalendarContract
import android.util.Log

internal fun reminderStringMatchingConstant(constant: Int): String =
  when (constant) {
    CalendarContract.Reminders.METHOD_ALARM -> "alarm"
    CalendarContract.Reminders.METHOD_ALERT -> "alert"
    CalendarContract.Reminders.METHOD_EMAIL -> "email"
    CalendarContract.Reminders.METHOD_SMS -> "sms"
    CalendarContract.Reminders.METHOD_DEFAULT -> "default"
    else -> "default"
  }

internal fun reminderConstantMatchingString(string: String?): Int =
  when (string) {
    "alert" -> CalendarContract.Reminders.METHOD_ALERT
    "alarm" -> CalendarContract.Reminders.METHOD_ALARM
    "email" -> CalendarContract.Reminders.METHOD_EMAIL
    "sms" -> CalendarContract.Reminders.METHOD_SMS
    else -> CalendarContract.Reminders.METHOD_DEFAULT
  }

internal fun calendarAllowedRemindersFromDBString(dbString: String): ArrayList<String> {
  val array = ArrayList<String>()
  for (constant in dbString.split(",").toTypedArray()) {
    try {
      array.add(reminderStringMatchingConstant(constant.toInt()))
    } catch (e: NumberFormatException) {
      Log.e(CalendarModule.TAG, "Couldn't convert reminder constant into an int.", e)
    }
  }
  return array
}

internal fun calendarAllowedAvailabilitiesFromDBString(dbString: String): ArrayList<String> {
  val availabilitiesStrings = ArrayList<String>()
  for (availabilityId in dbString.split(",").toTypedArray()) {
    when (availabilityId.toInt()) {
      CalendarContract.Events.AVAILABILITY_BUSY -> availabilitiesStrings.add("busy")
      CalendarContract.Events.AVAILABILITY_FREE -> availabilitiesStrings.add("free")
      CalendarContract.Events.AVAILABILITY_TENTATIVE -> availabilitiesStrings.add("tentative")
    }
  }
  return availabilitiesStrings
}

internal fun availabilityStringMatchingConstant(constant: Int): String =
  when (constant) {
    CalendarContract.Events.AVAILABILITY_BUSY -> "busy"
    CalendarContract.Events.AVAILABILITY_FREE -> "free"
    CalendarContract.Events.AVAILABILITY_TENTATIVE -> "tentative"
    else -> "busy"
  }

internal fun availabilityConstantMatchingString(string: String): Int =
  when (string) {
    "free" -> CalendarContract.Events.AVAILABILITY_FREE
    "tentative" -> CalendarContract.Events.AVAILABILITY_TENTATIVE
    else -> CalendarContract.Events.AVAILABILITY_BUSY
  }

internal fun accessStringMatchingConstant(constant: Int): String =
  when (constant) {
    CalendarContract.Events.ACCESS_CONFIDENTIAL -> "confidential"
    CalendarContract.Events.ACCESS_PRIVATE -> "private"
    CalendarContract.Events.ACCESS_PUBLIC -> "public"
    CalendarContract.Events.ACCESS_DEFAULT -> "default"
    else -> "default"
  }

internal fun accessConstantMatchingString(string: String): Int =
  when (string) {
    "confidential" -> CalendarContract.Events.ACCESS_CONFIDENTIAL
    "private" -> CalendarContract.Events.ACCESS_PRIVATE
    "public" -> CalendarContract.Events.ACCESS_PUBLIC
    else -> CalendarContract.Events.ACCESS_DEFAULT
  }

internal fun calAccessStringMatchingConstant(constant: Int): String =
  when (constant) {
    CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR -> "contributor"
    CalendarContract.Calendars.CAL_ACCESS_EDITOR -> "editor"
    CalendarContract.Calendars.CAL_ACCESS_FREEBUSY -> "freebusy"
    CalendarContract.Calendars.CAL_ACCESS_OVERRIDE -> "override"
    CalendarContract.Calendars.CAL_ACCESS_OWNER -> "owner"
    CalendarContract.Calendars.CAL_ACCESS_READ -> "read"
    CalendarContract.Calendars.CAL_ACCESS_RESPOND -> "respond"
    CalendarContract.Calendars.CAL_ACCESS_ROOT -> "root"
    CalendarContract.Calendars.CAL_ACCESS_NONE -> "none"
    else -> "none"
  }

internal fun calAccessConstantMatchingString(string: String): Int =
  when (string) {
    "contributor" -> CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
    "editor" -> CalendarContract.Calendars.CAL_ACCESS_EDITOR
    "freebusy" -> CalendarContract.Calendars.CAL_ACCESS_FREEBUSY
    "override" -> CalendarContract.Calendars.CAL_ACCESS_OVERRIDE
    "owner" -> CalendarContract.Calendars.CAL_ACCESS_OWNER
    "read" -> CalendarContract.Calendars.CAL_ACCESS_READ
    "respond" -> CalendarContract.Calendars.CAL_ACCESS_RESPOND
    "root" -> CalendarContract.Calendars.CAL_ACCESS_ROOT
    else -> CalendarContract.Calendars.CAL_ACCESS_NONE
  }

internal fun attendeeRelationshipStringMatchingConstant(constant: Int): String =
  when (constant) {
    CalendarContract.Attendees.RELATIONSHIP_ATTENDEE -> "attendee"
    CalendarContract.Attendees.RELATIONSHIP_ORGANIZER -> "organizer"
    CalendarContract.Attendees.RELATIONSHIP_PERFORMER -> "performer"
    CalendarContract.Attendees.RELATIONSHIP_SPEAKER -> "speaker"
    CalendarContract.Attendees.RELATIONSHIP_NONE -> "none"
    else -> "none"
  }

internal fun attendeeRelationshipConstantMatchingString(string: String): Int =
  when (string) {
    "attendee" -> CalendarContract.Attendees.RELATIONSHIP_ATTENDEE
    "organizer" -> CalendarContract.Attendees.RELATIONSHIP_ORGANIZER
    "performer" -> CalendarContract.Attendees.RELATIONSHIP_PERFORMER
    "speaker" -> CalendarContract.Attendees.RELATIONSHIP_SPEAKER
    else -> CalendarContract.Attendees.RELATIONSHIP_NONE
  }

internal fun attendeeTypeStringMatchingConstant(constant: Int): String =
  when (constant) {
    CalendarContract.Attendees.TYPE_OPTIONAL -> "optional"
    CalendarContract.Attendees.TYPE_REQUIRED -> "required"
    CalendarContract.Attendees.TYPE_RESOURCE -> "resource"
    CalendarContract.Attendees.TYPE_NONE -> "none"
    else -> "none"
  }

internal fun attendeeTypeConstantMatchingString(string: String): Int =
  when (string) {
    "optional" -> CalendarContract.Attendees.TYPE_OPTIONAL
    "required" -> CalendarContract.Attendees.TYPE_REQUIRED
    "resource" -> CalendarContract.Attendees.TYPE_RESOURCE
    else -> CalendarContract.Attendees.TYPE_NONE
  }

internal fun calendarAllowedAttendeeTypesFromDBString(dbString: String): ArrayList<String> {
  val array = ArrayList<String>()
  for (constant in dbString.split(",").toTypedArray()) {
    try {
      array.add(attendeeTypeStringMatchingConstant(constant.toInt()))
    } catch (e: NumberFormatException) {
      Log.e(CalendarModule.TAG, "Couldn't convert attendee constant into an int.", e)
    }
  }
  return array
}

internal fun attendeeStatusStringMatchingConstant(constant: Int): String =
  when (constant) {
    CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED -> "accepted"
    CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED -> "declined"
    CalendarContract.Attendees.ATTENDEE_STATUS_INVITED -> "invited"
    CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE -> "tentative"
    CalendarContract.Attendees.ATTENDEE_STATUS_NONE -> "none"
    else -> "none"
  }

internal fun attendeeStatusConstantMatchingString(string: String): Int =
  when (string) {
    "accepted" -> CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED
    "declined" -> CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED
    "invited" -> CalendarContract.Attendees.ATTENDEE_STATUS_INVITED
    "tentative" -> CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE
    else -> CalendarContract.Attendees.ATTENDEE_STATUS_NONE
  }
