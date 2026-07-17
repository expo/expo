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
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.kotlin.views.createComposeProps
import expo.modules.ui.BackgroundParams
import expo.modules.ui.CheckboxProps
import expo.modules.ui.CircularProgressIndicatorProps
import expo.modules.ui.DefaultMinSizeParams
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
import io.github.jakex7.peek.emittables.Emittable
import io.github.jakex7.peek.emittables.EmittableBox
import io.github.jakex7.peek.emittables.EmittableButton
import io.github.jakex7.peek.emittables.EmittableCheckBox
import io.github.jakex7.peek.emittables.EmittableCircularProgressIndicator
import io.github.jakex7.peek.emittables.EmittableColumn
import io.github.jakex7.peek.emittables.EmittableLinearProgressIndicator
import io.github.jakex7.peek.emittables.EmittableRadioButton
import io.github.jakex7.peek.emittables.EmittableRow
import io.github.jakex7.peek.emittables.EmittableSpacer
import io.github.jakex7.peek.emittables.EmittableSwitch
import io.github.jakex7.peek.emittables.EmittableText
import io.github.jakex7.peek.emittables.PeekModifier
import io.github.jakex7.peek.emittables.PeekRoot
import io.github.jakex7.peek.emittables.background
import io.github.jakex7.peek.emittables.clickable
import io.github.jakex7.peek.emittables.defaultMinSize
import io.github.jakex7.peek.emittables.fillMaxHeight
import io.github.jakex7.peek.emittables.fillMaxSize
import io.github.jakex7.peek.emittables.fillMaxWidth
import io.github.jakex7.peek.emittables.height
import io.github.jakex7.peek.emittables.padding
import io.github.jakex7.peek.emittables.size
import io.github.jakex7.peek.emittables.then
import io.github.jakex7.peek.emittables.width
import io.github.jakex7.peek.emittables.wrapContentHeight
import io.github.jakex7.peek.emittables.wrapContentWidth
import io.github.jakex7.peek.emittables.Alignment as PeekAlignment
import io.github.jakex7.peek.emittables.ColorProvider as PeekColorProvider
import io.github.jakex7.peek.emittables.FontStyle as PeekFontStyle
import io.github.jakex7.peek.emittables.FontWeight as PeekFontWeight
import io.github.jakex7.peek.emittables.HorizontalAlignment as PeekHorizontalAlignment
import io.github.jakex7.peek.emittables.TextAlign as PeekTextAlign
import io.github.jakex7.peek.emittables.TextDecoration as PeekTextDecoration
import io.github.jakex7.peek.emittables.VerticalAlignment as PeekVerticalAlignment

internal fun ReadableMap.toPeekRoot(context: Context, source: String): PeekRoot {
  return PeekRoot().also { root ->
    root.children += toPeekNodes(context, source)
  }
}

internal fun createErrorRoot(message: String): PeekRoot {
  return PeekRoot().also { root ->
    root.children += createErrorText(message)
  }
}

private fun createErrorText(message: String): EmittableText {
  return EmittableText().also {
    it.text = message
    it.modifier = PeekModifier.padding(8.dp)
  }
}

private fun ReadableMap.toPeekNodes(context: Context, source: String): List<Emittable> {
  return when (typeName()) {
    "BoxView" -> listOf(toPeekBox(context, source))
    "CheckboxView" -> listOf(toPeekCheckBox())
    "CircularProgressIndicatorView" -> listOf(toPeekCircularProgress())
    "ColumnView" -> listOf(toPeekColumn(context, source))
    "LinearProgressIndicatorView" -> listOf(toPeekLinearProgress())
    "LoadingIndicatorView" -> listOf(toPeekLoadingIndicator())
    "RadioButtonView" -> listOf(toPeekRadioButton())
    "react.fragment" -> children().flatMap { it.toPeekNodes(context, source) }
    "RowView" -> listOf(toPeekRow(context, source))
    "SpacerView" -> listOf(toPeekSpacer())
    "SwitchView" -> listOf(toPeekSwitch())
    "TextView" -> listOf(toPeekText())
    "Button", "FilledTonalButton", "OutlinedButton", "ElevatedButton", "TextButton" -> listOf(
      toPeekButton(context, source)
    )

    else -> listOf(createErrorText("View not found"))
  }
}

