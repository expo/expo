@file:OptIn(EitherType::class)

package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.gestures.TargetedFlingBehavior
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.carousel.HorizontalMultiBrowseCarousel
import androidx.compose.material3.carousel.HorizontalUncontainedCarousel
import androidx.compose.material3.carousel.rememberCarouselState
import androidx.compose.material3.carousel.CarouselDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.ComposableScope

enum class CarouselVariant(val value: String) : Enumerable {
  MULTI_BROWSE("multiBrowse"),
  UNCONSTRAINED("unconstrained")
}

enum class FlingBehaviorType(val value: String) : Enumerable {
  SINGLE_ADVANCE("singleAdvance"),
  NO_SNAP("noSnap")
}

class PaddingValuesRecord : Record {
  @Field
  val start: Float? = null

  @Field
  val top: Float? = null

  @Field
  val end: Float? = null

  @Field
  val bottom: Float? = null

  fun toPaddingValues(): PaddingValues {
    return PaddingValues(
      start?.dp ?: 0.dp,
      top?.dp ?: 0.dp,
      end?.dp ?: 0.dp,
      bottom?.dp ?: 0.dp
    )
  }
}

fun paddingValuesFromEither(either: Either<Float, PaddingValuesRecord>?): PaddingValues {
  if (either == null) {
    return PaddingValues(0.dp)
  }
  
  return when {
    either.`is`(Float::class) -> PaddingValues(either.get(Float::class).dp)
    either.`is`(PaddingValuesRecord::class) -> either.get(PaddingValuesRecord::class).toPaddingValues()
    else -> throw IllegalStateException()
  }
}

data class CarouselProps(
  val variant: MutableState<CarouselVariant?> = mutableStateOf(null),
  val modifiers: MutableState<List<ExpoModifier>?> = mutableStateOf(null),
  val itemSpacing: MutableState<Float?> = mutableStateOf(null),
  val contentPadding: MutableState<Either<Float, PaddingValuesRecord>?> = mutableStateOf(null),
  val minSmallItemWidth: MutableState<Float?> = mutableStateOf(null),
  val maxSmallItemWidth: MutableState<Float?> = mutableStateOf(null),
  val flingBehavior: MutableState<FlingBehaviorType?> = mutableStateOf(null),
  val preferredItemWidth: MutableState<Float?> = mutableStateOf(null),
  val itemWidth: MutableState<Float?> = mutableStateOf(null)
) : ComposeProps

const val DEFAULT_MIN_SMALL_ITEM_WIDTH = 40f
const val DEFAULT_MAX_SMALL_ITEM_WIDTH = 56f
const val DEFAULT_PREFERRED_ITEM_WIDTH = 200f
const val DEFAULT_ITEM_WIDTH = 200f

class CarouselView(context: Context, appContext: AppContext) : ExpoComposeView<CarouselProps>(context, appContext) {
  override val props = CarouselProps()

  @OptIn(ExperimentalMaterial3Api::class)
  @Composable
  override fun ComposableScope.Content() {
    val variant = props.variant.value ?: CarouselVariant.MULTI_BROWSE
    val modifiers = props.modifiers.value ?: emptyList()
    val itemSpacing = (props.itemSpacing.value ?: 0f).dp
    val minSmallItemWidth = (props.minSmallItemWidth.value ?: DEFAULT_MIN_SMALL_ITEM_WIDTH).dp

    // we need to constrain maxSmallItemWidth to be at least minSmallItemWidth or the app will crash
    val maxSmallItemWidth = minSmallItemWidth.coerceAtLeast((props.maxSmallItemWidth.value ?: DEFAULT_MAX_SMALL_ITEM_WIDTH).dp)
    val preferredItemWidth = (props.preferredItemWidth.value ?: DEFAULT_PREFERRED_ITEM_WIDTH).dp
    val itemWidth = (props.itemWidth.value ?: DEFAULT_ITEM_WIDTH).dp
    val flingBehaviorType = props.flingBehavior.value ?: FlingBehaviorType.SINGLE_ADVANCE
    val contentPadding = paddingValuesFromEither(props.contentPadding.value)

    val carouselState = rememberCarouselState(0) { size }

    val flingBehavior: TargetedFlingBehavior = when (flingBehaviorType) {
      FlingBehaviorType.SINGLE_ADVANCE -> CarouselDefaults.singleAdvanceFlingBehavior(state = carouselState)
      FlingBehaviorType.NO_SNAP -> CarouselDefaults.noSnapFlingBehavior()
    }

    @Composable
    fun MultiBrowseCarouselComposable() {
      HorizontalMultiBrowseCarousel(
        state = carouselState,
        preferredItemWidth = preferredItemWidth,
        modifier = Modifier.fromExpoModifiers(modifiers, this@Content),
        itemSpacing = itemSpacing,
        flingBehavior = flingBehavior,
        minSmallItemWidth = minSmallItemWidth,
        maxSmallItemWidth = maxSmallItemWidth,
        contentPadding = contentPadding
      ) { itemIndex ->
        Child(ComposableScope(), itemIndex)
      }
    }

    @Composable
    fun UnconstrainedCarouselComposable() {
      HorizontalUncontainedCarousel(
        state = carouselState,
        itemWidth = itemWidth,
        modifier = Modifier.fromExpoModifiers(modifiers, this@Content),
        itemSpacing = itemSpacing,
        flingBehavior = flingBehavior,
        contentPadding = contentPadding
      ) { itemIndex ->
        Child(ComposableScope(), itemIndex)
      }
    }

    when (variant) {
      CarouselVariant.MULTI_BROWSE -> MultiBrowseCarouselComposable()
      CarouselVariant.UNCONSTRAINED -> UnconstrainedCarouselComposable()
    }
  }
}
