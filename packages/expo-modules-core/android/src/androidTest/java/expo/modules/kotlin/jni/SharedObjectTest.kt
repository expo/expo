@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedObjectId
import expo.modules.kotlin.sharedobjects.sharedObjectIdPropertyName
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Assert
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
      .runtimeHolder
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

  @Test
  fun sends_events() = withExampleSharedClass {
    val jsObject = evaluateScript(
      "sharedObject = new $moduleRef.SharedObjectExampleClass()"
    ).getObject()

    evaluateScript(
      "total = 0",
      "sharedObject.addListener('test event', (payload) => { total = payload.a + payload.b + payload.c })"
    )

    val nativeObject = jsiInterop
      .runtimeHolder
      .get()
      ?.sharedObjectRegistry
      ?.toNativeObjectOrNull(jsObject)

    nativeObject?.emit("test event", mapOf("a" to 1, "b" to 2, "c" to 3))

    val total = evaluateScript("total")

    Truth.assertThat(total.isNumber()).isTrue()
    Truth.assertThat(total.getInt()).isEqualTo(6)
  }

  @Test
  fun sends_events_with_primitive_payloads() = withExampleSharedClass {
    val jsObject = evaluateScript(
      "sharedObject = new $moduleRef.SharedObjectExampleClass()"
    ).getObject()

    evaluateScript(
      "results = []",
      "sharedObject.addListener('primitive', (payload) => { results.push(payload) })"
    )

    val nativeObject = jsiInterop
      .runtimeHolder
      .get()
      ?.sharedObjectRegistry
      ?.toNativeObjectOrNull(jsObject)

    nativeObject?.emit("primitive", 42)
    nativeObject?.emit("primitive", "hello")
    nativeObject?.emit("primitive", true)

    Truth.assertThat(evaluateScript("results.length").getInt()).isEqualTo(3)
    Truth.assertThat(evaluateScript("results[0]").getInt()).isEqualTo(42)
    Truth.assertThat(evaluateScript("results[1]").getString()).isEqualTo("hello")
    Truth.assertThat(evaluateScript("results[2]").getBool()).isTrue()
  }

  @Test
  fun does_not_crash_when_emitting_from_a_shared_object_not_associated_with_a_js_object() {
    // No runtime/JS object backing this instance, so the defensive branches in `emit` should
    // log and return cleanly without touching JSI.
    val detached = SharedObjectExampleClass()
    detached.emit("ignored")
    detached.emit("ignored", mapOf("key" to "value"))
    detached.emit("ignored", 42)
  }

  @Test
  fun should_be_able_to_throw_from_constructor() = withSingleModule({
    Class("ThrowingSharedObject") {
      Constructor {
        throw CodedException("Code", "This is a test exception", null)
      }
    }
  }) {
    val exception = evaluateScript(
      """
      let exception = null;
      try {
        new $moduleRef.ThrowingSharedObject()
      } catch (e) {
        if (e instanceof global.ExpoModulesCore_CodedError) {
          exception = e;
        }
      }
      exception
      """.trimIndent()
    ).getObject()

    Truth.assertThat(exception.getProperty("code").getString()).isEqualTo("Code")
    Truth.assertThat(exception.getProperty("message").getString()).contains("This is a test exception")
  }

  @Test
  fun should_be_able_to_return_new_instance_from_function() = withSingleModule({
    Function("createSharedObject") {
      SharedObjectExampleClass()
    }
    Class<SharedObjectExampleClass> {
      Constructor { SharedObjectExampleClass() }
    }
  }) {
    val hasCorrectPrototype = evaluateScript(
      """
      const sharedObjectFromFunction = $moduleRef.createSharedObject();
      const sharedObjectFromConstructor = new $moduleRef.SharedObjectExampleClass();
      sharedObjectFromFunction.prototype === sharedObjectFromConstructor.prototype;
      """.trimIndent()
    ).getBool()

    Truth.assertThat(hasCorrectPrototype).isTrue()
  }

  @Test
  fun should_call_start_observing_with_this() = withSingleModule({
    Class<SharedObjectExampleClass> {
      Constructor { SharedObjectExampleClass() }

      Events("event")

      Function("lastOnStartObserving") { self: SharedObjectExampleClass ->
        self.lastOnStartObserving
      }

      Function("lastOnStopObserving") { self: SharedObjectExampleClass ->
        self.lastOnStopObserving
      }
    }
  }) {
    val lastStartObserving = evaluateScript(
      """
      const sharedObject = new $moduleRef.SharedObjectExampleClass();
      global.listener = sharedObject.addListener('event', () => {});
      global.sharedObject = sharedObject;
      sharedObject.lastOnStartObserving()
      """.trimIndent()
    ).getString()

    val lastOnStopObserving = evaluateScript(
      """
      global.listener.remove();
      global.sharedObject.lastOnStopObserving()
      """.trimIndent()
    ).getString()

    Truth.assertThat(lastStartObserving).isEqualTo("event")
    Truth.assertThat(lastOnStopObserving).isEqualTo("event")
  }

  @Test
  fun rejects_an_async_call_whose_receiver_was_explicitly_released_before_the_body_ran() = withSingleModule({
    Class(SharedObjectExampleClass::class) {
      Constructor { SharedObjectExampleClass() }
      AsyncFunction("work") Coroutine { self: SharedObjectExampleClass -> 1 }
    }
  }) {
    // An explicit `release()` is the user's decision, so it takes effect at once. Only a garbage
    // collection is prevented from releasing the object while the call is pending.
    val exception = Assert.assertThrows(PromiseException::class.java) {
      waitForAsyncFunction(
        """
        (() => {
          const so = new $moduleRef.SharedObjectExampleClass();
          const promise = so.work();
          so.release();
          return promise;
        })()
        """.trimIndent()
      )
    }
    Truth.assertThat(exception.message).contains("Cannot use shared object that was already released")
  }

  @Test
  fun releases_a_shared_object_that_nothing_references() {
    ReleaseTrackingSharedObject.releaseCount = 0

    withSingleModule({
      Class(ReleaseTrackingSharedObject::class) {
        Constructor { ReleaseTrackingSharedObject() }
      }
    }) {
      evaluateScript("(() => { new $moduleRef.ReleaseTrackingSharedObject(); })()")
      val registry = requireNotNull(jsiInterop.runtimeHolder.get()?.sharedObjectRegistry)
      val weakJsObject = registry.pairs.values.single().second

      val deallocated = collectGarbage()
      val registrySize = registry.pairs.size
      val jsObjectCollected = weakJsObject.lock() == null

      Truth.assertWithMessage("The JNI hybrid of the JS object was not deallocated").that(deallocated).isGreaterThan(0)
      Truth.assertWithMessage("Hermes did not collect the JS object").that(jsObjectCollected).isTrue()
      Truth.assertWithMessage("The registry still holds the pair").that(registrySize).isEqualTo(0)
      Truth.assertThat(ReleaseTrackingSharedObject.releaseCount).isEqualTo(1)
    }
  }

  @Test
  fun keeps_the_js_object_alive_until_the_async_call_settles() {
    val gate = CompletableDeferred<Unit>()
    ReleaseTrackingSharedObject.releaseCount = 0

    withSingleModule({
      Class(ReleaseTrackingSharedObject::class) {
        Constructor { ReleaseTrackingSharedObject() }
        AsyncFunction("work") Coroutine { self: ReleaseTrackingSharedObject ->
          gate.await()
          self.wasReleased
        }
      }
    }) {
      evaluateScript(
        """
        global.result = undefined;
        (() => {
          const so = new $moduleRef.ReleaseTrackingSharedObject();
          return so.work();
        })().then(r => { global.result = r });
        """.trimIndent()
      )
      // Runs the body until it suspends on the gate.
      methodQueue.testScheduler.advanceUntilIdle()

      // The JS object is a temporary that nothing in JS references anymore.
      collectGarbage()

      Truth
        .assertWithMessage("The shared object was released while its async call was still pending")
        .that(ReleaseTrackingSharedObject.releaseCount)
        .isEqualTo(0)

      gate.complete(Unit)
      methodQueue.testScheduler.advanceUntilIdle()
      jsiInterop.drainJSEventLoop()

      Truth.assertThat(evaluateScript("global.result").getBool()).isFalse()

      // The promise is settled, so the JS object can be collected now.
      collectGarbage()

      Truth
        .assertWithMessage("The shared object should be released after the async call settled")
        .that(ReleaseTrackingSharedObject.releaseCount)
        .isEqualTo(1)
    }
  }

  @Test
  fun keeps_a_shared_object_argument_alive_until_the_async_call_settles() {
    val gate = CompletableDeferred<Unit>()
    ReleaseTrackingSharedObject.releaseCount = 0

    withSingleModule({
      Class(ReleaseTrackingSharedObject::class) {
        Constructor { ReleaseTrackingSharedObject() }
      }
      AsyncFunction("work") Coroutine { first: Int, other: ReleaseTrackingSharedObject ->
        gate.await()
        other.wasReleased
      }
    }) {
      evaluateScript(
        """
        global.result = undefined;
        (() => $moduleRef.work(1, new $moduleRef.ReleaseTrackingSharedObject()))().then(r => { global.result = r });
        """.trimIndent()
      )
      methodQueue.testScheduler.advanceUntilIdle()

      collectGarbage()

      Truth
        .assertWithMessage("The shared object argument was released while its async call was still pending")
        .that(ReleaseTrackingSharedObject.releaseCount)
        .isEqualTo(0)

      gate.complete(Unit)
      methodQueue.testScheduler.advanceUntilIdle()
      jsiInterop.drainJSEventLoop()

      Truth.assertThat(evaluateScript("global.result").getBool()).isFalse()

      collectGarbage()

      Truth.assertThat(ReleaseTrackingSharedObject.releaseCount).isEqualTo(1)
    }
  }

  /**
   * Collects the JS object of a shared object that nothing references anymore.
   * The constructor wraps the JS object in a JNI hybrid that keeps it alive until the JVM collects
   * the wrapper and the deallocator resets the hybrid. Both steps happen here, then Hermes collects.
   */
  private fun SingleTestContext.collectGarbage(): Int {
    val deallocator = requireNotNull(jsiInterop.runtimeHolder.get()?.deallocator)
    var deallocated = 0
    for (attempt in 0 until 20) {
      System.gc()
      System.runFinalization()
      deallocated += deallocator.processPendingReferences()
      if (deallocated > 0) {
        break
      }
      Thread.sleep(50)
    }
    // Hermes may run the finalizer of the native state in a later collection than the one that frees the object.
    val registry = requireNotNull(jsiInterop.runtimeHolder.get()?.sharedObjectRegistry)
    for (attempt in 0 until 10) {
      evaluateScript("gc()")
      if (registry.pairs.isEmpty()) {
        break
      }
      Thread.sleep(20)
    }
    return deallocated
  }

  private class ReleaseTrackingSharedObject : SharedObject() {
    companion object {
      @Volatile
      var releaseCount = 0
    }

    val wasReleased: Boolean
      get() = releaseCount > 0

    override fun sharedObjectDidRelease() {
      releaseCount++
    }
  }

  private class SharedObjectExampleClass : SharedObject() {
    var lastOnStartObserving = ""
    var lastOnStopObserving = ""

    override fun onStartListeningToEvent(eventName: String) {
      lastOnStartObserving = eventName
    }

    override fun onStopListeningToEvent(eventName: String) {
      lastOnStopObserving = eventName
    }
  }

  private fun withExampleSharedClass(
    block: SingleTestContext.() -> Unit
  ) = withSingleModule({
    Class(SharedObjectExampleClass::class) {
      Constructor {
        SharedObjectExampleClass()
      }
    }
  }, numberOfReloads = 1, block)
}
