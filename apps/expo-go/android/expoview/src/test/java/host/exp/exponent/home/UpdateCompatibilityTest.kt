package host.exp.exponent.home

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdateCompatibilityTest {
  @Test
  fun matchingMajorIsCompatible() {
    assertTrue(isSdkVersionCompatible("57.0.0", expoGoSdkVersion = "57.0.0"))
  }

  @Test
  fun differentMajorIsNotCompatible() {
    assertFalse(isSdkVersionCompatible("56.0.0", expoGoSdkVersion = "57.0.0"))
  }

  @Test
  fun nullSdkVersionIsNotCompatible() {
    assertFalse(isSdkVersionCompatible(null, expoGoSdkVersion = "57.0.0"))
  }

  @Test
  fun runtimeVersionStringIsNotAnSdkVersion() {
    assertFalse(isSdkVersionCompatible("exposdk:57.0.0", expoGoSdkVersion = "57.0.0"))
  }
}
