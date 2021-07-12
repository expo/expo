package expo.modules.calendar

import android.content.Context
import org.unimodules.core.BasePackage

class CalendarPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(CalendarModule(context))
}
