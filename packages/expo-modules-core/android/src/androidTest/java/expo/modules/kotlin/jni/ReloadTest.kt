package expo.modules.kotlin.jni

import com.facebook.react.common.annotations.FrameworkAPI
import com.google.common.truth.Truth
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.sharedobjects.sharedObjectIdPropertyName
import org.junit.Test

@FrameworkAPI
class ReloadTest {
  @Test
  fun should_be_able_to_reload() = withSingleModule({
    Function("f1") { return@Function 20 }
    AsyncFunction("f2") {
      return@AsyncFunction 20
    }
  }, numberOfReloads = 100) {
    val f1Value = call("f1")
    Truth.assertThat(f1Value.isNumber()).isTrue()
    val unboxedF1Value = f1Value.getInt()
    Truth.assertThat(unboxedF1Value).isEqualTo(20)

    val promiseResult = callAsync("f2")
    Truth.assertThat(promiseResult.isNumber()).isTrue()
    Truth.assertThat(getLastPromiseResult().getInt()).isEqualTo(20)
  }

  @Test
  fun should_clean_all_shared_object_during_reloads() {
    class MySharedObject : SharedObject()

    val mySharedObject = MySharedObject()
    withSingleModule({
      Class(MySharedObject::class) {
        Constructor {
          return@Constructor mySharedObject
        }
      }
    }, numberOfReloads = 100) {
      val jsObject = callClass("MySharedObject").getObject()
      val id = SharedObjectId(jsObject.getProperty(sharedObjectIdPropertyName).getInt())

      val runtimeContext = jsiInterop.runtimeContextHolder.get()!!
      val (native, _) = runtimeContext.sharedObjectRegistry.pairs[id]!!
      Truth.assertThat(native).isSameInstanceAs(mySharedObject)
    }
  }
}
