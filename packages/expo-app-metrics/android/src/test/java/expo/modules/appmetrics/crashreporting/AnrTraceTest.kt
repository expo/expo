package expo.modules.appmetrics.crashreporting

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AnrTraceTest {
  @Test
  fun `returns the frames of the main thread only`() {
    val trace = """
      ----- pid 4321 at 2026-06-12 10:00:00.000000000+0000 -----
      Cmd line: com.example

      "Signal Catcher" daemon prio=10 tid=7 Runnable
        | group="system" sCount=0
        at dalvik.system.VMStack.getThreadStackTrace(Native method)

      "main" prio=5 tid=1 Sleeping
        | group="main" sCount=1 ucsCount=0 flags=1
        | sysTid=4321 nice=-10 cgrp=top-app
        native: #00 pc 000a1 /apex/com.android.runtime/lib64/bionic/libc.so (nanosleep+8)
        at java.lang.Thread.sleep(Native method)
        - sleeping on <0x0a1> (a java.lang.Object)
        at com.example.MainActivity.onClick(MainActivity.kt:42)

      "FinalizerDaemon" daemon prio=5 tid=4 Waiting
        at java.lang.Object.wait(Native method)
    """.trimIndent()

    assertEquals(
      listOf(
        "native: #00 pc 000a1 /apex/com.android.runtime/lib64/bionic/libc.so (nanosleep+8)",
        "at java.lang.Thread.sleep(Native method)",
        "- sleeping on <0x0a1> (a java.lang.Object)",
        "at com.example.MainActivity.onClick(MainActivity.kt:42)"
      ),
      AnrTrace.mainThreadFrames(trace.byteInputStream())
    )
  }

  @Test
  fun `returns null when the trace has no main thread`() {
    val trace = """
      "Signal Catcher" daemon prio=10 tid=7 Runnable
        at dalvik.system.VMStack.getThreadStackTrace(Native method)
    """.trimIndent()

    assertNull(AnrTrace.mainThreadFrames(trace.byteInputStream()))
  }
}