private fun ReadableMap.toPeekBox(context: Context, source: String): EmittableBox {
  val props = props<LayoutProps>()
  return EmittableBox().also {
    it.modifier = props.modifiers.toPeekModifier()
    it.contentAlignment = props.contentAlignment?.toPeekAlignment() ?: PeekAlignment.TopStart
    it.children += children().flatMap { child -> child.toPeekNodes(context, source) }
  }
}

private fun ReadableMap.toPeekRow(context: Context, source: String): EmittableRow {
  val props = props<LayoutProps>()
  return EmittableRow().also {
    it.modifier = props.modifiers.toPeekModifier()
    it.horizontalAlignment = props.toPeekHorizontalAlignment()
    it.verticalAlignment = props.toPeekVerticalAlignment()
    it.children += children().flatMap { child -> child.toPeekNodes(context, source) }
  }
}

private fun ReadableMap.toPeekColumn(context: Context, source: String): EmittableColumn {
  val props = props<LayoutProps>()
  return EmittableColumn().also {
    it.modifier = props.modifiers.toPeekModifier()
    it.verticalAlignment = props.toPeekVerticalAlignment()
    it.horizontalAlignment = props.toPeekHorizontalAlignment()
    it.children += children().flatMap { child -> child.toPeekNodes(context, source) }
  }
}

private fun ReadableMap.toPeekSpacer(): EmittableSpacer {
  return EmittableSpacer().also {
    it.modifier = props<SpacerProps>().modifiers.toPeekModifier()
  }
}

private fun ReadableMap.toPeekText(): EmittableText {
  val props = props<TextProps>()
  val typography = props.typography?.toPeekTypography()
  return EmittableText().also {
    it.text = props.textContent()
    it.modifier = props.textModifier()
    it.color = props.color.toPeekColorProvider() ?: typography?.color ?: it.color
    it.fontSize = props.fontSize?.sp ?: typography?.fontSize ?: TextUnit.Unspecified
    it.fontWeight =
      props.fontWeight?.toPeekFontWeight() ?: typography?.fontWeight ?: PeekFontWeight.Normal
    it.fontStyle = props.fontStyle?.toPeekFontStyle() ?: PeekFontStyle.Normal
    it.textAlign = props.textAlign?.toPeekTextAlign()
    it.textDecoration = props.textDecoration?.toPeekTextDecoration() ?: PeekTextDecoration.None
    it.maxLines = props.maxLines ?: Int.MAX_VALUE
  }
}

private fun ReadableMap.toPeekButton(context: Context, source: String): Emittable {
  val props = props<WidgetButtonProps>()
  val children = children()
  val action =
    props.target?.let { target -> WidgetInteraction(source, target).toPeekAction(context) }
  val modifier = props.buttonModifier()
  val contentColor = props.contentColorProvider()
  val textContent = children.textContent() ?: props.label
  if (textContent != null && (children.isEmpty() || children.isTextOnlyContent())) {
    return EmittableButton().also {
      it.text = textContent
      it.modifier = modifier
      it.enabled = props.enabled
      it.onClick = action
      it.color = contentColor ?: it.color
    }
  }

  return EmittableBox().also {
    it.modifier = if (props.enabled && action != null) {
      modifier.clickable(action)
    } else {
      modifier
    }
    it.contentAlignment = PeekAlignment.Center
    it.children += children.flatMap { child -> child.toPeekNodes(context, source) }
  }
}

private fun ReadableMap.toPeekCheckBox(): EmittableCheckBox {
  val props = props<CheckboxProps>()
  return EmittableCheckBox().also {
    it.checked = props.value
    it.enabled = props.enabled
    it.modifier = props.modifiers.toPeekModifier()
    it.color = if (props.value) {
      props.colors.checkedColor.toPeekColorProvider() ?: it.color
    } else {
      props.colors.uncheckedColor.toPeekColorProvider() ?: it.color
    }
  }
}

