package expo.modules.kotlin

import com.google.common.truth.Truth
import expo.modules.kotlin.sharedobjects.SharedRef
import org.junit.Test

class KClassExtensionsTest {
  private open class MySuperRef : SharedRef<Int>(10)
  private class MyRef : MySuperRef()

  @Test
  fun `fastIsSupperClassOf works correctly`() {
    Truth.assertThat(Int::class.fastIsSupperClassOf(SharedRef(20).ref::class.java)).isTrue()
    Truth.assertThat(MySuperRef::class.fastIsSupperClassOf(MyRef::class.java)).isTrue()
    Truth.assertThat(Int::class.fastIsSupperClassOf(MyRef().ref::class.java)).isTrue()
    Truth.assertThat(Integer::class.fastIsSupperClassOf(MyRef().ref::class.java)).isTrue()
    Truth.assertThat(Number::class.fastIsSupperClassOf(MyRef().ref::class.java)).isTrue()
  }
}
