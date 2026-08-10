package expo.modules.widgets

import android.content.Context
import android.graphics.Color as AndroidColor
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.recordFromMap
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.types.ConverterContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.kotlin.views.createComposeProps
import expo.modules.ui.BackgroundParams
import expo.modules.ui.CheckboxProps
import expo.modules.ui.CircularProgressIndicatorProps
import expo.modules.ui.FillMaxHeightParams
import expo.modules.ui.FillMaxSizeParams
import expo.modules.ui.FillMaxWidthParams
import expo.modules.ui.HeightParams
import expo.modules.ui.LayoutProps
import expo.modules.ui.LinearProgressIndicatorProps
import expo.modules.ui.LoadingIndicatorProps
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierType
import expo.modules.ui.PaddingAllParams
import expo.modules.ui.PaddingParams
import expo.modules.ui.RadioButtonProps
import expo.modules.ui.SizeParams
import expo.modules.ui.SpacerProps
import expo.modules.ui.SwitchProps
import expo.modules.ui.TextAlignType
import expo.modules.ui.TextDecorationType
import expo.modules.ui.TextFontStyle
import expo.modules.ui.TextFontWeight
import expo.modules.ui.TextProps
import expo.modules.ui.TextSpanRecord
import expo.modules.ui.TypographyStyle
import expo.modules.ui.WidthParams
import expo.modules.ui.WrapContentHeightParams
import expo.modules.ui.WrapContentWidthParams
import expo.modules.ui.button.ButtonColors
import expo.modules.ui.button.ContentPaddingRecord
import expo.modules.ui.colorToComposeColorOrNull
import expo.modules.ui.convertibles.ContentAlignment
import expo.modules.ui.convertibles.HorizontalAlignment
import expo.modules.ui.convertibles.HorizontalArrangementDefault
import expo.modules.ui.convertibles.VerticalAlignment
import expo.modules.ui.convertibles.VerticalArrangementDefault
import androidx.compose.ui.graphics.Color
import androidx.glance.Emittable
import androidx.glance.EmittableButton
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.CheckboxDefaults
import androidx.glance.appwidget.EmittableCheckBox
import androidx.glance.appwidget.EmittableCircularProgressIndicator
import androidx.glance.appwidget.EmittableLinearProgressIndicator
import androidx.glance.appwidget.EmittableRadioButton
import androidx.glance.appwidget.EmittableSwitch
import androidx.glance.appwidget.ProgressIndicatorDefaults
import androidx.glance.appwidget.RadioButtonDefaults
import androidx.glance.appwidget.SwitchDefaults
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.EmittableBox
import androidx.glance.layout.EmittableColumn
import androidx.glance.layout.EmittableRow
import androidx.glance.layout.EmittableSpacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.layout.wrapContentHeight
import androidx.glance.layout.wrapContentWidth
import androidx.glance.text.EmittableText
import androidx.glance.text.FontStyle
import androidx.glance.text.FontWeight
import androidx.glance.text.TextAlign
import androidx.glance.text.TextDecoration
import androidx.glance.text.TextDefaults
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.glance.appwidget.lazy.EmittableLazyColumn
import androidx.glance.appwidget.lazy.EmittableLazyListItem
import androidx.glance.appwidget.lazy.ReservedItemIdRangeEnd
import io.github.jakex7.peek.glance.determinateCircularProgressIndicatorEmittable

private val DefaultCheckedColor = ColorProvider(Color(0xff6750a4))
private val DefaultUncheckedColor = ColorProvider(Color(0xff79747e))
private val DefaultCheckedTrackColor = ColorProvider(Color(0xffe8def8))
private val DefaultUncheckedTrackColor = ColorProvider(Color(0xffe7e0ec))

private class WidgetConverterContext(
  override val applicationContext: Context
) : ConverterContext {
  override val runtime: Runtime? = null
}

internal fun ReadableMap.toPeekRoot(context: Context, source: String): Emittable {
  val converterContext = WidgetConverterContext(context)
  return EmittableColumn().also { root ->
    root.children += toPeekNodes(converterContext, source)
  }
}

internal fun createErrorRoot(message: String): Emittable = createErrorText(message)

private fun createErrorText(message: String): EmittableText {
  return EmittableText().also {
    it.text = message
    it.modifier = GlanceModifier.padding(8.dp)
  }
}

