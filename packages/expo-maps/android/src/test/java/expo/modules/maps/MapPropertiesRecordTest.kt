package expo.modules.maps

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MapPropertiesRecordTest {
  @Test
  fun `my location stays disabled without the location permission`() {
    val record = MapPropertiesRecord(isMyLocationEnabled = true)

    val properties = record.toMapProperties(hasLocationPermission = false)

    assertFalse(properties.isMyLocationEnabled)
  }

  @Test
  fun `my location is enabled with the location permission`() {
    val record = MapPropertiesRecord(isMyLocationEnabled = true)

    val properties = record.toMapProperties(hasLocationPermission = true)

    assertTrue(properties.isMyLocationEnabled)
  }

  @Test
  fun `my location stays disabled when it was not requested`() {
    val record = MapPropertiesRecord(isMyLocationEnabled = false)

    val properties = record.toMapProperties(hasLocationPermission = true)

    assertFalse(properties.isMyLocationEnabled)
  }

  @Test
  fun `the other properties are unaffected by the location permission`() {
    val record = MapPropertiesRecord(
      isBuildingEnabled = true,
      isIndoorEnabled = true,
      isTrafficEnabled = true
    )

    val properties = record.toMapProperties(hasLocationPermission = false)

    assertTrue(properties.isBuildingEnabled)
    assertTrue(properties.isIndoorEnabled)
    assertTrue(properties.isTrafficEnabled)
  }
}
