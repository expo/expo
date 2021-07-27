package expo.modules.calendar

import android.content.Context
import expo.modules.core.BasePackage

class CalendarPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(CalendarModule(context))
}