private fun ReadableMap.toPeekSwitch(): EmittableSwitch {
  val props = props<SwitchProps>()
  return EmittableSwitch().also {
    it.checked = props.value
    it.enabled = props.enabled
    it.modifier = props.modifiers.toPeekModifier()
    it.color = if (props.value) {
      props.colors.checkedThumbColor.toPeekColorProvider() ?: it.color
    } else {
      props.colors.uncheckedThumbColor.toPeekColorProvider() ?: it.color
    }
  }
}

private fun ReadableMap.toPeekRadioButton(): EmittableRadioButton {
  val props = props<RadioButtonProps>()
  return EmittableRadioButton().also {
    it.checked = props.selected
    it.enabled = props.clickable
    it.modifier = props.modifiers.toPeekModifier()
  }
}

private fun ReadableMap.toPeekLinearProgress(): EmittableLinearProgressIndicator {
  val props = props<LinearProgressIndicatorProps>()
  return EmittableLinearProgressIndicator().also {
    it.progress = props.progress
    it.modifier = props.modifiers.toPeekModifier()
    it.color = props.color.toPeekColorProvider() ?: it.color
    it.trackColor = props.trackColor.toPeekColorProvider() ?: it.trackColor
  }
}

private fun ReadableMap.toPeekCircularProgress(): EmittableCircularProgressIndicator {
  val props = props<CircularProgressIndicatorProps>()
  return EmittableCircularProgressIndicator().also {
    it.progress = props.progress
    it.modifier = props.modifiers.toPeekModifier()
    it.color = props.color.toPeekColorProvider() ?: it.color
    it.trackColor = props.trackColor.toPeekColorProvider() ?: it.trackColor
  }
}

private fun ReadableMap.toPeekLoadingIndicator(): EmittableCircularProgressIndicator {
  val props = props<LoadingIndicatorProps>()
  return EmittableCircularProgressIndicator().also {
    it.modifier = props.modifiers.toPeekModifier()
    it.color = props.color.toPeekColorProvider() ?: it.color
  }
}

private fun ModifierList.toPeekModifier(): PeekModifier {
  var result: PeekModifier = PeekModifier
  for (config in this) {
    result = result.then(config.toPeekModifier())
  }
  return result
}

private fun ModifierType.toPeekModifier(): PeekModifier {
  return when (this["\$type"]?.asString()) {
    "paddingAll" -> asRecord<PaddingAllParams>()?.let { PeekModifier.padding(it.all.dp) }
    "padding" -> asRecord<PaddingParams>()?.let {
      PeekModifier.padding(
        start = it.start.dp, top = it.top.dp, end = it.end.dp, bottom = it.bottom.dp
      )
    }

    "size" -> asRecord<SizeParams>()?.let { PeekModifier.size(it.width.dp, it.height.dp) }
    "width" -> asRecord<WidthParams>()?.let { PeekModifier.width(it.width.dp) }
    "height" -> asRecord<HeightParams>()?.let { PeekModifier.height(it.height.dp) }
    "defaultMinSize" -> asRecord<DefaultMinSizeParams>()?.toPeekModifier()
    "wrapContentWidth" -> asRecord<WrapContentWidthParams>()?.let { PeekModifier.wrapContentWidth() }
    "wrapContentHeight" -> asRecord<WrapContentHeightParams>()?.let { PeekModifier.wrapContentHeight() }
    "fillMaxSize" -> asRecord<FillMaxSizeParams>()?.let { PeekModifier.fillMaxSize() }
    "fillMaxWidth" -> asRecord<FillMaxWidthParams>()?.let { PeekModifier.fillMaxWidth() }
    "fillMaxHeight" -> asRecord<FillMaxHeightParams>()?.let { PeekModifier.fillMaxHeight() }
    "background" -> asRecord<BackgroundParams>()?.color?.toPeekColorProvider()
      ?.let { PeekModifier.background(it) }
    // TODO(@jakex7): Unsupported Expo UI modifiers are intentionally ignored until Peek
    //  can represent them as RemoteViews without changing semantics.
    else -> null
  } ?: PeekModifier
}

private fun DefaultMinSizeParams.toPeekModifier(): PeekModifier {
  return PeekModifier.defaultMinSize(
    minWidth = minWidth?.dp ?: androidx.compose.ui.unit.Dp.Unspecified,
    minHeight = minHeight?.dp ?: androidx.compose.ui.unit.Dp.Unspecified
  )
}

