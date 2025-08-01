package expo.modules.calendar

import android.content.ContentResolver
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CustomExpoCalendar(private val id: String) {
    private val contentResolver: ContentResolver
        get() = (appContext.reactContext ?: throw Exceptions.ReactContextLost()).contentResolver

    fun listEventsAsIds(): List<String> {
        val uri = CalendarContract.Events.CONTENT_URI
        val selection = "${CalendarContract.Events.CALENDAR_ID} = ?"
        val selectionArgs = arrayOf(id)
        
        val cursor = contentResolver.query(uri, arrayOf(CalendarContract.Events._ID), selection, selectionArgs, null)
        return cursor?.use { 
            val eventIds = mutableListOf<String>()
            while (it.moveToNext()) {
                val eventId = it.getString(0)
                eventIds.add(eventId)
            }
            eventIds
        } ?: emptyList()
    }

    fun listEvents(): List<String> {
        return listEventsAsIds()
    }
} 
