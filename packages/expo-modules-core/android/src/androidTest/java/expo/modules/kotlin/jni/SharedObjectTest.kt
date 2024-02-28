@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.sharedobjects.sharedObjectIdPropertyName
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class SharedObjectTest {
  @Test
  fun shared_object_class_should_exists() = withJSIInterop {
    val sharedObjectClass = evaluateScript("expo.SharedObject")
    Truth.assertThat(sharedObjectClass.isFunction()).isTrue()
  }

  @Test
  fun has_release_function_in_prototype() = withJSIInterop {
    val releaseFunction = evaluateScript("expo.SharedObject.prototype.release")
    Truth.assertThat(releaseFunction.isFunction()).isTrue()
  }

  @Test
  fun can_be_created() = withJSIInterop {
    val sharedObjectInstance = evaluateScript("new expo.SharedObject()")
    Truth.assertThat(sharedObjectInstance.isObject()).isTrue()
  }

  @Test
  fun inherits_from_EventEmitter() = withJSIInterop {
    val inheritsFromEventEmitter = evaluateScript("new expo.SharedObject() instanceof expo.EventEmitter")
    Truth.assertThat(inheritsFromEventEmitter.getBool()).isTrue()
  }

  @Test
  fun has_base_class_prototype() = withExampleSharedClass {
    val hasBaseClassPrototype = evaluateScript(
      "$moduleRef.SharedObjectExampleClass.prototype instanceof expo.SharedObject"
    ).getBool()
    Truth.assertThat(hasBaseClassPrototype).isTrue()
  }

  @Test
  fun can_creates_new_instance() = withExampleSharedClass {
    val sharedObject = callClass("SharedObjectExampleClass")
    Truth.assertThat(sharedObject.isObject()).isTrue()
  }

  @Test
  fun should_register() = withExampleSharedClass {
    val sharedObject = callClass("SharedObjectExampleClass")
    val sharedObjectId = sharedObject.getObject().getProperty(sharedObjectIdPropertyName).getInt()
    val containSharedObject = jsiInterop
      .appContextHolder
      .get()
      ?.sharedObjectRegistry
      ?.pairs
      ?.contains(SharedObjectId(sharedObjectId))

    Truth.assertThat(containSharedObject).isTrue()
  }

  @Test
  fun is_instance_of() = withExampleSharedClass {
    val isInstanceOf = evaluateScript(
      "sharedObject = new $moduleRef.SharedObjectExampleClass()",
      "sharedObject instanceof expo.SharedObject"
    ).getBool()
    Truth.assertThat(isInstanceOf).isTrue()
  }

  @Test
  fun has_functions_from_base_class() = withExampleSharedClass {
    val releaseFunction = evaluateScript(
      "sharedObject = new $moduleRef.SharedObjectExampleClass()",
      "sharedObject.release"
    )
    Truth.assertThat(releaseFunction.isFunction()).isTrue()
  }

  private class SharedObjectExampleClass : SharedObject()

  private fun withExampleSharedClass(
    block: SingleTestContext.() -> Unit
  ) = withSingleModule({
    Class(SharedObjectExampleClass::class) {
      Constructor {
        SharedObjectExampleClass()
      }
    }
  }, block)
}
