package expo.modules.camera2.utils

import android.util.Size

/**
 * A size selector receives a list of [Size]s and returns another list with
 * sizes that are considered acceptable.
 */
interface SizeSelector {
  /**
   * Returns a list of acceptable sizes from the given input.
   * The final size will be the first element in the output list.
   *
   * @param source input list
   * @return output list
   */
  fun select(source: List<Size>): List<Size>
}


/**
 * Static utilities to create, join and merge [SizeSelector]s instances.
 */
object SizeSelectors {

  /**
   * A size constraint to easily filter out
   * sizes in a list.
   */
  interface Filter {
    fun accepts(size: Size): Boolean
  }

  /**
   * Returns a new [SizeSelector] with the given [Filter].
   * This kind of selector will respect the order in the source array.
   *
   * @param filter a filter
   * @return a new selector
   */
  fun withFilter(filter: Filter): SizeSelector {
    return FilterSelector(filter)
  }

  /**
   * Returns a new [SizeSelector] that keeps only sizes
   * whose width is at most equal to the given width.
   *
   * @param width the max width
   * @return a new selector
   */
  fun maxWidth(width: Int): SizeSelector {
    return withFilter(object : Filter {
      override fun accepts(size: Size): Boolean {
        return size.width <= width
      }
    })
  }

  /**
   * Returns a new [SizeSelector] that keeps only sizes
   * whose width is at least equal to the given width.
   *
   * @param width the min width
   * @return a new selector
   */
  fun minWidth(width: Int): SizeSelector {
    return withFilter(object : Filter {
      override fun accepts(size: Size): Boolean {
        return size.width >= width
      }
    })
  }

  /**
   * Returns a new [SizeSelector] that keeps only sizes
   * whose height is at most equal to the given height.
   *
   * @param height the max height
   * @return a new selector
   */
  fun maxHeight(height: Int): SizeSelector {
    return withFilter(object : Filter {
      override fun accepts(size: Size): Boolean {
        return size.height <= height
      }
    })
  }

  /**
   * Returns a new [SizeSelector] that keeps only sizes
   * whose height is at least equal to the given height.
   *
   * @param height the min height
   * @return a new selector
   */
  fun minHeight(height: Int): SizeSelector {
    return withFilter(object : Filter {
      override fun accepts(size: Size): Boolean {
        return size.height >= height
      }
    })
  }

  /**
   * Returns a new [SizeSelector] that keeps only sizes
   * which respect the given [AspectRatio]. You can pass a tolerance
   * value to include aspect ratios that are slightly different.
   *
   * @param ratio the desired aspect ratio
   * @param delta a small tolerance value
   * @return a new selector
   */
  fun aspectRatio(ratio: AspectRatio, delta: Float = 0.toFloat()): SizeSelector {
    val desired = ratio.toFloat()
    return withFilter(object : Filter {
      override fun accepts(size: Size): Boolean {
        val candidate = AspectRatio.of(size).toFloat()
        return candidate >= desired - delta && candidate <= desired + delta
      }
    })
  }

  /**
   * Returns a [SizeSelector] that will order sizes from
   * the biggest to the smallest. This means that the biggest size will be taken.
   *
   * @return a new selector
   */
  fun biggest(): SizeSelector {
    return object : SizeSelector {
      override fun select(source: List<Size>): List<Size> {
        return source.sortedWith(SizeComparator()).reversed()
      }
    }
  }

  /**
   * Returns a [SizeSelector] that will order sizes from
   * the smallest to the biggest. This means that the smallest size will be taken.
   *
   * @return a new selector
   */
  fun smallest(): SizeSelector {
    return object : SizeSelector {
      override fun select(source: List<Size>): List<Size> {
        return source.sortedWith(SizeComparator())
      }
    }
  }

  /**
   * Returns a new [SizeSelector] that keeps only sizes
   * whose area is at most equal to the given area in pixels.
   *
   * @param area the max area
   * @return a new selector
   */
  fun maxArea(area: Int): SizeSelector {
    return withFilter(object : Filter {
      override fun accepts(size: Size): Boolean {
        return size.height * size.width <= area
      }
    })
  }

  /**
   * Returns a new [SizeSelector] that keeps only sizes
   * whose area is at least equal to the given area in pixels.
   *
   * @param area the min area
   * @return a new selector
   */
  fun minArea(area: Int): SizeSelector {
    return withFilter(object : Filter {
      override fun accepts(size: Size): Boolean {
        return size.height * size.width >= area
      }
    })
  }

  /**
   * Joins all the given selectors to create a new one that returns
   * the intersection of all the inputs. Basically, all constraints are
   * respected.
   *
   * Keep in mind there is good chance that the final list will be empty.
   *
   * @param selectors input selectors
   * @return a new selector
   */
  fun and(vararg selectors: SizeSelector): SizeSelector {
    return AndSelector(*selectors)
  }

  /**
   * Creates a new [SizeSelector] that 'or's the given filters.
   * If the first selector returns an empty list, the next selector is queried,
   * and so on until a non-empty list is found.
   *
   * @param selectors input selectors
   * @return a new selector
   */
  fun or(vararg selectors: SizeSelector): SizeSelector {
    return OrSelector(*selectors)
  }


  //region private utilities

  private class FilterSelector (private val constraint: Filter) : SizeSelector {
    override fun select(source: List<Size>): List<Size> {
      return source.filter { constraint.accepts(it) }
    }
  }

  private class AndSelector (private vararg val values: SizeSelector) : SizeSelector {
    override fun select(source: List<Size>): List<Size> {
      var temp = source
      for (selector in values) {
        temp = selector.select(temp)
      }
      return temp
    }
  }

  private class OrSelector (private vararg val values: SizeSelector) : SizeSelector {
    override fun select(source: List<Size>): List<Size> {
      var temp: List<Size>? = null
      for (selector in values) {
        temp = selector.select(source)
        if (!temp.isEmpty()) {
          break
        }
      }
      return temp ?: ArrayList()
    }
  }

  //endregion
}
