package host.exp.exponent

import host.exp.exponent.ABIVersion.toNumber
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
}
