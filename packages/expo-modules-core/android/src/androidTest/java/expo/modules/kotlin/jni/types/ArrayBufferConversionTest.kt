@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni.types

import com.facebook.react.bridge.ReactApplicationContext
import com.google.common.truth.Truth
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.jni.ArrayBuffer
import expo.modules.kotlin.jni.ControllableJSHeapAccessExecutor
import expo.modules.kotlin.jni.JavaScriptArrayBuffer
import expo.modules.kotlin.jni.MainJSHeapAccessExecutor
import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.jni.PromiseException
import expo.modules.kotlin.jni.getPendingPromise
import expo.modules.kotlin.jni.inlineModule
import expo.modules.kotlin.jni.waitForAsyncFunction
import expo.modules.kotlin.jni.withJSIInterop
import expo.modules.kotlin.runtime.MainRuntime
import io.mockk.every
import io.mockk.mockk
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.ReadOnlyBufferException
import java.lang.ref.WeakReference
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import org.junit.Assert
import org.junit.Test

class ArrayBufferConversionTest {
  @Test
  fun copying_js_backed_array_buffer_preserves_source_scoped_access() {
    val retainedBuffer = AtomicReference<ArrayBuffer?>()
    ControllableJSHeapAccessExecutor.sameThread().use { queue ->
      withJSIInterop(
        inlineModule {
          Name("TestModule")
          Function("copyAndRetainArrayBuffer") { buffer: ArrayBuffer ->
            retainedBuffer.set(buffer)
            buffer.copy()
          }
          Function("retainedArrayBufferIsNativeBacked") {
            checkNotNull(retainedBuffer.get()).isNativeBacked()
          }
          Function("readRetainedArrayBuffer") {
            checkNotNull(retainedBuffer.get()).withJSBytes { scopedBuffer ->
              scopedBuffer.rewind()
              List(scopedBuffer.remaining()) { scopedBuffer.get().toInt() and 0xff }
            }
          }
        },
        jsHeapAccessExecutor = queue
      ) {
        try {
          val result = evaluateScript(
            """
            const original = new Uint8Array([1, 2, 3]).buffer;
            const copy = expo.modules.TestModule.copyAndRetainArrayBuffer(original);
            new Uint8Array(original)[0] = 9;
            [
              expo.modules.TestModule.retainedArrayBufferIsNativeBacked(),
              expo.modules.TestModule.readRetainedArrayBuffer(),
              Array.from(new Uint8Array(copy))
            ];
            """.trimIndent()
          ).getArray()

          Truth.assertThat(result[0].getBool()).isFalse()
          Truth.assertThat(result[1].getArray().map { it.getInt() })
            .containsExactly(9, 2, 3).inOrder()
          Truth.assertThat(result[2].getArray().map { it.getInt() })
            .containsExactly(1, 2, 3).inOrder()
        } finally {
          retainedBuffer.set(null)
        }
      }
    }
  }

  @Test
  fun cancelling_queued_mutable_js_bytes_async_access_does_not_run_its_body() {
    val taskQueued = CountDownLatch(1)
    val retainedBuffer = AtomicReference<ArrayBuffer?>()
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(afterTaskQueued = taskQueued::countDown)
    )

