package expo.modules.sqlite

import android.content.Context
import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule

class SQLitePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SQLiteModule(context))
  }
}
