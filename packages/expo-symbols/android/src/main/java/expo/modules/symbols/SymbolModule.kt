package expo.modules.symbols

import android.graphics.Color
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SymbolModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExpoSymbols")

    View(SymbolView::class) {
      Prop("name") { view, name: String ->
        view.name.value = name
      }

      Prop("tintColor") { view, color: Color? ->
        @RequiresApi(Build.VERSION_CODES.O)
        view.tint.value = androidx.compose.ui.graphics.Color(color?.toArgb() ?: Color.WHITE)
      }
    }
  }
}