private fun ReadableMap.toPeekNodes(converterContext: ConverterContext, source: String): List<Emittable> {
  return when (typeName()) {
    "BoxView" -> listOf(toPeekBox(converterContext, source))
    "CheckboxView" -> listOf(toPeekCheckBox(converterContext))
    "CircularProgressIndicatorView" -> listOf(toPeekCircularProgress(converterContext))
    "ColumnView" -> listOf(toPeekColumn(converterContext, source))
    "LazyColumnView" -> listOf(toPeekLazyColumn(converterContext, source))
    "LinearProgressIndicatorView" -> listOf(toPeekLinearProgress(converterContext))
    "LoadingIndicatorView" -> listOf(toPeekLoadingIndicator(converterContext))
    "RadioButtonView" -> listOf(toPeekRadioButton(converterContext))
    "react.fragment" -> children().flatMap { it.toPeekNodes(converterContext, source) }
    "RowView" -> listOf(toPeekRow(converterContext, source))
    "SpacerView" -> listOf(toPeekSpacer(converterContext))
    "SwitchView" -> listOf(toPeekSwitch(converterContext))
    "TextView" -> listOf(toPeekText(converterContext))
    "Button", "FilledTonalButton", "OutlinedButton", "ElevatedButton", "TextButton" -> listOf(
      toPeekButton(converterContext, source)
    )

    else -> listOf(createErrorText("View not found"))
  }
}

private fun ReadableMap.toPeekBox(converterContext: ConverterContext, source: String): EmittableBox {
  val props = props<LayoutProps>(converterContext)
  return EmittableBox().also {
    it.modifier = props.modifiers.toPeekModifier(converterContext)
    it.contentAlignment = props.contentAlignment?.toGlanceAlignment() ?: Alignment.TopStart
    it.children += children().flatMap { child -> child.toPeekNodes(converterContext, source) }
  }
}

private fun ReadableMap.toPeekRow(converterContext: ConverterContext, source: String): EmittableRow {
  val props = props<LayoutProps>(converterContext)
  return EmittableRow().also {
    it.modifier = props.modifiers.toPeekModifier(converterContext)
    it.horizontalAlignment = props.toPeekHorizontalAlignment()
    it.verticalAlignment = props.toPeekVerticalAlignment()
    it.children += children().flatMap { child -> child.toPeekNodes(converterContext, source) }
  }
}

private fun ReadableMap.toPeekColumn(converterContext: ConverterContext, source: String): EmittableColumn {
  val props = props<LayoutProps>(converterContext)
  return EmittableColumn().also {
    it.modifier = props.modifiers.toPeekModifier(converterContext)
    it.verticalAlignment = props.toPeekVerticalAlignment()
    it.horizontalAlignment = props.toPeekHorizontalAlignment()
    it.children += children().flatMap { child -> child.toPeekNodes(converterContext, source) }
  }
}

private fun ReadableMap.toPeekLazyColumn(converterContext: ConverterContext, source: String): EmittableLazyColumn {
  val props = props<LayoutProps>(converterContext)
  val alignment = props.toPeekHorizontalAlignment()
  return EmittableLazyColumn().also { lazyColumn ->
    lazyColumn.modifier = props.modifiers.toPeekModifier(converterContext)
    lazyColumn.horizontalAlignment = alignment
    children()
      .flatMap { child -> child.toPeekNodes(converterContext, source) }
      .forEachIndexed { index, child ->
        lazyColumn.children += EmittableLazyListItem().also { item ->
          item.itemId = ReservedItemIdRangeEnd - index
          item.alignment = Alignment(alignment, Alignment.Vertical.CenterVertically)
          item.children += child
        }
      }
  }
}

private fun ReadableMap.toPeekSpacer(converterContext: ConverterContext): EmittableSpacer {
  return EmittableSpacer().also {
    it.modifier = props<SpacerProps>(converterContext).modifiers.toPeekModifier(converterContext)
  }
}

private fun ReadableMap.toPeekText(converterContext: ConverterContext): EmittableText {
  val props = props<TextProps>(converterContext)
  val typography = props.typography?.toGlanceTypography()
  return EmittableText().also {
    it.text = props.textContent()
    it.modifier = props.textModifier(converterContext)
    it.style = TextStyle(
      color = props.color.toGlanceColorProvider() ?: typography?.color ?: TextDefaults.defaultTextColor,
      fontSize = props.fontSize?.sp ?: typography?.fontSize,
      fontWeight = props.fontWeight?.toGlanceFontWeight() ?: typography?.fontWeight,
      fontStyle = props.fontStyle?.toGlanceFontStyle(),
      textAlign = props.textAlign?.toGlanceTextAlign(),
      textDecoration = props.textDecoration?.toGlanceTextDecoration()
    )
    it.maxLines = props.maxLines ?: Int.MAX_VALUE
  }
}

