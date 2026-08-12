package expo.modules.ui.icon

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Drawable
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.ExpoUIModule
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.compose
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.graphics.ImageSource
import expo.modules.ui.graphics.rememberDrawablePainter
import expo.modules.ui.graphics.resolveUri

@OptimizedComposeProps
data class IconProps(
  val source: MutableState<ImageSource?> = mutableStateOf(null),
  val tint: MutableState<Color?> = mutableStateOf(null),
  val inheritTint: MutableState<Boolean> = mutableStateOf(true),
  val size: MutableState<Int?> = mutableStateOf(null),
  val contentDescription: MutableState<String?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

class IconView(context: Context, appContext: AppContext) :
  ExpoComposeView<IconProps>(context, appContext) {

  override val props = IconProps()

  private val iconLoader by lazy {
    val module = appContext.registry.getModule<ExpoUIModule>()
    requireNotNull(module?.imageLoader) { "ExpoUIModule.imageLoader is not initialized" }
  }

  @Composable
  override fun ComposableScope.Content() {
    val (source) = props.source
    val (tint) = props.tint
    val (inheritTint) = props.inheritTint
    val (iconSize) = props.size
    val (contentDescription) = props.contentDescription
    val (modifiers) = props.modifiers

    var imageVector by remember { mutableStateOf<ImageVector?>(null) }
    var drawable by remember { mutableStateOf<Drawable?>(null) }

    // Load icon from URI asynchronously
    LaunchedEffect(source) {
      imageVector = null
      drawable = null

      val uriString = source?.resolveUri(context)
      if (uriString != null) {
        // loadFromUri is already a suspend function that handles dispatchers
        val result = iconLoader.loadFromUri(uriString)
        imageVector = result.imageVector
        drawable = result.drawable
      }
    }

    // Convert to Painter (prioritize ImageVector over Drawable)
    val painter = imageVector?.let { rememberVectorPainter(it) }
      ?: rememberDrawablePainter(drawable)

    // Render icon if painter available
    if (painter != null) {
      val resolvedTint = tint?.compose
        ?: if (inheritTint) LocalContentColor.current else androidx.compose.ui.graphics.Color.Unspecified
      Icon(
        painter = painter,
        contentDescription = contentDescription,
        tint = resolvedTint,
        modifier = Modifier
          .then(iconSize?.let { Modifier.size(it.dp) } ?: Modifier)
          .then(ModifierRegistry.applyModifiers(modifiers, appContext, this@Content, globalEventDispatcher))
      )
    }
  }
}
