package versioned.host.exp.exponent

import org.junit.Test

class VersionedUtilsTest {
  @Test
  fun isSupportedHermesBundle_plainJS_returnFalse() {
    val jsBundlePath = VersionedUtilsTest::class.java.getResource("/plain.js")?.path
    assert(jsBundlePath != null)
    assert(!VersionedUtils.isSupportedHermesBundle(jsBundlePath))
  }

  @Test
  fun isSupportedHermesBundle_hermesBytecodeBundle74_returnTrue() {
    val jsBundlePath = VersionedUtilsTest::class.java.getResource("/plain.74.hbc")?.path
    assert(jsBundlePath != null)
    assert(VersionedUtils.isSupportedHermesBundle(jsBundlePath))
  }

  @Test
  fun isSupportedHermesBundle_hermesBytecodeBundle83_returnFalse() {
    val jsBundlePath = VersionedUtilsTest::class.java.getResource("/plain.83.hbc")?.path
    assert(jsBundlePath != null)
    assert(!VersionedUtils.isSupportedHermesBundle(jsBundlePath))
  }

  @Test
  fun isSupportedHermesBundle_nullInput_returnFalse() {
    assert(!VersionedUtils.isSupportedHermesBundle(null))
    assert(!VersionedUtils.isSupportedHermesBundle(""))
  }
}