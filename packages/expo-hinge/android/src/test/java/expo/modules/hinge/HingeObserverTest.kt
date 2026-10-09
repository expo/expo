package expo.modules.hinge

import androidx.window.layout.FoldingFeature
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HingeObserverTest {
  private val changes = mutableListOf<HingeState?>()
  private val observer = HingeObserver(sensorManager = null).apply {
    onChange = { changes.add(it) }
  }

  @Test
  fun hasNoHingeBeforeTheFirstAngle() {
    observer.updateFoldingState(FoldingFeature.State.FLAT)

    assertNull(observer.hinge)
    assertEquals(emptyList<HingeState?>(), changes)
  }

  @Test
  fun reportsUnknownStatusWhileTheWindowDoesNotSpanTheFold() {
    observer.updateAngle(12f)

    assertEquals(HingeState(12.0, HingeStatus.UNKNOWN), observer.hinge)
  }

  @Test
  fun mapsFoldingFeatureStatesToStatuses() {
    observer.updateAngle(90f)
    observer.updateFoldingState(FoldingFeature.State.HALF_OPENED)
    assertEquals(HingeState(90.0, HingeStatus.PARTIALLY_OPEN), observer.hinge)

    observer.updateAngle(180f)
    observer.updateFoldingState(FoldingFeature.State.FLAT)
    assertEquals(HingeState(180.0, HingeStatus.FULLY_OPEN), observer.hinge)

    observer.updateFoldingState(null)
    assertEquals(HingeState(180.0, HingeStatus.UNKNOWN), observer.hinge)
  }

  @Test
  fun notifiesOnlyWhenTheHingeChanges() {
    observer.updateAngle(90f)
    observer.updateAngle(90f)
    observer.updateFoldingState(FoldingFeature.State.HALF_OPENED)
    observer.updateFoldingState(FoldingFeature.State.HALF_OPENED)

    assertEquals(
      listOf(
        HingeState(90.0, HingeStatus.UNKNOWN),
        HingeState(90.0, HingeStatus.PARTIALLY_OPEN)
      ),
      changes
    )
  }

  @Test
  fun notifiesNoHingeWhenReset() {
    observer.updateAngle(90f)
    observer.reset()

    assertNull(observer.hinge)
    assertEquals(listOf(HingeState(90.0, HingeStatus.UNKNOWN), null), changes)
  }
}
