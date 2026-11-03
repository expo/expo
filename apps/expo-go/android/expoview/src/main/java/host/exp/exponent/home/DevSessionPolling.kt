package host.exp.exponent.home

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.io.IOException

internal fun pollDevSessions(
  intervalMillis: Long = 3000,
  fetch: suspend () -> List<DevSession>
): Flow<List<DevSession>> = flow {
  while (true) {
    val sessions = try {
      fetch()
    } catch (e: CancellationException) {
      throw e
    } catch (_: IOException) {
      null
    } catch (_: Exception) {
      emptyList()
    }
    if (sessions != null) {
      emit(sessions)
    }
    delay(intervalMillis)
  }
}
