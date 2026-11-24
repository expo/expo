package host.exp.exponent.home

import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.IOException

class DevSessionPollingTest {
  private val first = listOf(DevSession(description = "first", url = "exp://u.expo.dev/first", source = DevSessionSource.Snack))
  private val second = listOf(DevSession(description = "second", url = "exp://u.expo.dev/second", source = DevSessionSource.Snack))

  private fun fetchSequence(vararg results: () -> List<DevSession>): suspend () -> List<DevSession> {
    var call = 0
    return { results[call++].invoke() }
  }

  @Test
  fun keepsTheLastSessionsWhenARequestFailsWithANetworkError() = runTest {
    val fetch = fetchSequence({ first }, { throw IOException("offline") }, { second })

    val emitted = pollDevSessions(fetch = fetch).take(2).toList()

    assertEquals(listOf(first, second), emitted)
  }

  @Test
  fun clearsTheSessionsWhenSignedOut() = runTest {
    val fetch = fetchSequence({ first }, { throw IllegalStateException("Must be logged in to perform request") })

    val emitted = pollDevSessions(fetch = fetch).take(2).toList()

    assertEquals(listOf(first, emptyList<DevSession>()), emitted)
  }
}
