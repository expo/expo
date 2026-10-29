package host.exp.exponent.services

import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.exponent.storage.ExponentSharedPreferences.ExponentSharedPreferencesKey
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Test

class ExponentHistoryServiceTest {
  @Test
  fun restoreDropsItemsWithoutAManifestUrl() {
    val preferences = mockk<ExponentSharedPreferences>(relaxed = true)
    every { preferences.getString(ExponentSharedPreferencesKey.HISTORY) } returns
      """[{"a":"exp://192.168.1.1:8081","b":"Old","d":1},{"manifestUrl":"exp://192.168.1.1:8082","name":"New","timestamp":2}]"""

    val history = ExponentHistoryService(preferences).history.value

    assertEquals(listOf("exp://192.168.1.1:8082"), history.map { it.manifestUrl })
  }
}
