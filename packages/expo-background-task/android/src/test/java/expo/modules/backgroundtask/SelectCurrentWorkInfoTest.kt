package expo.modules.backgroundtask

import androidx.work.WorkInfo
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.util.UUID

class SelectCurrentWorkInfoTest {
  private fun workInfo(state: WorkInfo.State) = WorkInfo(UUID.randomUUID(), state, emptySet())

  @Test
  fun `prefers a running worker over a succeeded predecessor`() {
    val running = workInfo(WorkInfo.State.RUNNING)

    assertEquals(running, selectCurrentWorkInfo(listOf(workInfo(WorkInfo.State.SUCCEEDED), running)))
  }

  @Test
  fun `prefers an enqueued worker over a succeeded predecessor`() {
    val enqueued = workInfo(WorkInfo.State.ENQUEUED)

    assertEquals(enqueued, selectCurrentWorkInfo(listOf(workInfo(WorkInfo.State.SUCCEEDED), enqueued)))
  }

  @Test
  fun `falls back to the first entry when no worker is live`() {
    val succeeded = workInfo(WorkInfo.State.SUCCEEDED)

    assertEquals(succeeded, selectCurrentWorkInfo(listOf(succeeded)))
  }

  @Test
  fun `returns null when no worker is registered`() {
    assertNull(selectCurrentWorkInfo(emptyList()))
  }
}