private fun ReadableMap.toPeekButton(converterContext: ConverterContext, source: String): Emittable {
  val props = props<WidgetButtonProps>(converterContext)
  val children = children()
  val action =
    props.target?.let { target -> WidgetInteraction(source, target).toGlanceAction(converterContext.applicationContext) }
  val modifier = props.buttonModifier(converterContext)
  val contentColor = props.contentColorProvider()
  val textContent = children.textContent(converterContext) ?: props.label
  if (textContent != null && (children.isEmpty() || children.isTextOnlyContent())) {
    return EmittableButton().also {
      it.text = textContent
      it.modifier = if (props.enabled && action != null) modifier.clickable(action) else modifier
      it.enabled = props.enabled
      it.style = TextStyle(color = contentColor ?: TextDefaults.defaultTextColor)
    }
  }

  return EmittableBox().also {
    it.modifier = if (props.enabled && action != null) {
      modifier.clickable(action)
    } else {
      modifier
    }
    it.contentAlignment = Alignment.Center
    it.children += children.flatMap { child -> child.toPeekNodes(converterContext, source) }
  }
}

private fun ReadableMap.toPeekCheckBox(converterContext: ConverterContext): EmittableCheckBox {
  val props = props<CheckboxProps>(converterContext)
  val checked = props.colors.checkedColor.toGlanceColorProvider() ?: DefaultCheckedColor
  val unchecked = props.colors.uncheckedColor.toGlanceColorProvider() ?: DefaultUncheckedColor
  return EmittableCheckBox(CheckboxDefaults.checkBoxColors(checked, unchecked)).also {
    it.checked = props.value
    it.modifier = props.modifiers.toPeekModifier(converterContext)
  }
}

private fun ReadableMap.toPeekSwitch(converterContext: ConverterContext): EmittableSwitch {
  val props = props<SwitchProps>(converterContext)
  val colors = SwitchDefaults.switchColors(
    checkedThumbColor = props.colors.checkedThumbColor.toGlanceColorProvider() ?: DefaultCheckedColor,
    uncheckedThumbColor = props.colors.uncheckedThumbColor.toGlanceColorProvider() ?: DefaultUncheckedColor,
    checkedTrackColor = props.colors.checkedTrackColor.toGlanceColorProvider() ?: DefaultCheckedTrackColor,
    uncheckedTrackColor = props.colors.uncheckedTrackColor.toGlanceColorProvider() ?: DefaultUncheckedTrackColor
  )
  return EmittableSwitch(colors).also {
    it.checked = props.value
    it.modifier = props.modifiers.toPeekModifier(converterContext)
  }
}

private fun ReadableMap.toPeekRadioButton(converterContext: ConverterContext): EmittableRadioButton {
  val props = props<RadioButtonProps>(converterContext)
  return EmittableRadioButton(
    RadioButtonDefaults.colors(DefaultCheckedColor, DefaultUncheckedColor)
  ).also {
    it.checked = props.selected
    it.enabled = props.clickable
    it.modifier = props.modifiers.toPeekModifier(converterContext)
  }
}

private fun ReadableMap.toPeekLinearProgress(converterContext: ConverterContext): EmittableLinearProgressIndicator {
  val props = props<LinearProgressIndicatorProps>(converterContext)
  return EmittableLinearProgressIndicator().also {
    it.progress = props.progress ?: 0f
    it.indeterminate = props.progress == null
    it.modifier = props.modifiers.toPeekModifier(converterContext)
    it.color = props.color.toGlanceColorProvider() ?: it.color
    it.backgroundColor = props.trackColor.toGlanceColorProvider() ?: it.backgroundColor
  }
}

private fun ReadableMap.toPeekCircularProgress(converterContext: ConverterContext): Emittable {
  val props = props<CircularProgressIndicatorProps>(converterContext)
  val progress = props.progress
  if (progress == null) {
    return EmittableCircularProgressIndicator().also {
      it.modifier = props.modifiers.toPeekModifier(converterContext)
      it.color = props.color.toGlanceColorProvider() ?: it.color
    }
  }
  return determinateCircularProgressIndicatorEmittable(
    progress = progress,
    modifier = props.modifiers.toPeekModifier(converterContext),
    color = props.color.toGlanceColorProvider() ?: ProgressIndicatorDefaults.IndicatorColorProvider,
    trackColor = props.trackColor.toGlanceColorProvider() ?: ProgressIndicatorDefaults.BackgroundColorProvider
  )
}

