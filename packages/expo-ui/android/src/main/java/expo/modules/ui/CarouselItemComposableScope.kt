package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.carousel.CarouselItemScope
import expo.modules.kotlin.views.ComposableScope

@OptIn(ExperimentalMaterial3Api::class)
data class CarouselItemComposableScope(
  val carouselItemScope: CarouselItemScope
) : ComposableScope

@OptIn(ExperimentalMaterial3Api::class)
val ComposableScope.carouselItemScope: CarouselItemScope?
  get() = (this as? CarouselItemComposableScope)?.carouselItemScope
