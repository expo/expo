package versioned.host.exp.exponent

import org.junit.Test

class VersionedUtilsTest {
  @Test
  fun isHermesBundle_plainJS_returnFalse() {
    val jsBundlePath = VersionedUtilsTest::class.java.getResource("/plain.js")?.path
    assert(jsBundlePath != null)
    assert(!VersionedUtils.isHermesBundle(jsBundlePath))
  }

  @Test
  fun isHermesBundle_hermesBytecodeBundle74_returnTrue() {
    val jsBundlePath = VersionedUtilsTest::class.java.getResource("/plain.74.hbc")?.path
    assert(jsBundlePath != null)
    assert(VersionedUtils.isHermesBundle(jsBundlePath))
  }

  @Test
  fun isHermesBundle_nullInput_returnFalse() {
    assert(!VersionedUtils.isHermesBundle(null))
    assert(!VersionedUtils.isHermesBundle(""))
  }

  @Test
  fun getHermesBundleBytecodeVersion_plainJS_return0() {
    val jsBundlePath = VersionedUtilsTest::class.java.getResource("/plain.js")?.path
    assert(jsBundlePath != null)
    assert(VersionedUtils.getHermesBundleBytecodeVersion(jsBundlePath) == 0)
  }

  @Test
  fun getHermesBundleBytecodeVersion_hermesBytecodeBundle74_return74() {
    val jsBundlePath = VersionedUtilsTest::class.java.getResource("/plain.74.hbc")?.path
    assert(jsBundlePath != null)
    assert(VersionedUtils.getHermesBundleBytecodeVersion(jsBundlePath) == 74)
  }
}