private inline fun <reified T : Record> ModifierType.asRecord(): T? {
  return runCatching { recordFromMap<T>(this) }.getOrNull()
}

private fun TextProps.textModifier(): PeekModifier {
  var modifier = modifiers.toPeekModifier()
  background.toPeekColorProvider()?.let {
    modifier = modifier.background(it)
  }
  return modifier
}

private fun WidgetButtonProps.buttonModifier(): PeekModifier {
  var modifier = modifiers.toPeekModifier()
  val color = if (enabled) {
    colors.containerColor
  } else {
    colors.disabledContainerColor ?: colors.containerColor
  }
  color.toPeekColorProvider()?.let {
    modifier = modifier.background(it)
  }
  contentPadding?.let {
    modifier = modifier.then(it.toPeekModifier())
  }
  return modifier
}

private fun WidgetButtonProps.contentColorProvider(): PeekColorProvider? {
  val color = if (enabled) {
    colors.contentColor
  } else {
    colors.disabledContentColor ?: colors.contentColor
  }
  return color.toPeekColorProvider()
}

private fun ContentPaddingRecord.toPeekModifier(): PeekModifier {
  return PeekModifier.padding(
    start = (start ?: 0.0).toFloat().dp,
    top = (top ?: 0.0).toFloat().dp,
    end = (end ?: 0.0).toFloat().dp,
    bottom = (bottom ?: 0.0).toFloat().dp
  )
}

private fun AndroidColor?.toPeekColorProvider(): PeekColorProvider? {
  return colorToComposeColorOrNull(this)?.let(::PeekColorProvider)
}

private fun LayoutProps.toPeekHorizontalAlignment(): PeekHorizontalAlignment {
  horizontalAlignment?.let {
    return it.toPeekHorizontalAlignment()
  }

  val arrangement = horizontalArrangement
  return if (arrangement?.`is`(HorizontalArrangementDefault::class) == true) {
    when (arrangement.first()) {
      HorizontalArrangementDefault.START -> PeekAlignment.Start
      HorizontalArrangementDefault.CENTER -> PeekAlignment.CenterHorizontally
      HorizontalArrangementDefault.END -> PeekAlignment.End
      else -> PeekAlignment.Start
    }
  } else {
    PeekAlignment.Start
  }
}

private fun LayoutProps.toPeekVerticalAlignment(): PeekVerticalAlignment {
  verticalAlignment?.let {
    return it.toPeekVerticalAlignment()
  }

  val arrangement = verticalArrangement
  return if (arrangement?.`is`(VerticalArrangementDefault::class) == true) {
    when (arrangement.first()) {
      VerticalArrangementDefault.TOP -> PeekAlignment.Top
      VerticalArrangementDefault.CENTER -> PeekAlignment.CenterVertically
      VerticalArrangementDefault.BOTTOM -> PeekAlignment.Bottom
      else -> PeekAlignment.Top
    }
  } else {
    PeekAlignment.Top
  }
}

private fun ContentAlignment.toPeekAlignment(): PeekAlignment {
  return when (this) {
    ContentAlignment.TOP_START -> PeekAlignment.TopStart
    ContentAlignment.TOP_CENTER -> PeekAlignment.TopCenter
    ContentAlignment.TOP_END -> PeekAlignment.TopEnd
    ContentAlignment.CENTER_START -> PeekAlignment.CenterStart
    ContentAlignment.CENTER -> PeekAlignment.Center
    ContentAlignment.CENTER_END -> PeekAlignment.CenterEnd
    ContentAlignment.BOTTOM_START -> PeekAlignment.BottomStart
    ContentAlignment.BOTTOM_CENTER -> PeekAlignment.BottomCenter
    ContentAlignment.BOTTOM_END -> PeekAlignment.BottomEnd
  }
}

private fun HorizontalAlignment.toPeekHorizontalAlignment(): PeekHorizontalAlignment {
  return when (this) {
    HorizontalAlignment.START -> PeekAlignment.Start
    HorizontalAlignment.CENTER -> PeekAlignment.CenterHorizontally
    HorizontalAlignment.END -> PeekAlignment.End
  }
}