private fun ReadableMap.toPeekLoadingIndicator(converterContext: ConverterContext): EmittableCircularProgressIndicator {
  val props = props<LoadingIndicatorProps>(converterContext)
  return EmittableCircularProgressIndicator().also {
    it.modifier = props.modifiers.toPeekModifier(converterContext)
    it.color = props.color.toGlanceColorProvider() ?: it.color
  }
}

private fun ModifierList.toPeekModifier(converterContext: ConverterContext): GlanceModifier {
  var result: GlanceModifier = GlanceModifier
  for (config in this) {
    result = result.then(config.toPeekModifier(converterContext))
  }
  return result
}

private fun ModifierType.toPeekModifier(converterContext: ConverterContext): GlanceModifier {
  return when (this["\$type"]?.asString()) {
    "paddingAll" -> asRecord<PaddingAllParams>(converterContext)?.let { GlanceModifier.padding(it.all.dp) }
    "padding" -> asRecord<PaddingParams>(converterContext)?.let {
      GlanceModifier.padding(
        start = it.start.dp, top = it.top.dp, end = it.end.dp, bottom = it.bottom.dp
      )
    }

    "size" -> asRecord<SizeParams>(converterContext)?.let { GlanceModifier.size(it.width.dp, it.height.dp) }
    "width" -> asRecord<WidthParams>(converterContext)?.let { GlanceModifier.width(it.width.dp) }
    "height" -> asRecord<HeightParams>(converterContext)?.let { GlanceModifier.height(it.height.dp) }
    "wrapContentWidth" -> asRecord<WrapContentWidthParams>(converterContext)?.let { GlanceModifier.wrapContentWidth() }
    "wrapContentHeight" -> asRecord<WrapContentHeightParams>(converterContext)?.let { GlanceModifier.wrapContentHeight() }
    "fillMaxSize" -> asRecord<FillMaxSizeParams>(converterContext)?.let { GlanceModifier.fillMaxSize() }
    "fillMaxWidth" -> asRecord<FillMaxWidthParams>(converterContext)?.let { GlanceModifier.fillMaxWidth() }
    "fillMaxHeight" -> asRecord<FillMaxHeightParams>(converterContext)?.let { GlanceModifier.fillMaxHeight() }
    "background" -> asRecord<BackgroundParams>(converterContext)?.color?.toGlanceColorProvider()
      ?.let { GlanceModifier.background(it) }
    // Unsupported Expo UI modifiers are ignored until they have exact Glance semantics.
    else -> null
  } ?: GlanceModifier
}

private inline fun <reified T : Record> ModifierType.asRecord(converterContext: ConverterContext): T? {
  return runCatching { recordFromMap<T>(this, converterContext) }.getOrNull()
}

private fun TextProps.textModifier(converterContext: ConverterContext): GlanceModifier {
  var modifier = modifiers.toPeekModifier(converterContext)
  background.toGlanceColorProvider()?.let {
    modifier = modifier.background(it)
  }
  return modifier
}

private fun WidgetButtonProps.buttonModifier(converterContext: ConverterContext): GlanceModifier {
  var modifier = modifiers.toPeekModifier(converterContext)
  val color = if (enabled) {
    colors.containerColor
  } else {
    colors.disabledContainerColor ?: colors.containerColor
  }
  color.toGlanceColorProvider()?.let {
    modifier = modifier.background(it)
  }
  contentPadding?.let {
    modifier = modifier.then(it.toPeekModifier())
  }
  return modifier
}

private fun WidgetButtonProps.contentColorProvider(): ColorProvider? {
  val color = if (enabled) {
    colors.contentColor
  } else {
    colors.disabledContentColor ?: colors.contentColor
  }
  return color.toGlanceColorProvider()
}

private fun ContentPaddingRecord.toPeekModifier(): GlanceModifier {
  return GlanceModifier.padding(
    start = (start ?: 0.0).toFloat().dp,
    top = (top ?: 0.0).toFloat().dp,
    end = (end ?: 0.0).toFloat().dp,
    bottom = (bottom ?: 0.0).toFloat().dp
  )
}

