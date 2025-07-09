package expo.modules.kotlin.allocators

import com.google.common.truth.Truth
import org.junit.Before
import org.junit.Test

var ctorCalls = 0

// Cannot be inline in test function, cause then it won't have the default constructor.
// Kotlin needs a way of connecting it to the function, so it'll generate constructor to do it.
class Clazz {
  init {
    ctorCalls++
  }
}

class ClazzPrivate private constructor() {
  init {
    ctorCalls++
  }
}

class ClazzWithoutDefaultCtor(@Suppress("unused") val ignored: Int) {
  val valWithValue = 20
  var varWithValue = "value"
  init {
    ctorCalls++
  }
}

class ObjectConstructorFactoryTest {
  private val ctorFactory = ObjectConstructorFactory()

  @Before
  fun before() = synchronized(this) {
    ctorCalls = 0
  }

  @Test
  fun `should invoke default constructor if possible`() = synchronized(this) {
    val instance = ctorFactory.get(Clazz::class).construct()

    Truth.assertThat(ctorCalls).isEqualTo(1)
    Truth.assertThat(instance).isInstanceOf(Clazz::class.java)
  }

  @Test
  fun `should invoke private default constructor`() = synchronized(this) {
    val instance = ctorFactory.get(ClazzPrivate::class).construct()

    Truth.assertThat(ctorCalls).isEqualTo(1)
    Truth.assertThat(instance).isInstanceOf(ClazzPrivate::class.java)
  }

  @Test
  fun `should be able construct object without default constructor`() = synchronized(this) {
    val instance = ctorFactory.get(ClazzWithoutDefaultCtor::class).construct()

    Truth.assertThat(ctorCalls).isEqualTo(0)
    Truth.assertThat(instance).isInstanceOf(ClazzWithoutDefaultCtor::class.java)
    // The init block won't be invoke in that case.
    // So properties won't be initialized.
    Truth.assertThat(instance.valWithValue).isEqualTo(0)
    Truth.assertThat(instance.varWithValue).isEqualTo(null)
  }
}
