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
  val title: String,
  @Field
  val textColor: String? = null,
  @Field
  val textStyle: TextStyle? = null,
  @Field
  val cornerRadius: Float? = null
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
  @Field val itemSpacing: Float = 8f,
  @Field val contentPadding: Float = 0f,
  @Field val initialItemIndex: Int = 0
) : Record

data class CarouselViewProps(
  val elements: MutableState<List<CarouselItem>> = mutableStateOf(emptyList()),
  val variant: MutableState<String> = mutableStateOf("multiBrowse"),
  val preferredItemWidth: MutableState<Float> = mutableFloatStateOf(200f),
  val itemSpacing: MutableState<Float> = mutableFloatStateOf(8f),
  val contentPadding: MutableState<Float> = mutableFloatStateOf(0f),
  val initialItemIndex: MutableState<Int> = mutableIntStateOf(0),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
class CarouselView(context: Context, appContext: AppContext) :
  ExpoComposeView<CarouselViewProps>(context, appContext, withHostingView = true) {

  override val props = CarouselViewProps()
  private val onItemPress by EventDispatcher<CarouselItemPressEvent>()

  private fun onItemPress(index: Int) {
    val event = CarouselItemPressEvent()
    event.index = index
    onItemPress.invoke(event)
  }

  @Composable
  private fun MultiBrowseCarousel(
    items: List<CarouselItem>,
    config: CarouselConfig,
    modifier: Modifier = Modifier
  ) {
    HorizontalMultiBrowseCarousel(
      state = rememberCarouselState(config.initialItemIndex) { items.size },
      modifier = modifier
        .fillMaxWidth()
        .wrapContentHeight(),
      preferredItemWidth = config.preferredItemWidth.dp,
      itemSpacing = config.itemSpacing.dp,
      contentPadding = PaddingValues(horizontal = config.contentPadding.dp)
    ) { i ->
      val item = items[i]
      CarouselItem(
        item = item,
        onItemPress = { onItemPress(i) }
      )
    }
  }

  @Composable
  private fun UncontainedCarousel(
    items: List<CarouselItem>,
    config: CarouselConfig,
    modifier: Modifier = Modifier
  ) {
    HorizontalUncontainedCarousel(
      state = rememberCarouselState(config.initialItemIndex) { items.size },
      modifier = modifier
        .fillMaxWidth()
        .wrapContentHeight(),
      itemSpacing = config.itemSpacing.dp,
      itemWidth = config.preferredItemWidth.dp,
      contentPadding = PaddingValues(horizontal = config.contentPadding.dp)
    ) { i ->
      val item = items[i]
      CarouselItem(
        item = item,
        onItemPress = { onItemPress(i) }
      )
    }
  }

  @Composable
  override fun Content(modifier: Modifier) {
    val items = props.elements.value
    val variant = props.variant.value
    val config = CarouselConfig(
      preferredItemWidth = props.preferredItemWidth.value,
      itemSpacing = props.itemSpacing.value,
      contentPadding = props.contentPadding.value,
      initialItemIndex = props.initialItemIndex.value
    )

    // Apply modifiers to the carousel
    val modifiedModifier = modifier.fromExpoModifiers(props.modifiers.value)

    when (variant) {
      CarouselVariant.MULTI_BROWSE.value -> MultiBrowseCarousel(items, config, modifiedModifier)
      CarouselVariant.UNCONTAINED.value -> UncontainedCarousel(items, config, modifiedModifier)
      else -> MultiBrowseCarousel(items, config, modifiedModifier) // Default
    }
  }
}

@Composable
private fun CarouselItem(
  item: CarouselItem,
  onItemPress: () -> Unit
) {
  val context = LocalContext.current.applicationContext
  
  val itemCornerRadius = item.cornerRadius ?: 28f
  val itemTextColor = item.textColor ?: "#FFFFFF"
  val itemTextStyle = item.textStyle ?: TextStyle.TITLE_MEDIUM

  Box(
    modifier = Modifier
      .wrapContentHeight()
      .fillMaxWidth(0.95f)
      .clip(RoundedCornerShape(itemCornerRadius.dp))
      .clickable { onItemPress() }
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
        color = Color(itemTextColor.toColorInt()),
        style = when (itemTextStyle) {
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