private fun VerticalAlignment.toPeekVerticalAlignment(): PeekVerticalAlignment {
  return when (this) {
    VerticalAlignment.TOP -> PeekAlignment.Top
    VerticalAlignment.CENTER -> PeekAlignment.CenterVertically
    VerticalAlignment.BOTTOM -> PeekAlignment.Bottom
  }
}

private fun TextFontWeight.toPeekFontWeight(): PeekFontWeight {
  return when (this) {
    TextFontWeight.BOLD, TextFontWeight.W700, TextFontWeight.W800, TextFontWeight.W900 -> PeekFontWeight.Bold
    TextFontWeight.NORMAL, TextFontWeight.W100, TextFontWeight.W200, TextFontWeight.W300, TextFontWeight.W400, TextFontWeight.W500, TextFontWeight.W600 -> PeekFontWeight.Normal
  }
}

private fun TextFontStyle.toPeekFontStyle(): PeekFontStyle {
  return when (this) {
    TextFontStyle.NORMAL -> PeekFontStyle.Normal
    TextFontStyle.ITALIC -> PeekFontStyle.Italic
  }
}

private fun TextAlignType.toPeekTextAlign(): PeekTextAlign {
  return when (this) {
    TextAlignType.LEFT -> PeekTextAlign.Left
    TextAlignType.RIGHT -> PeekTextAlign.Right
    TextAlignType.CENTER -> PeekTextAlign.Center
    TextAlignType.JUSTIFY, TextAlignType.START -> PeekTextAlign.Start

    TextAlignType.END -> PeekTextAlign.End
  }
}

private fun TextDecorationType.toPeekTextDecoration(): PeekTextDecoration {
  return when (this) {
    TextDecorationType.NONE -> PeekTextDecoration.None
    TextDecorationType.UNDERLINE -> PeekTextDecoration.Underline
    TextDecorationType.LINE_THROUGH -> PeekTextDecoration.LineThrough
  }
}

private data class PeekTypography(
  val fontSize: TextUnit,
  val fontWeight: PeekFontWeight? = null,
  val color: PeekColorProvider? = null
)

private fun TypographyStyle.toPeekTypography(): PeekTypography {
  return when (this) {
    TypographyStyle.DISPLAY_LARGE -> PeekTypography(fontSize = 57.sp)
    TypographyStyle.DISPLAY_MEDIUM -> PeekTypography(fontSize = 45.sp)
    TypographyStyle.DISPLAY_SMALL -> PeekTypography(fontSize = 36.sp)
    TypographyStyle.HEADLINE_LARGE -> PeekTypography(fontSize = 32.sp)
    TypographyStyle.HEADLINE_MEDIUM -> PeekTypography(fontSize = 28.sp)
    TypographyStyle.HEADLINE_SMALL -> PeekTypography(fontSize = 24.sp)
    TypographyStyle.TITLE_LARGE -> PeekTypography(fontSize = 22.sp)
    TypographyStyle.TITLE_MEDIUM -> PeekTypography(fontSize = 16.sp)
    TypographyStyle.TITLE_SMALL -> PeekTypography(fontSize = 14.sp)
    TypographyStyle.BODY_LARGE -> PeekTypography(fontSize = 16.sp)
    TypographyStyle.BODY_MEDIUM -> PeekTypography(fontSize = 14.sp)
    TypographyStyle.BODY_SMALL -> PeekTypography(fontSize = 12.sp)
    TypographyStyle.LABEL_LARGE -> PeekTypography(fontSize = 14.sp)
    TypographyStyle.LABEL_MEDIUM -> PeekTypography(fontSize = 12.sp)
    TypographyStyle.LABEL_SMALL -> PeekTypography(fontSize = 11.sp)
  }
}

private inline fun <reified Props : ComposeProps> ReadableMap.props(): Props {
  return createComposeProps(propsMap())
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

private fun List<ReadableMap>.textContent(): String? {
  return mapNotNull { it.textFromTextNode() }.joinToString(separator = "")
    .takeIf { it.isNotEmpty() }
}

private fun ReadableMap.textFromTextNode(): String? {
  return when (typeName()) {
    "TextView" -> propsMap()?.let { createComposeProps<TextProps>(it).textContent() }
    "react.fragment" -> children().textContent()
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
