package expo.modules.ui

import org.junit.Assert.assertEquals
import org.junit.Test

class SheetViewportTest {
  @Test
  fun partialSheetReservesOnlyTheVisibleSpace() {
    val viewport = SheetViewport(sheetOffset = 1008f, windowHeight = 1920, bottomInset = 144)
    assertEquals(768, viewport.visibleHeight(frameHeight = 1632))
  }

  @Test
  fun expandedSheetDoesNotGrowBeyondItsFrame() {
    val viewport = SheetViewport(sheetOffset = 120f, windowHeight = 1920, bottomInset = 144)
    assertEquals(1632, viewport.visibleHeight(frameHeight = 1632))
  }

  @Test
  fun keyboardUsesTheSafeBottomInsteadOfAddingNavigationAgain() {
    val viewport = SheetViewport(sheetOffset = 120f, windowHeight = 1920, bottomInset = 900)
    assertEquals(900, viewport.visibleHeight(frameHeight = 1632))
  }

  @Test
  fun hiddenSheetHasNoVisibleContent() {
    val viewport = SheetViewport(sheetOffset = 1968f, windowHeight = 1920, bottomInset = 144)
    assertEquals(0, viewport.visibleHeight(frameHeight = 1632))
  }

  @Test
  fun contentOriginStaysConstantWhileLeavingTheTopInset() {
    for ((offset, position) in listOf(0f to 120, 36f to 120, 36.7f to 121, 72f to 120, 90f to 138)) {
      val viewport = SheetViewport(offset, windowHeight = 1920, bottomInset = 144, topInset = 72)
      assertEquals(48, viewport.relativeContentOffset(position))
      assertEquals(1776 - position, viewport.visibleHeight(frameHeight = 1800, contentOffset = 48))
    }
  }

  @Test
  fun fractionalDragPositionsDoNotChangeTheContentOrigin() {
    val viewport = SheetViewport(113.29297f, windowHeight = 1920, bottomInset = 144, topInset = 72)
    assertEquals(48, viewport.relativeContentOffset(contentPosition = 161))
  }
}
