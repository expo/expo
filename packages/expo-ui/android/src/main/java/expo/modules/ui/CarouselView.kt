package expo.modules.ui

import androidx.compose.foundation.gestures.TargetedFlingBehavior
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.carousel.CarouselDefaults
import androidx.compose.material3.carousel.HorizontalCenteredHeroCarousel
import androidx.compose.material3.carousel.HorizontalMultiBrowseCarousel
import androidx.compose.material3.carousel.HorizontalUncontainedCarousel
import androidx.compose.material3.carousel.rememberCarouselState
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.view.size
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

enum class FlingBehaviorType(val value: String) : Enumerable {
  SINGLE_ADVANCE("singleAdvance"),
  NO_SNAP("noSnap")
}

@OptimizedComposeProps
data class HorizontalCenteredHeroCarouselProps(
  val maxItemWidth: Float? = null,
  val itemSpacing: Float? = null,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val minSmallItemWidth: Float? = null,
  val maxSmallItemWidth: Float? = null,
  val flingBehavior: FlingBehaviorType? = null,
  val userScrollEnabled: Boolean? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.HorizontalCenteredHeroCarouselContent(props: HorizontalCenteredHeroCarouselProps) {
  val contentPadding = props.contentPadding.toPaddingValues()
  val carouselState = rememberCarouselState(0) { view.size }
  val flingBehavior: TargetedFlingBehavior = when (props.flingBehavior ?: FlingBehaviorType.SINGLE_ADVANCE) {
    FlingBehaviorType.SINGLE_ADVANCE -> CarouselDefaults.singleAdvanceFlingBehavior(state = carouselState)
    FlingBehaviorType.NO_SNAP -> CarouselDefaults.noSnapFlingBehavior()
  }

  val minSmallItemWidth = props.minSmallItemWidth?.dp ?: CarouselDefaults.MinSmallItemSize
  val maxSmallItemWidth = (props.maxSmallItemWidth?.dp ?: CarouselDefaults.MaxSmallItemSize).coerceAtLeast(minSmallItemWidth)

  HorizontalCenteredHeroCarousel(
    state = carouselState,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    maxItemWidth = props.maxItemWidth?.dp ?: Dp.Unspecified,
    itemSpacing = (props.itemSpacing ?: 0f).dp,
    flingBehavior = flingBehavior,
    userScrollEnabled = props.userScrollEnabled ?: true,
    minSmallItemWidth = minSmallItemWidth,
    maxSmallItemWidth = maxSmallItemWidth,
    contentPadding = contentPadding
  ) { itemIndex ->
    Child(UIComposableScope(), itemIndex)
  }
}

@OptimizedComposeProps
data class HorizontalMultiBrowseCarouselProps(
  val preferredItemWidth: Float = 200f,
  val itemSpacing: Float? = null,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val minSmallItemWidth: Float? = null,
  val maxSmallItemWidth: Float? = null,
  val flingBehavior: FlingBehaviorType? = null,
  val userScrollEnabled: Boolean? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.HorizontalMultiBrowseCarouselContent(props: HorizontalMultiBrowseCarouselProps) {
  val contentPadding = props.contentPadding.toPaddingValues()
  val carouselState = rememberCarouselState(0) { view.size }
  val flingBehavior: TargetedFlingBehavior = when (props.flingBehavior ?: FlingBehaviorType.SINGLE_ADVANCE) {
    FlingBehaviorType.SINGLE_ADVANCE -> CarouselDefaults.singleAdvanceFlingBehavior(state = carouselState)
    FlingBehaviorType.NO_SNAP -> CarouselDefaults.noSnapFlingBehavior()
  }

  val minSmallItemWidth = props.minSmallItemWidth?.dp ?: CarouselDefaults.MinSmallItemSize
  val maxSmallItemWidth = (props.maxSmallItemWidth?.dp ?: CarouselDefaults.MaxSmallItemSize).coerceAtLeast(minSmallItemWidth)

  HorizontalMultiBrowseCarousel(
    state = carouselState,
    preferredItemWidth = props.preferredItemWidth.dp,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    itemSpacing = (props.itemSpacing ?: 0f).dp,
    flingBehavior = flingBehavior,
    userScrollEnabled = props.userScrollEnabled ?: true,
    minSmallItemWidth = minSmallItemWidth,
    maxSmallItemWidth = maxSmallItemWidth,
    contentPadding = contentPadding
  ) { itemIndex ->
    Child(UIComposableScope(), itemIndex)
  }
}

@OptimizedComposeProps
data class HorizontalUncontainedCarouselProps(
  val itemWidth: Float = 200f,
  val itemSpacing: Float? = null,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val flingBehavior: FlingBehaviorType? = null,
  val userScrollEnabled: Boolean? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.HorizontalUncontainedCarouselContent(props: HorizontalUncontainedCarouselProps) {
  val contentPadding = props.contentPadding.toPaddingValues()
  val carouselState = rememberCarouselState(0) { view.size }
  // Uncontained defaults to noSnap, unlike the other two which default to singleAdvance
  val flingBehavior: TargetedFlingBehavior = when (props.flingBehavior ?: FlingBehaviorType.NO_SNAP) {
    FlingBehaviorType.SINGLE_ADVANCE -> CarouselDefaults.singleAdvanceFlingBehavior(state = carouselState)
    FlingBehaviorType.NO_SNAP -> CarouselDefaults.noSnapFlingBehavior()
  }

  HorizontalUncontainedCarousel(
    state = carouselState,
    itemWidth = props.itemWidth.dp,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    itemSpacing = (props.itemSpacing ?: 0f).dp,
    flingBehavior = flingBehavior,
    userScrollEnabled = props.userScrollEnabled ?: true,
    contentPadding = contentPadding
  ) { itemIndex ->
    Child(UIComposableScope(), itemIndex)
  }
}
