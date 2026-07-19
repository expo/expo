package expo.modules.kotlin.sharedobjects

import com.google.common.truth.Truth
import org.junit.Test

class SharedObjectTest {
  private class MySharedObject : SharedObject()
  private class MySharedRef : SharedRef<Int>(10)

  @Test
  fun `is shared object class`() {
    Truth.assertThat(Int::class.isSharedObjectClass()).isFalse()
    Truth.assertThat(MySharedRef::class.isSharedObjectClass()).isTrue()
    Truth.assertThat(MySharedObject::class.isSharedObjectClass()).isTrue()
  }

  @Test
  fun `is shared ref class`() {
    Truth.assertThat(Int::class.isSharedRefClass()).isFalse()
    Truth.assertThat(MySharedObject::class.isSharedRefClass()).isFalse()
    Truth.assertThat(MySharedRef::class.isSharedRefClass()).isTrue()
  }
}