private fun AndroidColor?.toGlanceColorProvider(): ColorProvider? {
  return colorToComposeColorOrNull(this)?.let(::ColorProvider)
}

private fun LayoutProps.toPeekHorizontalAlignment(): Alignment.Horizontal {
  horizontalAlignment?.let {
    return it.toGlanceHorizontalAlignment()
  }

  val arrangement = horizontalArrangement
  return if (arrangement?.`is`(HorizontalArrangementDefault::class) == true) {
    when (arrangement.first()) {
      HorizontalArrangementDefault.START -> Alignment.Start
      HorizontalArrangementDefault.CENTER -> Alignment.CenterHorizontally
      HorizontalArrangementDefault.END -> Alignment.End
      else -> Alignment.Start
    }
  } else {
    Alignment.Start
  }
}

private fun LayoutProps.toPeekVerticalAlignment(): Alignment.Vertical {
  verticalAlignment?.let {
    return it.toGlanceVerticalAlignment()
  }

  val arrangement = verticalArrangement
  return if (arrangement?.`is`(VerticalArrangementDefault::class) == true) {
    when (arrangement.first()) {
      VerticalArrangementDefault.TOP -> Alignment.Top
      VerticalArrangementDefault.CENTER -> Alignment.CenterVertically
      VerticalArrangementDefault.BOTTOM -> Alignment.Bottom
      else -> Alignment.Top
    }
  } else {
    Alignment.Top
  }
}

private fun ContentAlignment.toGlanceAlignment(): Alignment {
  return when (this) {
    ContentAlignment.TOP_START -> Alignment.TopStart
    ContentAlignment.TOP_CENTER -> Alignment.TopCenter
    ContentAlignment.TOP_END -> Alignment.TopEnd
    ContentAlignment.CENTER_START -> Alignment.CenterStart
    ContentAlignment.CENTER -> Alignment.Center
    ContentAlignment.CENTER_END -> Alignment.CenterEnd
    ContentAlignment.BOTTOM_START -> Alignment.BottomStart
    ContentAlignment.BOTTOM_CENTER -> Alignment.BottomCenter
    ContentAlignment.BOTTOM_END -> Alignment.BottomEnd
  }
}

private fun HorizontalAlignment.toGlanceHorizontalAlignment(): Alignment.Horizontal {
  return when (this) {
    HorizontalAlignment.START -> Alignment.Start
    HorizontalAlignment.CENTER -> Alignment.CenterHorizontally
    HorizontalAlignment.END -> Alignment.End
  }
}

private fun VerticalAlignment.toGlanceVerticalAlignment(): Alignment.Vertical {
  return when (this) {
    VerticalAlignment.TOP -> Alignment.Top
    VerticalAlignment.CENTER -> Alignment.CenterVertically
    VerticalAlignment.BOTTOM -> Alignment.Bottom
  }
}

private fun TextFontWeight.toGlanceFontWeight(): FontWeight {
  return when (this) {
    TextFontWeight.BOLD, TextFontWeight.W700, TextFontWeight.W800, TextFontWeight.W900 -> FontWeight.Bold
    TextFontWeight.NORMAL, TextFontWeight.W100, TextFontWeight.W200, TextFontWeight.W300, TextFontWeight.W400, TextFontWeight.W500, TextFontWeight.W600 -> FontWeight.Normal
  }
}

private fun TextFontStyle.toGlanceFontStyle(): FontStyle {
  return when (this) {
    TextFontStyle.NORMAL -> FontStyle.Normal
    TextFontStyle.ITALIC -> FontStyle.Italic
  }
}

private fun TextAlignType.toGlanceTextAlign(): TextAlign {
  return when (this) {
    TextAlignType.LEFT -> TextAlign.Left
    TextAlignType.RIGHT -> TextAlign.Right
    TextAlignType.CENTER -> TextAlign.Center
    TextAlignType.JUSTIFY, TextAlignType.START -> TextAlign.Start

    TextAlignType.END -> TextAlign.End
  }
}

private fun TextDecorationType.toGlanceTextDecoration(): TextDecoration {
  return when (this) {
    TextDecorationType.NONE -> TextDecoration.None
    TextDecorationType.UNDERLINE -> TextDecoration.Underline
    TextDecorationType.LINE_THROUGH -> TextDecoration.LineThrough
  }
}