    try {
      withJSIInterop(
        inlineModule {
          Name("TestModule")
          Function("retainJavaScriptBackedArrayBuffer") { buffer: ArrayBuffer ->
            retainedBuffer.set(buffer)
          }
        },
        jsHeapAccessExecutor = queue
      ) { methodQueue ->
        try {
          evaluateScript(
            """
            globalThis.cancellationBuffer = new Uint8Array([1, 2, 3]).buffer;
            expo.modules.TestModule.retainJavaScriptBackedArrayBuffer(globalThis.cancellationBuffer);
            """.trimIndent()
          )
          val buffer = checkNotNull(retainedBuffer.get())
          val job = methodQueue.launch {
            buffer.withMutableJSBytesAsync { scopedBuffer ->
              scopedBuffer.put(0, 9)
            }
          }

          methodQueue.testScheduler.runCurrent()
          Truth.assertThat(taskQueued.await(5, TimeUnit.SECONDS)).isTrue()

          job.cancel()
          Truth.assertThat(job.isCancelled).isTrue()
          Truth.assertThat(queue.runAll()).isEqualTo(1)
          methodQueue.testScheduler.advanceUntilIdle()

          Truth.assertThat(job.isCancelled).isTrue()
          val bytes = evaluateScript(
            "Array.from(new Uint8Array(globalThis.cancellationBuffer))"
          ).getArray()
          Truth.assertThat(bytes.map { it.getInt() }).containsExactly(1, 2, 3).inOrder()
        } finally {
          retainedBuffer.set(null)
          queue.runAll()
        }
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun timed_out_js_backed_read_is_inert_after_its_worker_releases_the_buffer() {
    val taskQueued = CountDownLatch(1)
    val completed = CountDownLatch(1)
    val failure = AtomicReference<Throwable?>()
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(afterTaskQueued = taskQueued::countDown)
    )

    try {
      withJSIInterop(
        inlineModule {
          Name("TestModule")
          Function("readFirstByte") { buffer: ArrayBuffer -> buffer.readByte(0) }
        },
        jsHeapAccessExecutor = mainExecutor(queue, syncTimeoutMillis = 20)
      ) {
        val worker = Thread {
          try {
            evaluateScript("expo.modules.TestModule.readFirstByte(new Uint8Array([1]).buffer)")
          } catch (throwable: Throwable) {
            failure.set(throwable)
          } finally {
            completed.countDown()
          }
        }
        worker.start()

        Truth.assertThat(taskQueued.await(5, TimeUnit.SECONDS)).isTrue()
        Truth.assertThat(completed.await(5, TimeUnit.SECONDS)).isTrue()
        worker.join()
        Truth.assertThat(failure.get()).isNotNull()

        queue.runAll()
        forceGc()
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun invalidated_executor_cancels_queued_js_backed_sync_access() {
    val taskQueued = CountDownLatch(1)
    val completed = CountDownLatch(1)
    val failure = AtomicReference<Throwable?>()
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(afterTaskQueued = taskQueued::countDown)
    )

    try {
      withJSIInterop(
        nativeBackedArrayBufferModule(),
        jsHeapAccessExecutor = queue
      ) {
        val worker = Thread {
          try {
            evaluateScript("expo.modules.TestModule.readFirstByte(new Uint8Array([1]).buffer)")
          } catch (throwable: Throwable) {
            failure.set(throwable)
          } finally {
            completed.countDown()
          }
        }
        worker.start()

        Truth.assertThat(taskQueued.await(5, TimeUnit.SECONDS)).isTrue()
        queue.invalidate()

        Truth.assertThat(completed.await(5, TimeUnit.SECONDS)).isTrue()
        worker.join()
        Truth.assertThat(failure.get()).isInstanceOf(CodedException::class.java)
        Truth.assertThat(queue.runAll()).isEqualTo(0)
        Truth.assertThat(queue.executedTaskCount).isEqualTo(0)
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun invalidated_executor_rejects_queued_js_backed_async_access() {
    val taskQueued = CountDownLatch(1)
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(afterTaskQueued = taskQueued::countDown)
    )

    try {
      withJSIInterop(nativeBackedArrayBufferModule(), jsHeapAccessExecutor = queue) { methodQueue ->
        evaluateScript(
          """
          delete global.promiseResult
          delete global.promiseError
          expo.modules.TestModule.readWithJSBytesAsync(new Uint8Array([1]).buffer, 1)
            .then(result => global.promiseResult = result)
            .catch(error => global.promiseError = error)
          """.trimIndent()
        )
        methodQueue.testScheduler.advanceUntilIdle()
        Truth.assertThat(taskQueued.await(5, TimeUnit.SECONDS)).isTrue()
        queue.invalidate()

        methodQueue.testScheduler.advanceUntilIdle()
        drainJSEventLoop()
        val failure = Assert.assertThrows(PromiseException::class.java) {
          getPendingPromise()
        }
        Truth.assertThat(failure.message).contains("runtime is shutting down")
        Truth.assertThat(queue.runAll()).isEqualTo(0)
        Truth.assertThat(queue.executedTaskCount).isEqualTo(0)
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun main_runtime_teardown_cancels_queued_js_backed_async_access_once() {
    val taskQueued = CountDownLatch(1)
    val cancelled = AtomicInteger()
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(
        afterTaskQueued = taskQueued::countDown,
        beforeTaskCancellation = cancelled::incrementAndGet
      )
    )
    val runtime = MainRuntime(mockk(), WeakReference(mockk<ReactApplicationContext>()))

    try {
      withJSIInterop(nativeBackedArrayBufferModule(), jsHeapAccessExecutor = queue) { methodQueue ->
        runtime.jsiContext = this
        evaluateScript(
          """
          globalThis.teardownAccessErrors = 0
          expo.modules.TestModule.readWithJSBytesAsync(new Uint8Array([1]).buffer, 1)
            .then(() => globalThis.teardownAccessCompleted = true)
            .catch(error => {
              globalThis.teardownAccessErrors += 1
              globalThis.teardownAccessError = error.message
            })
          """.trimIndent()
        )
        methodQueue.testScheduler.advanceUntilIdle()
        Truth.assertThat(taskQueued.await(5, TimeUnit.SECONDS)).isTrue()

        runtime.deallocate()

        methodQueue.testScheduler.advanceUntilIdle()
        drainJSEventLoop()
        Truth.assertThat(evaluateScript("globalThis.teardownAccessErrors").getInt()).isEqualTo(1)
        Truth.assertThat(evaluateScript("globalThis.teardownAccessCompleted").isUndefined()).isTrue()
        Truth.assertThat(evaluateScript("globalThis.teardownAccessError").getString()).contains("runtime is shutting down")
        Truth.assertThat(cancelled.get()).isEqualTo(1)
        Truth.assertThat(queue.runAll()).isEqualTo(0)
        Truth.assertThat(queue.executedTaskCount).isEqualTo(0)
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun rejecting_new_work_rejects_js_backed_async_access_without_mutating_its_source() {
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained()

    try {
      withJSIInterop(nativeBackedArrayBufferModule(), jsHeapAccessExecutor = queue) { methodQueue ->
        queue.rejectNewWork()
        evaluateScript(
          """
          delete global.promiseResult
          delete global.promiseError
          globalThis.rejectedWorkBuffer = new Uint8Array([1, 2, 3]).buffer;
          expo.modules.TestModule.fillWithMutableJSBytesAsync(globalThis.rejectedWorkBuffer, 9)
            .then(result => global.promiseResult = result)
            .catch(error => global.promiseError = error)
          """.trimIndent()
        )

        methodQueue.testScheduler.advanceUntilIdle()
        drainJSEventLoop()

        val failure = Assert.assertThrows(PromiseException::class.java) {
          getPendingPromise()
        }
        Truth.assertThat(failure.message).contains("runtime is shutting down")
        val bytes = evaluateScript(
          "Array.from(new Uint8Array(globalThis.rejectedWorkBuffer))"
        ).getArray()
        Truth.assertThat(bytes.map { it.getInt() }).containsExactly(1, 2, 3).inOrder()
        Truth.assertThat(queue.runAll()).isEqualTo(0)
        Truth.assertThat(queue.executedTaskCount).isEqualTo(0)
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun js_backed_conversion_uses_installed_heap_executor_during_teardown() {
    ControllableJSHeapAccessExecutor.sameThread().use { executor ->
      withJSIInterop(
        nativeBackedArrayBufferModule(),
        jsHeapAccessExecutor = executor
      ) {
        val result = evaluateScript(
          """
          const value = new Uint8Array([1, 2, 3]).buffer
          expo.modules.TestModule.isArrayBufferNativeBacked(value)
          """.trimIndent()
        )
        Truth.assertThat(result.getBool()).isFalse()
      }
      Truth.assertThat(executor.executedTaskCount).isGreaterThan(0)
    }
  }

  @Test
  fun js_backed_buffer_finalization_does_not_wait_for_a_blocked_js_queue() {
    val queueStarted = CountDownLatch(1)
    val allowQueueDrain = CountDownLatch(1)
    val releaseQueued = CountDownLatch(1)
    val releaseCancelled = CountDownLatch(1)
    val finalizationCompleted = CountDownLatch(1)
    val retainedBuffer = AtomicReference<ArrayBuffer?>()
    val queuedTaskCount = AtomicInteger()
    val executor = ControllableJSHeapAccessExecutor.dedicatedThread(
      ControllableJSHeapAccessExecutor.LifecycleHooks(
        afterTaskQueued = {
          if (queuedTaskCount.incrementAndGet() == 2) {
            releaseQueued.countDown()
          }
        },
        beforeTaskCancellation = releaseCancelled::countDown
      )
    )
    var finalizer: Thread? = null

    try {
      Truth.assertThat(
        executor.runOnQueue(
          Runnable {
            queueStarted.countDown()
            allowQueueDrain.await()
          },
          Runnable { allowQueueDrain.countDown() }
        )
      ).isTrue()
      Truth.assertThat(queueStarted.await(5, TimeUnit.SECONDS)).isTrue()

      withJSIInterop(
        inlineModule {
          Name("TestModule")
          Function("retainJavaScriptBackedBuffer") { buffer: ArrayBuffer ->
            retainedBuffer.set(buffer)
          }
        },
        jsHeapAccessExecutor = executor
      ) {
        evaluateScript(
          "expo.modules.TestModule.retainJavaScriptBackedBuffer(new Uint8Array([1]).buffer)"
        )

        finalizer = Thread {
          retainedBuffer.set(null)
          forceGc()
          finalizationCompleted.countDown()
        }
        finalizer.start()

        Truth.assertThat(releaseQueued.await(5, TimeUnit.SECONDS)).isTrue()
        Truth.assertThat(finalizationCompleted.await(5, TimeUnit.SECONDS)).isTrue()
      }

      executor.invalidate()
      Truth.assertThat(releaseCancelled.await(5, TimeUnit.SECONDS)).isTrue()
    } finally {
      retainedBuffer.set(null)
      allowQueueDrain.countDown()
      executor.close()
      finalizer?.join(5_000)
    }
  }

  @Test
  fun js_backed_buffer_finalization_releases_on_a_live_js_queue() {
    val releaseQueued = CountDownLatch(1)
    val finalizationCompleted = CountDownLatch(1)
    val retainedBuffer = AtomicReference<ArrayBuffer?>()
    val executor = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(afterTaskQueued = releaseQueued::countDown)
    )
    var finalizer: Thread? = null

    try {
      withJSIInterop(
        inlineModule {
          Name("TestModule")
          Function("retainJavaScriptBackedBuffer") { buffer: ArrayBuffer ->
            retainedBuffer.set(buffer)
          }
        },
        jsHeapAccessExecutor = executor
      ) {
        finalizer = Thread {
          retainedBuffer.set(null)
          forceGc()
          finalizationCompleted.countDown()
        }

        evaluateScript(
          "expo.modules.TestModule.retainJavaScriptBackedBuffer(new Uint8Array([1]).buffer)"
        )
        finalizer.start()

        try {
          Truth.assertThat(releaseQueued.await(5, TimeUnit.SECONDS)).isTrue()
          Truth.assertThat(finalizationCompleted.await(5, TimeUnit.SECONDS)).isTrue()
          Truth.assertThat(executor.executedTaskCount).isEqualTo(0)
          Truth.assertThat(executor.runAll()).isEqualTo(1)
          Truth.assertThat(executor.executedTaskCount).isEqualTo(1)
        } finally {
          executor.runAll()
          finalizer.join(5_000)
        }
      }
    } finally {
      retainedBuffer.set(null)
      executor.close()
    }
  }

  @Test
  fun concurrent_js_backed_materialization_publishes_once_without_blocking_snapshots() {
    val firstTaskQueued = CountDownLatch(1)
    val readerTaskQueued = CountDownLatch(1)
    val secondTaskQueued = CountDownLatch(1)
    val queuedTaskCount = AtomicInteger()
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(
        afterTaskQueued = {
          when (queuedTaskCount.incrementAndGet()) {
            1 -> firstTaskQueued.countDown()
            2 -> readerTaskQueued.countDown()
            3 -> secondTaskQueued.countDown()
          }
        }
      )
    )
    val retainedBuffer = AtomicReference<ArrayBuffer?>()
    val failure = AtomicReference<Throwable?>()
    val firstResult = AtomicReference<ByteBuffer?>()
    val secondResult = AtomicReference<ByteBuffer?>()
    val readResult = AtomicReference<Byte?>()
    val firstCompleted = CountDownLatch(1)
    val readCompleted = CountDownLatch(1)
    val secondCompleted = CountDownLatch(1)
    var first: Thread? = null
    var reader: Thread? = null
    var second: Thread? = null

    try {
      withJSIInterop(
        retainingJavaScriptBackedArrayBufferModule(retainedBuffer),
        jsHeapAccessExecutor = queue
      ) {
        try {
          evaluateScript(
            "expo.modules.TestModule.retainJavaScriptBackedArrayBuffer(new Uint8Array([1, 2, 3, 4]).buffer)"
          )
          val buffer = checkNotNull(retainedBuffer.get())

          first = Thread {
            try {
              firstResult.set(buffer.toDirectBuffer())
            } catch (throwable: Throwable) {
              failure.compareAndSet(null, throwable)
            } finally {
              firstCompleted.countDown()
            }
          }
          first.start()
          Truth.assertThat(firstTaskQueued.await(5, TimeUnit.SECONDS)).isTrue()

          Truth.assertThat(buffer.size()).isEqualTo(4)
          Truth.assertThat(buffer.isNativeBacked()).isFalse()

          reader = Thread {
            try {
              readResult.set(buffer.readByte(0))
            } catch (throwable: Throwable) {
              failure.compareAndSet(null, throwable)
            } finally {
              readCompleted.countDown()
            }
          }
          reader.start()
          Truth.assertThat(readerTaskQueued.await(5, TimeUnit.SECONDS)).isTrue()

          second = Thread {
            try {
              secondResult.set(buffer.toDirectBuffer())
            } catch (throwable: Throwable) {
              failure.compareAndSet(null, throwable)
            } finally {
              secondCompleted.countDown()
            }
          }
          second.start()
          Truth.assertThat(secondTaskQueued.await(5, TimeUnit.SECONDS)).isTrue()

          // The second direct-buffer call completes before the first queued materializer.
          Truth.assertThat(queue.runLast()).isTrue()
          Truth.assertThat(secondCompleted.await(5, TimeUnit.SECONDS)).isTrue()
          second.join()

          Truth.assertThat(queue.runNext()).isTrue()
          Truth.assertThat(firstCompleted.await(5, TimeUnit.SECONDS)).isTrue()
          first.join()

          Truth.assertThat(queue.runNext()).isTrue()
          Truth.assertThat(readCompleted.await(5, TimeUnit.SECONDS)).isTrue()
          reader.join()

          Truth.assertThat(failure.get()).isNull()
          Truth.assertThat(readResult.get()).isEqualTo(1.toByte())
          firstResult.get()!!.put(0, 9.toByte())
          Truth.assertThat(secondResult.get()!!.get(0)).isEqualTo(9.toByte())
          Truth.assertThat(buffer.size()).isEqualTo(4)
          Truth.assertThat(buffer.isNativeBacked()).isTrue()
          Truth.assertThat(queue.executedTaskCount).isEqualTo(3)
        } finally {
          queue.runAll()
          first?.join(5_000)
          reader?.join(5_000)
          second?.join(5_000)
          retainedBuffer.set(null)
          forceGc()
          queue.runAll()
        }
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun first_primitive_read_materializes_js_backed_storage_once() {
    val firstTaskQueued = CountDownLatch(1)
    val queue = ControllableJSHeapAccessExecutor.manuallyDrained(
      ControllableJSHeapAccessExecutor.LifecycleHooks(afterTaskQueued = firstTaskQueued::countDown)
    )
    val retainedBuffer = AtomicReference<ArrayBuffer?>()
    val failure = AtomicReference<Throwable?>()
    val firstRead = AtomicReference<Byte?>()
    val firstReadCompleted = CountDownLatch(1)
    val laterReadsCompleted = CountDownLatch(4)
    var firstReader: Thread? = null
    var laterReaders: List<Thread> = emptyList()

    try {
      withJSIInterop(
        retainingJavaScriptBackedArrayBufferModule(retainedBuffer),
        jsHeapAccessExecutor = queue
      ) {
        try {
          evaluateScript(
            "expo.modules.TestModule.retainJavaScriptBackedArrayBuffer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer)"
          )
          val buffer = checkNotNull(retainedBuffer.get())

          firstReader = Thread {
            try {
              firstRead.set(buffer.readByte(0))
            } catch (throwable: Throwable) {
              failure.compareAndSet(null, throwable)
            } finally {
              firstReadCompleted.countDown()
            }
          }
          firstReader.start()

          Truth.assertThat(firstTaskQueued.await(5, TimeUnit.SECONDS)).isTrue()
          Truth.assertThat(queue.runNext()).isTrue()
          Truth.assertThat(firstReadCompleted.await(5, TimeUnit.SECONDS)).isTrue()
          firstReader.join()
          Truth.assertThat(firstRead.get()).isEqualTo(1.toByte())
          Truth.assertThat(failure.get()).isNull()
          Truth.assertThat(queue.executedTaskCount).isEqualTo(1)

          laterReaders = listOf(
            Thread {
              try {
                buffer.readByte(1)
              } catch (throwable: Throwable) {
                failure.compareAndSet(null, throwable)
              } finally {
                laterReadsCompleted.countDown()
              }
            },
            Thread {
              try {
                buffer.read2Byte(0)
              } catch (throwable: Throwable) {
                failure.compareAndSet(null, throwable)
              } finally {
                laterReadsCompleted.countDown()
              }
            },
            Thread {
              try {
                buffer.read4Byte(0)
              } catch (throwable: Throwable) {
                failure.compareAndSet(null, throwable)
              } finally {
                laterReadsCompleted.countDown()
              }
            },
            Thread {
              try {
                buffer.read8Byte(0)
              } catch (throwable: Throwable) {
                failure.compareAndSet(null, throwable)
              } finally {
                laterReadsCompleted.countDown()
              }
            }
          )
          laterReaders.forEach(Thread::start)

          Truth.assertThat(laterReadsCompleted.await(5, TimeUnit.SECONDS)).isTrue()
          laterReaders.forEach { it.join() }
          Truth.assertThat(failure.get()).isNull()
          Truth.assertThat(queue.executedTaskCount).isEqualTo(1)
        } finally {
          queue.runAll()
          firstReader?.join(5_000)
          laterReaders.forEach { it.join(5_000) }
          retainedBuffer.set(null)
          forceGc()
          queue.runAll()
        }
      }
    } finally {
      queue.close()
    }
  }

  @Test
  fun array_buffer_should_be_convertible() = conversionTest<ArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.isNativeBacked()).isTrue()
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
      Truth.assertThat(arrayBuffer.read2Byte(0)).isEqualTo(-256)
      Truth.assertThat(arrayBuffer.isNativeBacked()).isTrue()
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun array_buffer_should_be_returned() = conversionTest<ArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.isNativeBacked()).isTrue()
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
      Truth.assertThat(arrayBuffer.isNativeBacked()).isTrue()
    },
    map = { it },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getObject().isArrayBuffer()).isTrue()

      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
    }
  )

  @Test
  fun array_buffer_arg_should_be_a_copy_for_js_allocated_array_buffer() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("conversionTest") { buffer: ArrayBuffer ->
        buffer.toDirectBuffer().apply {
          rewind()
          put(0x42.toByte())
        }
        return@Function buffer
      }
    }
  ) {
    val (original, copied) = evaluateScript(
      """
        const originalBuffer = new Uint8Array([1, 2]).buffer;
        const copiedBuffer = expo.modules.TestModule.conversionTest(originalBuffer);
        [originalBuffer, copiedBuffer]
      """.trimIndent()
    ).getArray()

    val originalBuffer = original.getObject().getArrayBuffer()
    val copiedBuffer = copied.getObject().getArrayBuffer()

    Truth.assertThat(originalBuffer.readByte(0)).isEqualTo(1.toByte())
    Truth.assertThat(copiedBuffer.readByte(0)).isEqualTo(0x42.toByte())
  }

  @Test
  fun array_buffer_arg_should_share_native_backed_array_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createArrayBuffer(4);
        const view = new Uint8Array(buffer);
        view.fill(1);
        const isNativeBacked = expo.modules.TestModule.isArrayBufferNativeBacked(buffer);
        const processedBuffer = expo.modules.TestModule.fillArrayBuffer(buffer, 0x42);
        [isNativeBacked, Array.from(view), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getBool()).isTrue()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
    Truth.assertThat(result[2].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
  }

  @Test
  fun array_buffer_typed_array_arg_should_share_native_backed_view_range() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createArrayBuffer(5);
        const fullView = new Uint8Array(buffer);
        fullView.set([1, 2, 3, 4, 5]);
        const partialView = new Uint8Array(buffer, 1, 2);
        const isNativeBacked = expo.modules.TestModule.isArrayBufferNativeBacked(partialView);
        const processedBuffer = expo.modules.TestModule.fillArrayBuffer(partialView, 0x42);
        [isNativeBacked, Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getBool()).isTrue()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(1, 0x42, 0x42, 4, 5).inOrder()
    Truth.assertThat(result[2].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  @Test
  fun direct_buffer_from_native_backed_typed_array_view_outlives_array_buffer_wrapper() {
    val directBuffer = AtomicReference<ByteBuffer?>()
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("createArrayBuffer") { size: Int ->
          ArrayBuffer.allocate(size)
        }
        Function("escapeDirectBuffer") { buffer: ArrayBuffer ->
          directBuffer.set(buffer.toDirectBuffer())
        }
      }
    ) {
      evaluateScript(
        """
          (() => {
            const source = expo.modules.TestModule.createArrayBuffer(5);
            new Uint8Array(source).set([1, 2, 3, 4, 5]);
            expo.modules.TestModule.escapeDirectBuffer(new Uint8Array(source, 1, 3));
          })();
        """.trimIndent()
      )
    }

    forceGc()

    val bytes = directBuffer.get()!!.apply { rewind() }.let { buffer ->
      List(buffer.remaining()) { buffer.get().toInt() and 0xff }
    }
    Truth.assertThat(bytes).containsExactly(2, 3, 4).inOrder()
  }

  @Test
  fun array_buffer_typed_array_arg_should_copy_js_allocated_view_without_js_heap_executor() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        const fullView = new Uint8Array(buffer);
        const partialView = new Uint8Array(buffer, 1, 2);
        const isNativeBacked = expo.modules.TestModule.isArrayBufferNativeBacked(partialView);
        const processedBuffer = expo.modules.TestModule.fillArrayBuffer(partialView, 0x42);
        [isNativeBacked, Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getBool()).isTrue()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(1, 2, 3, 4, 5).inOrder()
    Truth.assertThat(result[2].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  @Test
  fun array_buffer_with_js_bytes_reads_copied_js_array_buffer_without_js_heap_executor() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
        const view = new Uint8Array(buffer);
        const initialBytes = expo.modules.TestModule.readWithJSBytes(buffer, 4);
        view[0] = 9;
        const updatedBytes = expo.modules.TestModule.readWithJSBytes(buffer, 4);
        [initialBytes, updatedBytes, expo.modules.TestModule.isArrayBufferNativeBacked(buffer)]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 2, 3, 4).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(9, 2, 3, 4).inOrder()
    Truth.assertThat(result[2].getBool()).isTrue()
  }

  @Test
  fun array_buffer_with_js_bytes_reads_copied_js_typed_array_view_range() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        const view = new Uint8Array(buffer, 1, 2);
        expo.modules.TestModule.readWithJSBytes(view, 2);
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result.map { it.getInt() }).containsExactly(2, 3).inOrder()
  }

  @Test
  fun array_buffer_with_js_bytes_provides_read_only_byte_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
        expo.modules.TestModule.inspectWithJSBytes(buffer);
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result.map { it.getBool() }).containsExactly(true, true, true, true).inOrder()
  }

