package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

internal enum class ExpoLayoutDirection(val value: String) : Enumerable {
  LeftToRight("leftToRight"),
  RightToLeft("rightToLeft");

  fun toLayoutDirection(): LayoutDirection {
    return when (this) {
      LeftToRight -> LayoutDirection.Ltr
      RightToLeft -> LayoutDirection.Rtl
    }
  }
}

internal data class HostProps(
  val colorScheme: MutableState<ExpoColorScheme?> = mutableStateOf(null),
  val layoutDirection: MutableState<ExpoLayoutDirection> = mutableStateOf(ExpoLayoutDirection.LeftToRight),
  val useViewportSizeMeasurement: MutableState<Boolean> = mutableStateOf(false),
  val ignoreSafeAreaKeyboardInsets: MutableState<Boolean> = mutableStateOf(false),
  val matchContentsHorizontal: MutableState<Boolean?> = mutableStateOf(null),
  val matchContentsVertical: MutableState<Boolean?> = mutableStateOf(null)
) : ComposeProps

internal enum class ExpoColorScheme(val value: String) : Enumerable {
  LIGHT("light"),
  DARK("dark");

  fun toColorScheme(context: Context): ColorScheme {
    val isDynamicColorSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    return when (this) {
      LIGHT -> if (isDynamicColorSupported) dynamicLightColorScheme(context) else lightColorScheme()
      DARK -> if (isDynamicColorSupported) dynamicDarkColorScheme(context) else darkColorScheme()
    }
  }

