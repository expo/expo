/*
 * Copyright 2020 The Android Open Source Project
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

package expo.modules.devmenu.compose.ripple

import androidx.compose.runtime.Immutable

@Immutable
public class RippleAlpha(
  public val draggedAlpha: Float,
  public val focusedAlpha: Float,
  public val hoveredAlpha: Float,
  public val pressedAlpha: Float
) {
  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is RippleAlpha) return false

    if (draggedAlpha != other.draggedAlpha) return false
    if (focusedAlpha != other.focusedAlpha) return false
    if (hoveredAlpha != other.hoveredAlpha) return false
    if (pressedAlpha != other.pressedAlpha) return false

    return true
  }

  override fun hashCode(): Int {
    var result = draggedAlpha.hashCode()
    result = 31 * result + focusedAlpha.hashCode()
    result = 31 * result + hoveredAlpha.hashCode()
    result = 31 * result + pressedAlpha.hashCode()
    return result
  }

  override fun toString(): String {
    return "RippleAlpha(draggedAlpha=$draggedAlpha, focusedAlpha=$focusedAlpha, " +
      "hoveredAlpha=$hoveredAlpha, pressedAlpha=$pressedAlpha)"
  }
}
