package expo.modules.observe

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CursorRepairTest {
  @Test
  fun `cursor below max id is left alone`() = runTest {
    var stored = 5L

    repairCursorIfStale("metric", { stored }, { stored = it }, { 10L })

    assertEquals(5L, stored)
  }

  @Test
  fun `cursor equal to max id is left alone`() = runTest {
    var stored = 10L

    repairCursorIfStale("metric", { stored }, { stored = it }, { 10L })

    assertEquals(10L, stored)
  }

  @Test
  fun `cursor above max id is reset to -1`() = runTest {
    var stored = 42L

    repairCursorIfStale("metric", { stored }, { stored = it }, { 10L })

    assertEquals(-1L, stored)
  }

  @Test
  fun `non-default cursor with empty table is reset to -1`() = runTest {
    var stored = 42L

    repairCursorIfStale("metric", { stored }, { stored = it }, { null })

    assertEquals(-1L, stored)
  }

  @Test
  fun `default cursor with empty table is left alone`() = runTest {
    var readMaxIdCalled = false
    var writeCalled = false
    var stored = -1L

    repairCursorIfStale(
      "metric",
      { stored },
      {
        stored = it
        writeCalled = true
      },
      {
        readMaxIdCalled = true
        null
      }
    )

    assertEquals(-1L, stored)
    assertFalse(readMaxIdCalled)
    assertFalse(writeCalled)
  }

  @Test
  fun `readMaxId throwing leaves cursor alone`() = runTest {
    var writeCalled = false
    var stored = 42L

    repairCursorIfStale(
      "metric",
      { stored },
      {
        stored = it
        writeCalled = true
      },
      { throw TestError }
    )

    assertEquals(42L, stored)
    assertFalse(writeCalled)
  }

  private object TestError : Exception()
}
