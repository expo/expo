package expo.modules.appmetrics.crashreporting

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CallStackTreeBuilderTest {
  private fun element(
    className: String = "com.example.Foo",
    methodName: String = "bar",
    fileName: String? = "Foo.kt",
    lineNumber: Int = 42
  ) = StackTraceElement(className, methodName, fileName, lineNumber)

  @Test
  fun `produces a single attributed call stack`() {
    val tree = CallStackTreeBuilder.fromStackTrace(arrayOf(element()))

    val stacks = requireNotNull(tree.callStacks)
    assertEquals(1, stacks.size)
    assertEquals(true, stacks[0].threadAttributed)
  }

  @Test
  fun `formats symbols like printStackTrace frames`() {
    val tree = CallStackTreeBuilder.fromStackTrace(
      arrayOf(element(className = "com.example.Foo", methodName = "bar", fileName = "Foo.kt", lineNumber = 42))
    )

    val frames = requireNotNull(tree.callStacks?.first()?.callStackRootFrames)
    assertEquals("com.example.Foo.bar(Foo.kt:42)", frames[0].symbol)
  }

  @Test
  fun `keeps frames in stack order with the crash site first`() {
    val tree = CallStackTreeBuilder.fromStackTrace(
      arrayOf(
        element(methodName = "crashSite"),
        element(methodName = "caller"),
        element(methodName = "main")
      )
    )

    val frames = requireNotNull(tree.callStacks?.first()?.callStackRootFrames)
    assertEquals(3, frames.size)
    assertTrue(frames[0].symbol!!.contains("crashSite"))
    assertTrue(frames[2].symbol!!.contains("main"))
  }

  @Test
  fun `truncates oversized stacks and appends a marker frame`() {
    val oversized = Array(CallStackTreeBuilder.MAX_FRAMES + 10) { index ->
      element(methodName = "frame$index")
    }

    val tree = CallStackTreeBuilder.fromStackTrace(oversized)

    val frames = requireNotNull(tree.callStacks?.first()?.callStackRootFrames)
    // MAX_FRAMES real frames plus one truncation marker.
    assertEquals(CallStackTreeBuilder.MAX_FRAMES + 1, frames.size)
    assertTrue(frames.last().symbol!!.contains("10"))
    assertTrue(frames[CallStackTreeBuilder.MAX_FRAMES - 1].symbol!!.contains("frame${CallStackTreeBuilder.MAX_FRAMES - 1}"))
  }

  @Test
  fun `handles an empty stack trace`() {
    val tree = CallStackTreeBuilder.fromStackTrace(emptyArray())

    val frames = requireNotNull(tree.callStacks?.first()?.callStackRootFrames)
    assertEquals(0, frames.size)
  }
}