private data class GlanceTypography(
  val fontSize: TextUnit,
  val fontWeight: FontWeight? = null,
  val color: ColorProvider? = null
)

private fun TypographyStyle.toGlanceTypography(): GlanceTypography {
  return when (this) {
    TypographyStyle.DISPLAY_LARGE -> GlanceTypography(fontSize = 57.sp)
    TypographyStyle.DISPLAY_MEDIUM -> GlanceTypography(fontSize = 45.sp)
    TypographyStyle.DISPLAY_SMALL -> GlanceTypography(fontSize = 36.sp)
    TypographyStyle.HEADLINE_LARGE -> GlanceTypography(fontSize = 32.sp)
    TypographyStyle.HEADLINE_MEDIUM -> GlanceTypography(fontSize = 28.sp)
    TypographyStyle.HEADLINE_SMALL -> GlanceTypography(fontSize = 24.sp)
    TypographyStyle.TITLE_LARGE -> GlanceTypography(fontSize = 22.sp)
    TypographyStyle.TITLE_MEDIUM -> GlanceTypography(fontSize = 16.sp)
    TypographyStyle.TITLE_SMALL -> GlanceTypography(fontSize = 14.sp)
    TypographyStyle.BODY_LARGE -> GlanceTypography(fontSize = 16.sp)
    TypographyStyle.BODY_MEDIUM -> GlanceTypography(fontSize = 14.sp)
    TypographyStyle.BODY_SMALL -> GlanceTypography(fontSize = 12.sp)
    TypographyStyle.LABEL_LARGE -> GlanceTypography(fontSize = 14.sp)
    TypographyStyle.LABEL_MEDIUM -> GlanceTypography(fontSize = 12.sp)
    TypographyStyle.LABEL_SMALL -> GlanceTypography(fontSize = 11.sp)
  }
}

private inline fun <reified Props : ComposeProps> ReadableMap.props(converterContext: ConverterContext): Props {
  return createComposeProps(propsMap(), converterContext)
}

private fun TextProps.textContent(): String {
  return spans?.joinToString(separator = "") { it.textContent() } ?: text
}

private fun TextSpanRecord.textContent(): String {
  return children?.joinToString(separator = "") { it.textContent() } ?: text
}

private fun ReadableMap.typeName(): String? {
  return if (hasKey("type")) getString("type") else null
}

private fun ReadableMap.propsMap(): ReadableMap? {
  return if (hasKey("props") && !isNull("props")) {
    getMap("props")
  } else {
    null
  }
}

private fun ReadableMap.children(): List<ReadableMap> {
  val props = propsMap() ?: return emptyList()
  if (!props.hasKey("children") || props.isNull("children")) {
    return emptyList()
  }

  return when (props.getType("children")) {
    ReadableType.Map -> listOfNotNull(props.getMap("children"))
    ReadableType.Array -> props.getArray("children")?.children() ?: emptyList()
    else -> emptyList()
  }
}

private fun ReadableArray.children(): List<ReadableMap> {
  return buildList {
    for (index in 0 until size()) {
      when (getType(index)) {
        ReadableType.Map -> getMap(index)?.let(::add)
        ReadableType.Array -> getArray(index)?.let { addAll(it.children()) }
        else -> Unit
      }
    }
  }
}

private fun List<ReadableMap>.isTextOnlyContent(): Boolean {
  return isNotEmpty() && all { it.isTextOnlyContent() }
}

private fun ReadableMap.isTextOnlyContent(): Boolean {
  return when (typeName()) {
    "TextView" -> true
    "react.fragment" -> children().isTextOnlyContent()
    else -> false
  }
}

private fun List<ReadableMap>.textContent(converterContext: ConverterContext): String? {
  return mapNotNull { it.textFromTextNode(converterContext) }.joinToString(separator = "")
    .takeIf { it.isNotEmpty() }
}

private fun ReadableMap.textFromTextNode(converterContext: ConverterContext): String? {
  return when (typeName()) {
    "TextView" -> propsMap()?.let { createComposeProps<TextProps>(it, converterContext).textContent() }
    "react.fragment" -> children().textContent(converterContext)
    else -> null
  }
}

@OptimizedComposeProps
internal data class WidgetButtonProps(
  val colors: ButtonColors = ButtonColors(),
  val contentPadding: ContentPaddingRecord? = null,
  val enabled: Boolean = true,
  val label: String? = null,
  val modifiers: ModifierList = emptyList(),
  val target: String? = null
) : ComposeProps
