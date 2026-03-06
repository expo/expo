package expo.modules.ui.floatingactionbutton

import android.graphics.Color
import android.graphics.drawable.Drawable
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LargeFloatingActionButton
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.vector.ImageVector
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ExpoUIModule
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.compose
import expo.modules.ui.icon.Source
import expo.modules.ui.icon.VectorIconLoader
import expo.modules.ui.icon.rememberIconPainter
import expo.modules.ui.icon.resolveSourceUri

enum class FloatingActionButtonSize(val value: String) : Enumerable {
  SMALL("small"),
  MEDIUM("medium"),
  LARGE("large")
}

data class FloatingActionButtonProps(
  val icon: Source? = null,
  val label: String? = null,
  val expanded: Boolean = true,
  val size: FloatingActionButtonSize = FloatingActionButtonSize.MEDIUM,
  val containerColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.FloatingActionButtonContent(
  props: FloatingActionButtonProps,
  onPress: () -> Unit
) {
  val iconSource = props.icon
  val label = props.label
  val expanded = props.expanded
  val size = props.size
  val containerColor = props.containerColor?.compose ?: FloatingActionButtonDefaults.containerColor

  val module = appContext.registry.getModule<ExpoUIModule>()
  val iconLoader = remember(appContext) {
    module?.okHttpClient?.let {
      VectorIconLoader(context = appContext.reactContext!!, okHttpClient = it)
    }
  }

  var imageVector by remember { mutableStateOf<ImageVector?>(null) }
  var drawable by remember { mutableStateOf<Drawable?>(null) }

  LaunchedEffect(iconSource) {
    imageVector = null
    drawable = null
    if (iconSource != null && iconLoader != null) {
      val uriString = resolveSourceUri(appContext.reactContext!!, iconSource)
      if (uriString != null) {
        val result = iconLoader.loadFromUri(uriString)
        imageVector = result.imageVector
        drawable = result.drawable
      }
    }
  }

  val painter = rememberIconPainter(imageVector, drawable)

  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val iconComposable: @Composable () -> Unit = {
    if (painter != null) {
      Icon(painter = painter, contentDescription = null)
    }
  }

  if (label != null) {
    ExtendedFloatingActionButton(
      onClick = onPress,
      expanded = expanded,
      icon = iconComposable,
      text = { Text(label) },
      containerColor = containerColor,
      modifier = modifier
    )
  } else {
    when (size) {
      FloatingActionButtonSize.SMALL -> SmallFloatingActionButton(
        onClick = onPress,
        containerColor = containerColor,
        modifier = modifier,
        content = iconComposable
      )
      FloatingActionButtonSize.LARGE -> LargeFloatingActionButton(
        onClick = onPress,
        containerColor = containerColor,
        modifier = modifier,
        content = iconComposable
      )
      FloatingActionButtonSize.MEDIUM -> FloatingActionButton(
        onClick = onPress,
        containerColor = containerColor,
        modifier = modifier,
        content = iconComposable
      )
    }
  }
}
