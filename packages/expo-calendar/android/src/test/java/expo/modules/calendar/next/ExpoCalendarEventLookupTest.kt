package expo.modules.calendar.next

import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.exceptions.EventNotFoundException
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertThrows
import org.junit.Test

class ExpoCalendarEventLookupTest {
  @Test
  fun missingEventThrowsTheNativeNotFoundError() {
    val repository = mockk<EventRepository>()
    coEvery { repository.findById(EventId(42)) } returns null

    assertThrows(EventNotFoundException::class.java) {
      runTest { ExpoCalendarEvent.findById("42", repository, mockk(), mockk()) }
    }
  }
}
