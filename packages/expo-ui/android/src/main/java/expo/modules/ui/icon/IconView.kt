package expo.modules.ui.icon

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.Drawable
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.ExpoUIModule
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.compose

data class Source(
  @Field val uri: String,
  @Field val width: Int = 0,
  @Field val height: Int = 0,
  @Field val scale: Double = 1.0
) : Record

data class IconProps(
  val source: MutableState<Source?> = mutableStateOf(null),
  val tintColor: MutableState<Color?> = mutableStateOf(null),
  val size: MutableState<Int?> = mutableStateOf(null),
  val contentDescription: MutableState<String?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

class IconView(context: Context, appContext: AppContext) :
  ExpoComposeView<IconProps>(context, appContext) {

  override val props = IconProps()

  private val iconLoader by lazy {
    val module = appContext.registry.getModule<ExpoUIModule>()
    val okHttpClient = requireNotNull(module?.okHttpClient) { "ExpoUIModule.okHttpClient is not initialized" }
    VectorIconLoader(
      context = context,
      okHttpClient = okHttpClient
    )
  }

  @Composable
  override fun ComposableScope.Content() {
    val (source) = props.source
    val (tint) = props.tintColor
    val (iconSize) = props.size
    val (contentDescription) = props.contentDescription
    val (modifiers) = props.modifiers

    var imageVector by remember { mutableStateOf<ImageVector?>(null) }
    var drawable by remember { mutableStateOf<Drawable?>(null) }

    // Load icon from URI asynchronously
    LaunchedEffect(source) {
      imageVector = null
      drawable = null

      val uriString = source?.let { resolveSourceUri(context, it) }
      if (uriString != null) {
        // loadFromUri is already a suspend function that handles dispatchers
        val result = iconLoader.loadFromUri(uriString)
        imageVector = result.imageVector
        drawable = result.drawable
      }
    }

    // Convert to Painter (prioritize ImageVector over Drawable)
    val painter = rememberIconPainter(imageVector, drawable)

    // Render icon if painter available
    if (painter != null) {
      Icon(
        painter = painter,
        contentDescription = contentDescription,
        tint = tint?.compose ?: androidx.compose.ui.graphics.Color.Unspecified,
        modifier = Modifier
          .then(iconSize?.let { Modifier.size(it.dp) } ?: Modifier)
          .then(ModifierRegistry.applyModifiers(modifiers, appContext, this@Content, globalEventDispatcher))
      )
    }
  }
}
