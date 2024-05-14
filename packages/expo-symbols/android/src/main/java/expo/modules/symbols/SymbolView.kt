package expo.modules.symbols

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

@SuppressLint("ViewConstructor")
class SymbolView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext) {
  var name = mutableStateOf("filled.add")
  var tint = mutableStateOf(Color.White)

  init {
    addView(
      ComposeView(context).apply {
        setContent {
          Symbol(
            modifier = Modifier.fillMaxSize(),
            icon = name.value,
            tint = tint.value
          )
        }
      }
    )
  }
}

@Composable
fun Symbol(modifier: Modifier = Modifier, icon: String, tint: Color) {
  val split = icon.split(".")
  if (split.size != 2) {
    return
  }
  val type = split[0]
  val name = split[1]
  val vector = getSymbolVector(type, name) ?: return

  Icon(
    vector,
    contentDescription = name,
    modifier = modifier,
    tint = tint
  )
}

fun getSymbolVector(type: String, name: String): ImageVector? {
  try {
    val clazz = Class.forName("androidx.compose.material.icons.$type.${name}Kt")
    return clazz.declaredMethods[0].invoke(clazz::class, null) as ImageVector
  } catch (e: Exception) {
    return null
  }
}