  companion object {
    fun defaultColorScheme(context: Context, isSystemInDarkTheme: Boolean): ColorScheme {
      val isDynamicColorSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
      return if (isDynamicColorSupported) {
        if (isSystemInDarkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      } else {
        if (isSystemInDarkTheme) darkColorScheme() else lightColorScheme()
      }
    }
  }
}

@SuppressLint("ViewConstructor")
internal class HostView(context: Context, appContext: AppContext) :
  ExpoComposeView<HostProps>(context, appContext, withHostingView = true) {
  override val props = HostProps()
  private val onLayoutContent by EventDispatcher<LayoutContentEvent>()
  private var lastDispatchedContentSize: IntSize? = null

  @Composable
  override fun ComposableScope.Content() {
    val context = LocalContext.current
    val colorScheme = props.colorScheme.value?.toColorScheme(context)
      ?: ExpoColorScheme.defaultColorScheme(context, isSystemInDarkTheme())
    val layoutDirection = props.layoutDirection.value.toLayoutDirection()

    CompositionLocalProvider(LocalLayoutDirection provides layoutDirection) {
      MaterialTheme(colorScheme = colorScheme) {
        MaybeMatchContentsLayout {
          Children(this@Content)
        }
      }
    }
  }

  @Composable
  private fun MaybeMatchContentsLayout(content: @Composable () -> Unit) {
    val density = LocalDensity.current
    val configuration = LocalConfiguration.current
    val layoutDirection = LocalLayoutDirection.current

    val screenWidthPx = with(density) { configuration.screenWidthDp.dp.roundToPx() }
    val screenHeightPx = with(density) { configuration.screenHeightDp.dp.roundToPx() }

    val baseInsets = WindowInsets.systemBars.union(WindowInsets.displayCutout)
    val viewportInsets = if (props.ignoreSafeAreaKeyboardInsets.value) {
      baseInsets
    } else {
      baseInsets.union(WindowInsets.ime)
    }

    val safeWidthPx = (screenWidthPx - baseInsets.getLeft(density, layoutDirection) - baseInsets.getRight(density, layoutDirection))
      .coerceAtLeast(0)
    val safeHeightPx = (screenHeightPx - viewportInsets.getTop(density) - viewportInsets.getBottom(density))
      .coerceAtLeast(0)

    Layout(
      modifier = Modifier
        .then(if (props.matchContentsHorizontal.value == true) Modifier.wrapContentWidth() else Modifier)
        .then(if (props.matchContentsVertical.value == true) Modifier.wrapContentHeight() else Modifier)
        .onSizeChanged { size -> dispatchOnLayoutContent(size, density) },
      content = content
    ) { measurables, constraints ->
      val useViewportSizeMeasurement = props.useViewportSizeMeasurement.value

      // When matchContents is used, constraints may have infinite maxWidth/maxHeight.
      // Some components (like DatePicker, segmented buttons) use horizontal scrolling
      // internally and crash with infinite constraints. Bound infinite values to screen size.
      val boundedConstraints = Constraints(
        minWidth = constraints.minWidth,
        maxWidth = when {
          constraints.maxWidth == Constraints.Infinity -> safeWidthPx
          useViewportSizeMeasurement && constraints.maxWidth == 0 -> safeWidthPx
          else -> constraints.maxWidth
        },
        minHeight = constraints.minHeight,
        maxHeight = when {
          constraints.maxHeight == Constraints.Infinity -> safeHeightPx
          useViewportSizeMeasurement && constraints.maxHeight == 0 -> safeHeightPx
          else -> constraints.maxHeight
        }
      )
      val placeables = measurables.map { it.measure(boundedConstraints) }

      val contentWidthPx = placeables.maxOfOrNull { it.width } ?: 0
      val contentHeightPx = placeables.maxOfOrNull { it.height } ?: 0

      if (useViewportSizeMeasurement && (constraints.maxWidth == 0 || constraints.maxHeight == 0)) {
        with(density) {
          val widthDp = contentWidthPx.toDp().value.toDouble()
          val heightDp = contentHeightPx.toDp().value.toDouble()

          shadowNodeProxy.setViewSize(
            if (constraints.maxWidth == 0) widthDp else Double.NaN,
            if (constraints.maxHeight == 0) heightDp else Double.NaN
          )
        }
      }

      layout(contentWidthPx, contentHeightPx) {
        placeables.forEach { child ->
          child.placeRelative(0, 0)
        }
      }
    }
  }

  private fun dispatchOnLayoutContent(size: IntSize, density: Density) {
    if (lastDispatchedContentSize == size) {
      return
    }
    lastDispatchedContentSize = size

    val matchContentsHorizontal = this.props.matchContentsHorizontal.value
    val matchContentsVertical = this.props.matchContentsVertical.value

    with(density) {
      val width = size.width.toDp().value
      val height = size.height.toDp().value

      if (matchContentsHorizontal == true || matchContentsVertical == true) {
        val styleWidth = if (matchContentsHorizontal == true && width > 0) width else null
        val styleHeight = if (matchContentsVertical == true && height > 0) height else null
        shadowNodeProxy.setStyleSize(styleWidth?.toDouble(), styleHeight?.toDouble())
      }

      onLayoutContent(LayoutContentEvent(width.toDouble(), height.toDouble()))
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val matchContentsHorizontal = props.matchContentsHorizontal.value
    val matchContentsVertical = props.matchContentsVertical.value

    // Measure with UNSPECIFIED to get intrinsic size for matchContents
    if (matchContentsHorizontal == true || matchContentsVertical == true) {
      val widthSpec = if (matchContentsHorizontal == true) {
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      } else {
        widthMeasureSpec
      }
      val heightSpec = if (matchContentsVertical == true) {
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      } else {
        heightMeasureSpec
      }
      super.onMeasure(widthSpec, heightSpec)
    } else {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }
  }

  internal fun onViewDidUpdateProps() {
    val matchContentsHorizontal = props.matchContentsHorizontal.value
    val matchContentsVertical = props.matchContentsVertical.value
    val composeView = findComposeView()
    composeView.layoutParams = LayoutParams(
      if (matchContentsHorizontal == true) LayoutParams.WRAP_CONTENT else LayoutParams.MATCH_PARENT,
      if (matchContentsVertical == true) LayoutParams.WRAP_CONTENT else LayoutParams.MATCH_PARENT
    )
  }

  private fun findComposeView(): ComposeView {
    for (i in childCount - 1 downTo 0) {
      val child = getChildAt(i) as? ComposeView
      if (child != null) {
        return child
      }
    }
    throw IllegalStateException("No ComposeView found in HostView")
  }
}

internal data class LayoutContentEvent(
  @Field
  val width: Double?,

  @Field
  val height: Double?
) : Record
