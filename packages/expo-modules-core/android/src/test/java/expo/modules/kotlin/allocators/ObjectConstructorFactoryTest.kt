package expo.modules.kotlin.allocators

import com.google.common.truth.Truth
import org.junit.Test

var ctrCalls = 0

// Cannot be inline in test function, cause then it won't have the default constructor.
// Kotlin needs a way of connecting it to the function, so it'll generate constructor to do it.
class Clazz {
  init {
    ctrCalls++
  }
}

class ClazzPrivate private constructor() {
  init {
    ctrCalls++
  }
}

class ClazzWithoutDefaultCtr(@Suppress("unused") val ignored: Int) {
  val valWithValue = 20
  var varWithValue = "value"
  init {
    ctrCalls++
  }
}

class ObjectConstructorFactoryTest {
  private val ctrFactory = ObjectConstructorFactory()

  @Test
  fun `should invoke default constructor if possible`() = synchronized(ctrCalls) {
    ctrCalls = 0

    val instance = ctrFactory.get(Clazz::class.java).construct()

    Truth.assertThat(ctrCalls).isEqualTo(1)
    Truth.assertThat(instance).isInstanceOf(Clazz::class.java)
  }

  @Test
  fun `should invoke private default constructor`() = synchronized(ctrCalls) {
    ctrCalls = 0

    val instance = ctrFactory.get(ClazzPrivate::class.java).construct()

    Truth.assertThat(ctrCalls).isEqualTo(1)
    Truth.assertThat(instance).isInstanceOf(ClazzPrivate::class.java)
  }

  @Test
  fun `should be able construct object without default constructor`() = synchronized(ctrCalls) {
    ctrCalls = 0

    val instance = ctrFactory.get(ClazzWithoutDefaultCtr::class.java).construct()

    Truth.assertThat(ctrCalls).isEqualTo(0)
    Truth.assertThat(instance).isInstanceOf(ClazzWithoutDefaultCtr::class.java)
    // The init block won't be invoke in that case.
    // So properties won't be initialized.
    Truth.assertThat(instance.valWithValue).isEqualTo(0)
    Truth.assertThat(instance.varWithValue).isEqualTo(null)
  }
}
