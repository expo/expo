package expo.modules.ui

import androidx.compose.foundation.gestures.TargetedFlingBehavior
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.carousel.CarouselDefaults
import androidx.compose.material3.carousel.HorizontalCenteredHeroCarousel
import androidx.compose.material3.carousel.HorizontalMultiBrowseCarousel
import androidx.compose.material3.carousel.rememberCarouselState
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.view.size
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

enum class FlingBehaviorType(val value: String) : Enumerable {
  SINGLE_ADVANCE("singleAdvance"),
  NO_SNAP("noSnap")
}

class PaddingValuesRecord : Record {
  @Field val start: Float? = null
  @Field val top: Float? = null
  @Field val end: Float? = null
  @Field val bottom: Float? = null

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

data class HorizontalCenteredHeroCarouselProps(
  val maxItemWidth: Float? = null,
  val itemSpacing: Float = 0f,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val minSmallItemWidth: Float? = null,
  val maxSmallItemWidth: Float? = null,
  val flingBehavior: FlingBehaviorType = FlingBehaviorType.SINGLE_ADVANCE,
  val userScrollEnabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.HorizontalCenteredHeroCarouselContent(props: HorizontalCenteredHeroCarouselProps) {
  val contentPadding = paddingValuesFromEither(props.contentPadding)
  val carouselState = rememberCarouselState(0) { view.size }
  val flingBehavior: TargetedFlingBehavior = when (props.flingBehavior) {
    FlingBehaviorType.SINGLE_ADVANCE -> CarouselDefaults.singleAdvanceFlingBehavior(state = carouselState)
    FlingBehaviorType.NO_SNAP -> CarouselDefaults.noSnapFlingBehavior()
  }

  HorizontalCenteredHeroCarousel(
    state = carouselState,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    maxItemWidth = props.maxItemWidth?.dp ?: Dp.Unspecified,
    itemSpacing = props.itemSpacing.dp,
    flingBehavior = flingBehavior,
    userScrollEnabled = props.userScrollEnabled,
    minSmallItemWidth = props.minSmallItemWidth?.dp ?: CarouselDefaults.MinSmallItemSize,
    maxSmallItemWidth = props.maxSmallItemWidth?.dp ?: CarouselDefaults.MaxSmallItemSize,
    contentPadding = contentPadding
  ) { itemIndex ->
    Child(ComposableScope(), itemIndex)
  }
}

data class HorizontalMultiBrowseCarouselProps(
  val preferredItemWidth: Float = 0f,
  val itemSpacing: Float = 0f,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val minSmallItemWidth: Float? = null,
  val maxSmallItemWidth: Float? = null,
  val flingBehavior: FlingBehaviorType = FlingBehaviorType.SINGLE_ADVANCE,
  val userScrollEnabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.HorizontalMultiBrowseCarouselContent(props: HorizontalMultiBrowseCarouselProps) {
  val contentPadding = paddingValuesFromEither(props.contentPadding)
  val carouselState = rememberCarouselState(0) { view.size }
  val flingBehavior: TargetedFlingBehavior = when (props.flingBehavior) {
    FlingBehaviorType.SINGLE_ADVANCE -> CarouselDefaults.singleAdvanceFlingBehavior(state = carouselState)
    FlingBehaviorType.NO_SNAP -> CarouselDefaults.noSnapFlingBehavior()
  }

  HorizontalMultiBrowseCarousel(
    state = carouselState,
    preferredItemWidth = props.preferredItemWidth.dp,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    itemSpacing = props.itemSpacing.dp,
    flingBehavior = flingBehavior,
    userScrollEnabled = props.userScrollEnabled,
    minSmallItemWidth = props.minSmallItemWidth?.dp ?: CarouselDefaults.MinSmallItemSize,
    maxSmallItemWidth = props.maxSmallItemWidth?.dp ?: CarouselDefaults.MaxSmallItemSize,
    contentPadding = contentPadding
  ) { itemIndex ->
    Child(ComposableScope(), itemIndex)
  }
}
