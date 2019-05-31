/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package expo.modules.camera2.utils

import android.support.v4.util.SparseArrayCompat
import android.util.Size

/**
 * Immutable class for describing proportional relationship between width and height.
 */
class AspectRatio private constructor(
  private val x: Int,
  private val y: Int
) : Comparable<AspectRatio> {

  fun matches(size: Size): Boolean {
    val gcd = gcd(size.width, size.height)
    val x = size.width / gcd
    val y = size.height / gcd
    return this.x == x && this.y == y
  }

  override fun equals(other: Any?): Boolean {
    if (other == null) {
      return false
    }
    if (this === other) {
      return true
    }
    if (other is AspectRatio) {
      val ratio = other as AspectRatio?
      return x == ratio!!.x && y == ratio.y
    }
    return false
  }

  override fun toString(): String {
    return "$x:$y"
  }

  fun toFloat(): Float {
    return x.toFloat() / y
  }

  override fun hashCode(): Int {
    // assuming most sizes are <2^16, doing a rotate will give us perfect hashing
    return y xor (x shl Integer.SIZE / 2 or x.ushr(Integer.SIZE / 2))
  }

  override fun compareTo(other: AspectRatio): Int {
    if (equals(other)) {
      return 0
    } else if (toFloat() - other.toFloat() > 0) {
      return 1
    }
    return -1
  }

  /**
   * @return The inverse of this [AspectRatio].
   */
  fun inverse(): AspectRatio {
    return of(y, x)
  }

  companion object {

    private val sCache = SparseArrayCompat<SparseArrayCompat<AspectRatio>>(16)

    /**
     * Creates an aspect ratio for the given size.
     * @param size the size
     * @return a (possibly cached) aspect ratio
     */
    fun of(size: Size): AspectRatio {
      return of(size.width, size.height)
    }

    /**
     * Returns an instance of [AspectRatio] specified by `x` and `y` values.
     * The values `x` and `` will be reduced by their greatest common divider.
     *
     * @param x The width
     * @param y The height
     * @return An instance of [AspectRatio]
     */
    fun of(x: Int, y: Int): AspectRatio {
      val gcd = gcd(x, y)
      val xGCDed = x / gcd
      val yGCDed = y / gcd
      var arrayX = sCache.get(xGCDed)
      return if (arrayX == null) {
        val ratio = AspectRatio(xGCDed, yGCDed)
        arrayX = SparseArrayCompat()
        arrayX.put(yGCDed, ratio)
        sCache.put(xGCDed, arrayX)
        ratio
      } else {
        var ratio = arrayX.get(yGCDed)
        if (ratio == null) {
          ratio = AspectRatio(xGCDed, yGCDed)
          arrayX.put(yGCDed, ratio)
        }
        ratio
      }
    }

    private fun gcd(l: Int, r: Int): Int {
      var a = l
      var b = r
      while (b != 0) {
        val c = b
        b = a % b
        a = c
      }
      return a
    }
  }
}
