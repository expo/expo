package expo.modules.ai

import expo.modules.kotlin.Promise
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import org.junit.Assert.*
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LanguageModelSessionTest {
  @Test
  fun `an accepting continuation can synchronously start the next session turn`() = runTest {
    val backend = TestBackend()
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {}) { _, _ -> }
    val next = TestPromise()
    val first = object : Promise {
      override fun resolve(value: Any?) {
        assertTrue(controller.acceptResult("first"))
        controller.generate("next", "Continue", "{}", next)
      }
      override fun reject(code: String?, message: String?, cause: Throwable?) { fail("Unexpected failure: $code") }
    }
    controller.generate("first", "Remember this", "{}", first)
    runCurrent()
    assertEquals(listOf(generationResult("answer")), next.results)
    assertTrue(backend.prompts.last().contains("Remember this"))
    controller.dispose()
  }

  @Test
  fun `cancellation before worker execution prevents SDK work and leaves no bookkeeping`() = runTest {
    val tasks = LanguageModelTasks(this)
    val promise = TestPromise()
    var calls = 0
    tasks.start("first", promise) { calls++; "response" }
    tasks.cancel("first")
    runCurrent()
    assertEquals(0, calls)
    assertEquals(listOf("ERR_REQUEST_CANCELLED"), promise.errors)
    assertEquals(0, tasks.activeCount)
    repeat(1000) { tasks.cancel("unknown-$it") }
    assertEquals(0, tasks.activeCount)
    val next = TestPromise()
    tasks.start("next", next) { "success" }
    runCurrent()
    assertEquals(listOf("success"), next.results)
  }

  @Test
  fun `there is no implicit deadline while a model operation is pending`() = runTest {
    val tasks = LanguageModelTasks(this)
    val result = CompletableDeferred<String>()
    val promise = TestPromise()
    tasks.start("long", promise) { result.await() }
    runCurrent()
    advanceTimeBy(180_000)
    assertTrue(promise.errors.isEmpty())
    assertTrue(promise.results.isEmpty())
    result.complete("done")
    runCurrent()
    assertEquals(listOf("done"), promise.results)
  }

  @Test
  fun `disposal settles outstanding operations and rejects new requests`() = runTest {
    val tasks = LanguageModelTasks(this)
    val promise = TestPromise()
    tasks.start("pending", promise) { CompletableDeferred<String>().await() }
    runCurrent()
    tasks.dispose()
    runCurrent()
    assertEquals(listOf("ERR_SESSION_DISPOSED"), promise.errors)
    assertEquals(0, tasks.activeCount)
    try {
      tasks.start("new", TestPromise()) { "bad" }
      fail("Disposed operations must reject")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_SESSION_DISPOSED", error.code)
    }
  }

  @Test
  fun `only accepted successful turns enter session history and options reach the backend`() = runTest {
    val backend = TestBackend()
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions("Be concise"), this, {}) { _, _ -> }
    val first = TestPromise()
    controller.generate("1", "Remember pear", """{"maximumOutputTokens":42}""", first)
    runCurrent()
    assertTrue(controller.acceptResult("1"))
    backend.response = { _, _ -> throw IllegalStateException("failed") }
    val second = TestPromise()
    controller.generate("2", "Do not remember failed request", "{}", second)
    runCurrent()
    backend.response = { _, _ -> "third" }
    controller.generate("3", "Recall", "{}", TestPromise())
    runCurrent()
    assertEquals("Remember pear", backend.prompts.first())
    assertTrue(backend.prompts.last().contains("Remember pear"))
    assertFalse(backend.prompts.last().contains("Do not remember"))
    assertEquals(listOf("Be concise", "Be concise", "Be concise"), backend.instructions)
    assertEquals(42, backend.options.first().maximumOutputTokens)
    assertEquals(listOf("ERR_GENERATION_FAILED"), second.errors)
    controller.dispose()
    controller.dispose()
    assertEquals(1, backend.closes)
  }

  @Test
  fun `completed results stay provisional until their exact receipt is accepted once`() = runTest {
    val backend = TestBackend()
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {}) { _, _ -> }
    val first = TestPromise()
    controller.generate("first", "Remember pear", "{}", first)
    assertFalse(controller.acceptResult("first"))
    runCurrent()
    assertEquals(listOf(generationResult("answer")), first.results)
    assertFalse(controller.acceptResult("unknown"))
    controller.discardResult("unknown")
    try {
      controller.generate("overlap", "Do not start", "{}", TestPromise())
      fail("A completed result must be accepted or discarded before the next turn")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_SESSION_BUSY", error.code)
    }
    assertEquals(1, backend.prompts.size)
    assertTrue(controller.acceptResult("first"))
    assertFalse(controller.acceptResult("first"))

    controller.generate("next", "Continue", "{}", TestPromise())
    controller.discardResult("first")
    controller.cancel("first")
    runCurrent()
    assertTrue(backend.prompts.last().contains("Remember pear"))
    assertFalse(controller.acceptResult("first"))
    assertTrue(controller.acceptResult("next"))
    controller.dispose()
  }

  @Test
  fun `canceling or discarding delivered results keeps them out of later history`() = runTest {
    val backend = TestBackend()
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {}) { _, _ -> }
    controller.generate("accepted", "Remember pear", "{}", TestPromise())
    runCurrent()
    assertTrue(controller.acceptResult("accepted"))

    val canceled = TestPromise()
    controller.generate("canceled", "Cancelled secret", "{}", canceled)
    runCurrent()
    controller.cancel("canceled")
    assertFalse(controller.acceptResult("canceled"))
    assertEquals(listOf(generationResult("answer")), canceled.results)
    assertTrue(canceled.errors.isEmpty())

    controller.generate("discarded", "Invalid secret", "{}", TestPromise())
    runCurrent()
    controller.discardResult("discarded")
    controller.discardResult("discarded")
    assertFalse(controller.acceptResult("discarded"))

    controller.generate("next", "Continue", "{}", TestPromise())
    runCurrent()
    assertTrue(backend.prompts.last().contains("Remember pear"))
    assertFalse(backend.prompts.last().contains("Cancelled secret"))
    assertFalse(backend.prompts.last().contains("Invalid secret"))
    assertTrue(controller.acceptResult("next"))
    controller.dispose()
  }

  @Test
  fun `discarding active work prevents a late completion from staging a result`() = runTest {
    val backend = TestBackend()
    val late = CompletableDeferred<String>()
    backend.response = { _, _ -> withContext(NonCancellable) { late.await() } }
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {}) { _, _ -> }
    val promise = TestPromise()
    controller.generate("discarded", "Discarded secret", "{}", promise)
    runCurrent()
    controller.discardResult("discarded")
    late.complete("late answer")
    runCurrent()
    assertEquals(listOf("ERR_REQUEST_CANCELLED"), promise.errors)
    assertTrue(promise.results.isEmpty())
    assertFalse(controller.acceptResult("discarded"))

    backend.response = { _, _ -> "fresh" }
    controller.generate("next", "Continue", "{}", TestPromise())
    runCurrent()
    assertEquals("Continue", backend.prompts.last())
    assertTrue(controller.acceptResult("next"))
    controller.dispose()
  }

  @Test
  fun `disposal invalidates a delivered result and rejects reuse`() = runTest {
    val backend = TestBackend()
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {}) { _, _ -> }
    controller.generate("pending", "Do not commit", "{}", TestPromise())
    runCurrent()
    controller.dispose()
    controller.dispose()
    assertFalse(controller.acceptResult("pending"))
    controller.discardResult("pending")
    try {
      controller.generate("next", "Continue", "{}", TestPromise())
      fail("Disposed sessions must reject")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_SESSION_DISPOSED", error.code)
    }
    assertEquals(1, backend.closes)
  }

  @Test
  fun `background transitions invalidate results before or after the lifecycle callback`() = runTest {
    val backend = TestBackend()
    var foreground = true
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {
      if (!foreground) throw LanguageModelException.background()
    }) { _, _ -> }
    controller.generate("accepted", "Remember pear", "{}", TestPromise())
    runCurrent()
    assertTrue(controller.acceptResult("accepted"))

    controller.generate("before-callback", "Background secret one", "{}", TestPromise())
    runCurrent()
    foreground = false
    assertFalse(controller.acceptResult("before-callback"))
    foreground = true
    assertFalse(controller.acceptResult("before-callback"))

    controller.generate("after-callback", "Background secret two", "{}", TestPromise())
    runCurrent()
    foreground = false
    controller.cancelForBackground()
    foreground = true
    assertFalse(controller.acceptResult("after-callback"))

    controller.generate("next", "Continue", "{}", TestPromise())
    runCurrent()
    assertTrue(backend.prompts.last().contains("Remember pear"))
    assertFalse(backend.prompts.last().contains("Background secret"))
    assertTrue(controller.acceptResult("next"))
    controller.dispose()
  }

  @Test
  fun `late cancelled responses and text cannot update history or settle twice`() = runTest {
    val backend = TestBackend()
    val late = CompletableDeferred<String>()
    var deliver: ((String) -> Unit)? = null
    backend.response = { _, onText ->
      deliver = onText
      withContext(NonCancellable) { late.await() }
    }
    val updates = mutableListOf<String>()
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {}) { _, text -> updates.add(text) }
    val promise = TestPromise()
    controller.generate("1", "Cancelled secret", """{"stream":true}""", promise)
    runCurrent()
    deliver!!("preview")
    controller.cancel("1")
    try {
      deliver!!("late preview")
      fail("Late updates must be rejected")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_REQUEST_CANCELLED", error.code)
    }
    late.complete("late final")
    runCurrent()
    backend.response = { _, _ -> "fresh" }
    controller.generate("2", "New request", "{}", TestPromise())
    runCurrent()
    assertEquals(listOf("preview"), updates)
    assertEquals(listOf("ERR_REQUEST_CANCELLED"), promise.errors)
    assertTrue(promise.results.isEmpty())
    assertEquals("New request", backend.prompts.last())
    controller.dispose()
  }

  @Test
  fun `background cancellation preserves completed turns and requires an explicit new request`() = runTest {
    val backend = TestBackend()
    var foreground = true
    val controller = LanguageModelSessionController(backend, LanguageModelSessionOptions(null), this, {
      if (!foreground) throw LanguageModelException.background()
    }) { _, _ -> }
    val completed = TestPromise()
    controller.generate("completed", "Remember pear", "{}", completed)
    runCurrent()
    assertEquals(listOf(generationResult("answer")), completed.results)
    assertTrue(controller.acceptResult("completed"))
    backend.response = { _, _ -> CompletableDeferred<String>().await() }
    val promise = TestPromise()
    controller.generate("1", "Do not remember pending turn", "{}", promise)
    runCurrent()
    try {
      controller.generate("2", "overlap", "{}", TestPromise())
      fail("Overlapping requests must reject")
    } catch (error: LanguageModelException) {
      assertEquals("ERR_SESSION_BUSY", error.code)
    }
    foreground = false
    controller.cancelForBackground()
    runCurrent()
    assertEquals(listOf("ERR_APP_BACKGROUND"), promise.errors)
    assertTrue(promise.results.isEmpty())
    val background = TestPromise()
    controller.generate("3", "background", "{}", background)
    runCurrent()
    assertEquals(listOf("ERR_APP_BACKGROUND"), background.errors)
    assertEquals(2, backend.prompts.size)
    foreground = true
    runCurrent()
    assertEquals(2, backend.prompts.size)
    backend.response = { _, _ -> "recovered" }
    val fresh = TestPromise()
    controller.generate("4", "fresh", "{}", fresh)
    runCurrent()
    assertEquals(listOf(generationResult("recovered")), fresh.results)
    assertTrue(backend.prompts.last().contains("Remember pear"))
    assertFalse(backend.prompts.last().contains("Do not remember pending turn"))
    assertFalse(backend.prompts.last().contains("background"))
    controller.dispose()
  }
}
