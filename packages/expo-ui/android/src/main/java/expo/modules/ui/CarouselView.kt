package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.carousel.HorizontalMultiBrowseCarousel
import androidx.compose.material3.carousel.HorizontalUncontainedCarousel
import androidx.compose.material3.carousel.rememberCarouselState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.request.crossfade
import android.util.Log
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.clip
import androidx.compose.material3.MaterialTheme.typography
import androidx.compose.material3.Text
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import java.io.Serializable
import androidx.core.graphics.toColorInt

data class CarouselItem(
  @Field
  val image: String,
  @Field
  val title: String
) : Record

class CarouselItemPressEvent : Record, Serializable {
  @Field
  var index: Int = 0
}

enum class CarouselVariant(val value: String) {
  MULTI_BROWSE("multiBrowse"),
  UNCONTAINED("uncontained")
}

enum class TextStyle(val value: String) {
  TITLE_LARGE("titleLarge"),
  TITLE_MEDIUM("titleMedium"),
  TITLE_SMALL("titleSmall"),
  BODY_LARGE("bodyLarge"),
  BODY_MEDIUM("bodyMedium"),
  BODY_SMALL("bodySmall")
}

data class CarouselConfig(
  @Field val preferredItemWidth: Float = 200f,
  @Field val itemHeight: Float = 200f,
  @Field val itemSpacing: Float = 8f,
  @Field val contentPadding: Float = 16f,
  @Field val topBottomPadding: Float = 8f,
  @Field val cornerRadius: Float = 28f,
  @Field val initialItemIndex: Int = 0,
  @Field val textColor: String = "#FFFFFF",
  @Field val textStyle: TextStyle = TextStyle.TITLE_MEDIUM
) : Record

data class CarouselViewProps(
  val items: MutableState<List<CarouselItem>> = mutableStateOf(emptyList()),
  val variant: MutableState<String> = mutableStateOf("multiBrowse"),
  val preferredItemWidth: MutableState<Float> = mutableFloatStateOf(200f),
  val itemHeight: MutableState<Float> = mutableFloatStateOf(200f),
  val itemSpacing: MutableState<Float> = mutableFloatStateOf(8f),
  val contentPadding: MutableState<Float> = mutableFloatStateOf(16f),
  val topBottomPadding: MutableState<Float> = mutableFloatStateOf(8f),
  val cornerRadius: MutableState<Float> = mutableFloatStateOf(28f),
  val initialItemIndex: MutableState<Int> = mutableIntStateOf(0),
  val textColor: MutableState<String> = mutableStateOf("#FFFFFF"),
  val textStyle: MutableState<TextStyle> = mutableStateOf(TextStyle.TITLE_MEDIUM)
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
class CarouselView(context: Context, appContext: AppContext) :
  ExpoComposeView<CarouselViewProps>(context, appContext, withHostingView = true) {

  override val props = CarouselViewProps()
  private val onItemPress by EventDispatcher<CarouselItemPressEvent>()

  @Composable
  private fun MultiBrowseCarousel(
    items: List<CarouselItem>,
    config: CarouselConfig,
    modifier: Modifier = Modifier,
    onItemPress: (Int) -> Unit
  ) {
    HorizontalMultiBrowseCarousel(
      state = rememberCarouselState(config.initialItemIndex) { items.size },
      modifier = modifier
        .fillMaxWidth()
        .wrapContentHeight()
        .padding(top = config.topBottomPadding.dp, bottom = config.topBottomPadding.dp),
      preferredItemWidth = config.preferredItemWidth.dp,
      itemSpacing = config.itemSpacing.dp,
      contentPadding = PaddingValues(horizontal = config.contentPadding.dp)
    ) { i ->
      val item = items[i]
      CarouselItem(
        item = item,
        config = config,
        onItemPress = { onItemPress(i) }
      )
    }
  }

  @Composable
  private fun UncontainedCarousel(
    items: List<CarouselItem>,
    config: CarouselConfig,
    modifier: Modifier = Modifier,
    onItemPress: (Int) -> Unit
  ) {
    HorizontalUncontainedCarousel(
      state = rememberCarouselState(config.initialItemIndex) { items.size },
      modifier = modifier
        .fillMaxWidth()
        .wrapContentHeight()
        .padding(top = config.topBottomPadding.dp, bottom = config.topBottomPadding.dp),
      itemSpacing = config.itemSpacing.dp,
      itemWidth = config.preferredItemWidth.dp,
      contentPadding = PaddingValues(0.dp)
    ) { i ->
      val item = items[i]
      CarouselItem(
        item = item,
        config = config,
        onItemPress = { onItemPress(i) }
      )
    }
  }

  @Composable
  override fun Content(modifier: Modifier) {
    val items = props.items.value
    val variant = props.variant.value
    val config = CarouselConfig(
      preferredItemWidth = props.preferredItemWidth.value,
      itemHeight = props.itemHeight.value,
      itemSpacing = props.itemSpacing.value,
      contentPadding = props.contentPadding.value,
      topBottomPadding = props.topBottomPadding.value,
      cornerRadius = props.cornerRadius.value,
      initialItemIndex = props.initialItemIndex.value,
      textColor = props.textColor.value,
      textStyle = props.textStyle.value
    )
    val onItemPress: (Int) -> Unit = { index ->
      val event = CarouselItemPressEvent()
      event.index = index
      onItemPress.invoke(event)
    }

    when (variant) {
      CarouselVariant.MULTI_BROWSE.value -> MultiBrowseCarousel(items, config, modifier, onItemPress)
      CarouselVariant.UNCONTAINED.value -> UncontainedCarousel(items, config, modifier, onItemPress)
      else -> MultiBrowseCarousel(items, config, modifier, onItemPress) // Default
    }
  }
}

@Composable
private fun CarouselItem(
  item: CarouselItem,
  config: CarouselConfig,
  onItemPress: (() -> Unit)?,
) {
  val context = LocalContext.current.applicationContext

  Box(
    modifier = Modifier
      .height(config.itemHeight.dp)
      .fillMaxWidth(0.95f)
      .clip(RoundedCornerShape(config.cornerRadius.dp))
      .clickable { onItemPress?.invoke() }
  ) {
    AsyncImage(
      model = ImageRequest.Builder(context)
        .data(item.image)
        .crossfade(true)
        .build(),
      contentDescription = item.title,
      contentScale = ContentScale.Crop,
      modifier = Modifier.fillMaxSize(),
    )

    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(16.dp),
      verticalArrangement = Arrangement.Bottom
    ) {
      Text(
        text = item.title,
        color = Color(config.textColor.toColorInt()),
        style = when (config.textStyle) {
          TextStyle.TITLE_LARGE -> typography.titleLarge
          TextStyle.TITLE_MEDIUM -> typography.titleMedium
          TextStyle.TITLE_SMALL -> typography.titleSmall
          TextStyle.BODY_LARGE -> typography.bodyLarge
          TextStyle.BODY_MEDIUM -> typography.bodyMedium
          TextStyle.BODY_SMALL -> typography.bodySmall
          else -> typography.titleMedium
        }
      )
    }
  }
}