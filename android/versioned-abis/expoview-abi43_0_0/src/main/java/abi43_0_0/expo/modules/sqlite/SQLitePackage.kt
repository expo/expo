package abi43_0_0.expo.modules.sqlite

import android.content.Context
import abi43_0_0.expo.modules.core.BasePackage
import abi43_0_0.expo.modules.core.ExportedModule

class SQLitePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SQLiteModule(context))
  }
}
