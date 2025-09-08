package expo.modules.calendar.dialogs

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class ViewedEventOptions(@Field val id: String = "", @Field val startNewActivityTask: Boolean = true)
  : Record, Serializable
