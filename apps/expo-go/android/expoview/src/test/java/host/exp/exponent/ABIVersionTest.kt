package host.exp.exponent

import host.exp.exponent.ABIVersion.isCompatibleSdkVersion
import host.exp.exponent.ABIVersion.majorVersion
import host.exp.exponent.ABIVersion.toNumber
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ABIVersionTest {
  @Test
  fun unversionedIsBiggerThanSdk32() {
    assert(toNumber("UNVERSIONED") > toNumber("32.0.0"))
  }

  @Test
  fun majorUpdateIsBiggerThanNone() {
    assert(toNumber("32.0.0") > toNumber("31.0.0"))
  }

  @Test
  fun minorUpdateIsBiggerThanNone() {
    assert(toNumber("32.1.0") > toNumber("32.0.0"))
  }

  @Test
  fun patchUpdateIsBiggerThanNone() {
    assert(toNumber("32.0.1") > toNumber("32.0.0"))
  }

  @Test
  fun sameVersionsAreEqual() {
    assert(toNumber("32.0.0") == toNumber("32.0.0"))
  }

  @Test
  fun minorUpdateIsBiggerThanPatchUpdate() {
    assert(toNumber("32.1.0") > toNumber("32.0.1"))
  }

  @Test
  fun majorVersionReadsTheMajorComponent() {
    assertEquals("56", majorVersion("56.0.0"))
  }

  @Test
  fun majorVersionStripsTheExpoSdkRuntimePrefix() {
    assertEquals("56", majorVersion("exposdk:56.0.0"))
  }

  @Test
  fun majorVersionOfNullIsNull() {
    assertNull(majorVersion(null))
  }

  // Regression test for the Expo Go 56.0.1 (client) vs SDK 56.0.0 (manifest) incompatibility:
  // a client patch release must still accept projects published for the same SDK major.
  @Test
  fun clientPatchReleaseIsCompatibleWithSameSdkMajor() {
    assertTrue(isCompatibleSdkVersion("56.0.1", "56.0.0"))
  }

  @Test
  fun sameVersionsAreCompatible() {
    assertTrue(isCompatibleSdkVersion("56.0.0", "56.0.0"))
  }

  @Test
  fun differentMajorsAreNotCompatible() {
    assertFalse(isCompatibleSdkVersion("56.0.0", "55.0.0"))
  }

  @Test
  fun expoSdkRuntimePrefixIsHandledOnEitherSide() {
    assertTrue(isCompatibleSdkVersion("56.0.1", "exposdk:56.0.0"))
    assertTrue(isCompatibleSdkVersion("exposdk:56.0.0", "56.0.0"))
  }

  @Test
  fun unversionedIsCompatibleWithAnything() {
    assertTrue(isCompatibleSdkVersion("56.0.0", "UNVERSIONED"))
    assertTrue(isCompatibleSdkVersion("UNVERSIONED", "56.0.0"))
  }

  @Test
  fun nullVersionsAreNotCompatible() {
    assertFalse(isCompatibleSdkVersion("56.0.0", null))
    assertFalse(isCompatibleSdkVersion(null, "56.0.0"))
  }
}