  @Test
  fun array_buffer_with_mutable_js_bytes_provides_writable_byte_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
        expo.modules.TestModule.inspectWithMutableJSBytes(buffer);
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result.map { it.getBool() }).containsExactly(true, false, true, true).inOrder()
  }

  @Test
  fun array_buffer_with_mutable_js_bytes_does_not_mutate_original_js_array_buffer_without_js_heap_executor() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
        expo.modules.TestModule.fillWithMutableJSBytes(buffer, 7);
        Array.from(new Uint8Array(buffer));
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result.map { it.getInt() }).containsExactly(1, 2, 3, 4).inOrder()
  }

  @Test
  fun array_buffer_with_mutable_js_bytes_does_not_mutate_original_js_typed_array_view_without_js_heap_executor() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        const view = new Uint8Array(buffer, 1, 2);
        expo.modules.TestModule.fillWithMutableJSBytes(view, 7);
        Array.from(new Uint8Array(buffer));
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result.map { it.getInt() }).containsExactly(1, 2, 3, 4, 5).inOrder()
  }

  @Test
  fun array_buffer_with_js_bytes_async_reads_copied_js_array_buffer_without_js_heap_executor() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) { methodQueue ->
    val result = waitForAsyncFunction(
      methodQueue,
      """
        (() => {
          const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
          const view = new Uint8Array(buffer);
          return expo.modules.TestModule.readWithJSBytesAsync(buffer, 4).then(initialBytes => {
            view[0] = 9;
            return expo.modules.TestModule.readWithJSBytesAsync(buffer, 4).then(updatedBytes => {
              return [initialBytes, updatedBytes, expo.modules.TestModule.isArrayBufferNativeBacked(buffer)];
            });
          });
        })()
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 2, 3, 4).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(9, 2, 3, 4).inOrder()
    Truth.assertThat(result[2].getBool()).isTrue()
  }

  @Test
  fun array_buffer_with_mutable_js_bytes_async_does_not_mutate_original_js_typed_array_view_without_js_heap_executor() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) { methodQueue ->
    val result = waitForAsyncFunction(
      methodQueue,
      """
        (() => {
          const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
          const view = new Uint8Array(buffer, 1, 2);
          return expo.modules.TestModule.fillWithMutableJSBytesAsync(view, 7).then(() => Array.from(new Uint8Array(buffer)));
        })()
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result.map { it.getInt() }).containsExactly(1, 2, 3, 4, 5).inOrder()
  }

  @Test
  fun array_buffer_scoped_js_bytes_work_for_native_backed_storage() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createArrayBuffer(3);
        new Uint8Array(buffer).set([1, 2, 3]);
        const initialBytes = expo.modules.TestModule.readWithJSBytes(buffer, 3);
        expo.modules.TestModule.fillWithMutableJSBytes(buffer, 8);
        [initialBytes, Array.from(new Uint8Array(buffer)), expo.modules.TestModule.isArrayBufferNativeBacked(buffer)];
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 2, 3).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(8, 8, 8).inOrder()
    Truth.assertThat(result[2].getBool()).isTrue()
  }

  @Test
  fun array_buffer_unscoped_direct_buffer_access_does_not_mutate_original_js_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
        const processedBuffer = expo.modules.TestModule.fillArrayBuffer(buffer, 0x42);
        [Array.from(new Uint8Array(buffer)), Array.from(new Uint8Array(processedBuffer))];
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 2, 3, 4).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
  }

  @Test
  fun array_buffer_returning_empty_js_buffer_preserves_identity_with_js_heap_executor() {
    ControllableJSHeapAccessExecutor.sameThread().use { executor ->
      withJSIInterop(nativeBackedArrayBufferModule(), jsHeapAccessExecutor = executor) {
        val result = evaluateScript(
          """
            const buffer = new ArrayBuffer(0);
            expo.modules.TestModule.returnArrayBuffer(buffer) === buffer;
          """.trimIndent()
        )

        Truth.assertThat(result.getBool()).isTrue()
      }
    }
  }

  @Test
  fun array_buffer_returning_full_range_js_typed_array_view_preserves_identity_with_js_heap_executor() {
    ControllableJSHeapAccessExecutor.sameThread().use { executor ->
      withJSIInterop(nativeBackedArrayBufferModule(), jsHeapAccessExecutor = executor) {
        val result = evaluateScript(
          """
            const buffer = new Uint8Array([1, 2, 3]).buffer;
            const view = new Uint8Array(buffer);
            expo.modules.TestModule.returnArrayBuffer(view) === buffer;
          """.trimIndent()
        )

        Truth.assertThat(result.getBool()).isTrue()
      }
    }
  }

  @Test
  fun array_buffer_returning_empty_js_typed_array_view_preserves_visible_range_with_js_heap_executor() {
    ControllableJSHeapAccessExecutor.sameThread().use { executor ->
      withJSIInterop(nativeBackedArrayBufferModule(), jsHeapAccessExecutor = executor) {
        val result = evaluateScript(
          """
            const buffer = new Uint8Array([1, 2, 3]).buffer;
            const view = new Uint8Array(buffer, 2, 0);
            const returned = expo.modules.TestModule.returnArrayBuffer(view);
            [returned === buffer, returned.byteLength, Array.from(new Uint8Array(returned))];
          """.trimIndent()
        ).getArray()

        Truth.assertThat(result[0].getBool()).isFalse()
        Truth.assertThat(result[1].getInt()).isEqualTo(0)
        Truth.assertThat(result[2].getArray()).isEmpty()
      }
    }
  }

  @Test
  fun array_buffer_returning_copied_js_buffer_does_not_preserve_identity_without_js_heap_executor() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
        expo.modules.TestModule.returnArrayBuffer(buffer) === buffer;
      """.trimIndent()
    )

    Truth.assertThat(result.getBool()).isFalse()
  }

  @Test
  fun array_buffer_returning_copied_typed_array_view_returns_visible_range_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        const view = new Uint8Array(buffer, 1, 2);
        const returned = expo.modules.TestModule.returnArrayBuffer(view);
        [returned === buffer, Array.from(new Uint8Array(returned))];
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getBool()).isFalse()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(2, 3).inOrder()
  }

  @Test
  fun java_script_object_get_array_buffer_should_still_return_legacy_js_array_buffer() = withJSIInterop {
    val jsObject = evaluateScript("new Uint8Array([1, 2, 3]).buffer").getObject()
    val arrayBuffer: JavaScriptArrayBuffer = jsObject.getArrayBuffer()

    Truth.assertThat(arrayBuffer.size()).isEqualTo(3)
    Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(1.toByte())
  }

  @Test
  fun js_array_buffer_should_be_convertible() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
      Truth.assertThat(arrayBuffer.read2Byte(0)).isEqualTo(-256)
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun js_array_buffer_accepts_full_typed_array() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff])",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun js_array_buffer_accepts_partial_typed_array_view() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array(new Uint8Array([1,2,3,4,5]).buffer, 1, 2)",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(2.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(3.toByte())
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun native_array_buffer_accepts_partial_typed_array_view() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array(new Uint8Array([1,2,3,4,5]).buffer, 1, 2)",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(2.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(3.toByte())
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun js_array_buffer_should_be_returned() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
    },
    map = { it },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getObject().isArrayBuffer()).isTrue()

      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
    }
  )

  @Test
  fun js_array_buffer_can_be_modified() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())

      arrayBuffer.toDirectBuffer().apply {
        rewind()
        put(0x42.toByte())
      }
    },
    map = { it },
    jsAssertion = { jsValue ->
      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x42.toByte())
    }
  )

  @Test
  fun native_array_buffer_should_be_convertible() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
      Truth.assertThat(arrayBuffer.read2Byte(0)).isEqualTo(-256)
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun native_array_buffer_should_be_returned() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
    },
    map = { it },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getObject().isArrayBuffer()).isTrue()

      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
    }
  )

  @Test
  fun native_array_buffer_can_be_modified() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())

      arrayBuffer.toDirectBuffer().apply {
        rewind()
        put(0x42.toByte())
      }
    },
    map = { it },
    jsAssertion = { jsValue ->
      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x42.toByte())
    }
  )

  @Test
  fun native_array_buffer_arg_should_be_a_copy() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("conversionTest") { buffer: NativeArrayBuffer ->
        buffer.toDirectBuffer().apply {
          rewind()
          put(0x42.toByte())
        }
        return@Function buffer
      }
    }
  ) {
    val (original, copied) = evaluateScript(
      """
        const originalBuffer = new Uint8Array([1, 2]).buffer;
        const copiedBuffer = expo.modules.TestModule.conversionTest(originalBuffer);
        [originalBuffer, copiedBuffer]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(original.getObject().isArrayBuffer()).isTrue()
    Truth.assertThat(copied.getObject().isArrayBuffer()).isTrue()

    val originalBuffer = original.getObject().getArrayBuffer()
    val copiedBuffer = copied.getObject().getArrayBuffer()

    Truth.assertThat(originalBuffer.readByte(0)).isEqualTo(1.toByte())
    Truth.assertThat(copiedBuffer.readByte(0)).isEqualTo(0x42.toByte())
  }

  @Test
  fun native_array_buffer_arg_should_share_native_backed_array_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createNative(4);
        const view = new Uint8Array(buffer);
        view.fill(1);
        const processedBuffer = expo.modules.TestModule.fillNativeBuffer(buffer, 0x42);
        [Array.from(view), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
  }

  @Test
  fun returned_native_backed_array_buffer_should_outlive_native_argument_wrapper() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    evaluateScript(
      """
        globalThis.retainedBuffer = (() => {
          const sourceBuffer = expo.modules.TestModule.createNative(4);
          new Uint8Array(sourceBuffer).set([1, 2, 3, 4]);
          return expo.modules.TestModule.fillNativeBuffer(sourceBuffer, 0x42);
        })();
      """.trimIndent()
    )

    forceGc()

    val result = evaluateScript("Array.from(new Uint8Array(globalThis.retainedBuffer))").getArray()
    Truth.assertThat(result.map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
  }

  @Test
  fun native_array_buffer_typed_array_arg_should_share_native_backed_view_range() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createNative(5);
        const fullView = new Uint8Array(buffer);
        fullView.set([1, 2, 3, 4, 5]);
        const partialView = new Uint8Array(buffer, 1, 2);
        const processedBuffer = expo.modules.TestModule.fillNativeBuffer(partialView, 0x42);
        [Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 0x42, 0x42, 4, 5).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  @Test
  fun native_array_buffer_typed_array_arg_should_copy_js_allocated_view() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        const fullView = new Uint8Array(buffer);
        const partialView = new Uint8Array(buffer, 1, 2);
        const processedBuffer = expo.modules.TestModule.fillNativeBuffer(partialView, 0x42);
        [Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 2, 3, 4, 5).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  private fun nativeBackedArrayBufferModule() = inlineModule {
    Name("TestModule")

    Function("createNative") { size: Int ->
      NativeArrayBuffer.allocate(size)
    }

    Function("createArrayBuffer") { size: Int ->
      ArrayBuffer.allocate(size)
    }

    Function("fillNativeBuffer") { buffer: NativeArrayBuffer, value: Int ->
      buffer.toDirectBuffer().apply {
        rewind()
        while (hasRemaining()) {
          put(value.toByte())
        }
      }
      buffer
    }

    Function("fillArrayBuffer") { buffer: ArrayBuffer, value: Int ->
      buffer.withMutableJSBytes { directBuffer ->
        directBuffer.rewind()
        while (directBuffer.hasRemaining()) {
          directBuffer.put(value.toByte())
        }
      }
      buffer
    }

    Function("readWithJSBytes") { buffer: ArrayBuffer, count: Int ->
      buffer.withJSBytes { scopedBuffer ->
        scopedBuffer.rewind()
        List(count.coerceAtMost(scopedBuffer.remaining())) {
          scopedBuffer.get().toInt() and 0xff
        }
      }
    }

    Function("readFirstByte") { buffer: ArrayBuffer ->
      buffer.readByte(0)
    }

    Function("fillWithMutableJSBytes") { buffer: ArrayBuffer, value: Int ->
      buffer.withMutableJSBytes { scopedBuffer ->
        scopedBuffer.rewind()
        while (scopedBuffer.hasRemaining()) {
          scopedBuffer.put(value.toByte())
        }
      }
    }

    Function("inspectWithJSBytes") { buffer: ArrayBuffer ->
      buffer.withJSBytes { scopedBuffer ->
        val mutationThrows = try {
          scopedBuffer.put(0, 42)
          false
        } catch (_: ReadOnlyBufferException) {
          true
        }
        listOf(
          scopedBuffer.isDirect,
          scopedBuffer.isReadOnly,
          scopedBuffer.order() == ByteOrder.nativeOrder(),
          mutationThrows
        )
      }
    }

    Function("inspectWithMutableJSBytes") { buffer: ArrayBuffer ->
      buffer.withMutableJSBytes { scopedBuffer ->
        val mutationSucceeds = try {
          scopedBuffer.put(0, scopedBuffer.get(0))
          true
        } catch (_: ReadOnlyBufferException) {
          false
        }
        listOf(
          scopedBuffer.isDirect,
          scopedBuffer.isReadOnly,
          scopedBuffer.order() == ByteOrder.nativeOrder(),
          mutationSucceeds
        )
      }
    }

    AsyncFunction("readWithJSBytesAsync") Coroutine { buffer: ArrayBuffer, count: Int ->
      buffer.withJSBytesAsync { scopedBuffer ->
        scopedBuffer.rewind()
        List(count.coerceAtMost(scopedBuffer.remaining())) {
          scopedBuffer.get().toInt() and 0xff
        }
      }
    }

    AsyncFunction("fillWithMutableJSBytesAsync") Coroutine { buffer: ArrayBuffer, value: Int ->
      buffer.withMutableJSBytesAsync { scopedBuffer ->
        scopedBuffer.rewind()
        while (scopedBuffer.hasRemaining()) {
          scopedBuffer.put(value.toByte())
        }
      }
    }

    Function("returnArrayBuffer") { buffer: ArrayBuffer ->
      buffer
    }

    Function("isArrayBufferNativeBacked") { buffer: ArrayBuffer ->
      buffer.isNativeBacked()
    }
  }

  private fun retainingJavaScriptBackedArrayBufferModule(
    retainedBuffer: AtomicReference<ArrayBuffer?>
  ) = inlineModule {
    Name("TestModule")
    Function("retainJavaScriptBackedArrayBuffer") { buffer: ArrayBuffer ->
      retainedBuffer.set(buffer)
    }
  }

  private fun forceGc() {
    repeat(5) {
      System.gc()
      System.runFinalization()
      Thread.sleep(10)
    }
  }

  private fun mainExecutor(
    queue: ControllableJSHeapAccessExecutor,
    syncTimeoutMillis: Long = 5_000
  ): MainJSHeapAccessExecutor {
    val reactContext = mockk<ReactApplicationContext>()
    every { reactContext.isOnJSQueueThread } returns false
    every { reactContext.runOnJSQueueThread(any()) } answers {
      queue.runOnQueue(invocation.args.single() as Runnable, Runnable {})
    }
    return MainJSHeapAccessExecutor(reactContext, syncTimeoutMillis)
  }
}
