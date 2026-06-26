package expo.modules.appmetrics.crashreporting

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CrashReportTest {
  private val crashTimestamp = "2026-06-12T10:00:00Z"
  private val ingestedAt = "2026-06-12T10:05:00Z"

  private fun reportFromThrowable(throwable: Throwable = IllegalStateException("boom")): CrashReport =
    CrashReport.fromThrowable(
      throwable = throwable,
      crashTimestamp = crashTimestamp,
      ingestedAt = ingestedAt,
      appVersion = "1.2.3"
    )

  // MARK: fromThrowable

  @Test
  fun `fromThrowable maps the exception into exceptionReason`() {
    val report = reportFromThrowable(IllegalStateException("boom"))

    assertEquals("java.lang.IllegalStateException: boom", report.exceptionReason)
  }

  @Test
  fun `fromThrowable composes the message from toString for null messages`() {
    val report = reportFromThrowable(NullPointerException())

    assertEquals("java.lang.NullPointerException", report.exceptionReason)
  }

  @Test
  fun `fromThrowable includes the cause chain in the composed message`() {
    val root = ArithmeticException("div by zero")
    val wrapper = RuntimeException("wrapper", IllegalStateException("middle", root))

    val report = reportFromThrowable(wrapper)

    assertEquals(
      "java.lang.RuntimeException: wrapper" +
        "\nCaused by: java.lang.IllegalStateException: middle" +
        "\nCaused by: java.lang.ArithmeticException: div by zero",
      report.exceptionReason
    )
  }

  @Test
  fun `composeMessage caps cyclic cause chains`() {
    val a = RuntimeException("a")
    val b = RuntimeException("b", a)
    a.initCause(b)

    // Must terminate; depth cap keeps the message finite.
    val message = CrashReport.composeMessage(a)

    assertTrue(message.lines().size <= 7)
  }

  @Test
  fun `fromThrowable leaves the OS-only fields null`() {
    // `signal` is a Unix number rendered through SIG* lookup tables by consumers,
    // and `terminationReason` comes from the OS exit record — a JVM crash has neither.
    val report = reportFromThrowable()

    assertNull(report.signal)
    assertNull(report.terminationReason)
  }

  @Test
  fun `fromThrowable stamps the crash moment and metadata`() {
    val report = reportFromThrowable()

    assertEquals(crashTimestamp, report.timestampBegin)
    assertEquals(ingestedAt, report.ingestedAt)
    assertEquals("1.2.3", report.appVersion)
  }

  @Test
  fun `fromThrowable captures the call stack`() {
    val throwable = IllegalStateException("boom").apply { fillInStackTrace() }
    val report = reportFromThrowable(throwable)

    val frames = report.callStackTree?.callStacks?.firstOrNull()?.callStackRootFrames
    assertNotNull(frames)
    assertTrue(frames!!.isNotEmpty())
    // The crash site (this test) must appear before JUnit infrastructure frames.
    assertTrue(frames.first().symbol!!.contains("CrashReportTest"))
  }

  // MARK: JSON encoding — the payload is the cross-platform contract with types.ts

  @Test
  fun `encodes with the TypeScript field names`() {
    val payload = reportFromThrowable().encodeToJsonString()
    val element = Json.parseToJsonElement(payload).jsonObject

    assertTrue("exceptionReason" in element)
    assertTrue("callStackTree" in element)
    assertEquals(crashTimestamp, element["timestampBegin"]?.jsonPrimitive?.content)
    // Android collapses the window to the exact moment: only the start is emitted,
    // and JS resolves the end from it.
    assertFalse("timestampEnd" in element)
    assertEquals(ingestedAt, element["ingestedAt"]?.jsonPrimitive?.content)
    assertEquals("1.2.3", element["appVersion"]?.jsonPrimitive?.content)

    // Android encodes `exceptionReason` as a plain string (the composed message).
    assertEquals("java.lang.IllegalStateException: boom", element["exceptionReason"]?.jsonPrimitive?.content)

    val stack = element["callStackTree"]!!.jsonObject["callStacks"]!!.let { it as kotlinx.serialization.json.JsonArray }
    val firstStack = stack.first().jsonObject
    assertTrue("threadAttributed" in firstStack)
    assertTrue("callStackRootFrames" in firstStack)
    val firstFrame = (firstStack["callStackRootFrames"] as kotlinx.serialization.json.JsonArray).first().jsonObject
    assertTrue("symbol" in firstFrame)
  }

  @Test
  fun `omits null fields like the iOS encoder`() {
    // iOS's JSONEncoder drops nil Optionals; consumers rely on absence, not explicit null.
    val payload = reportFromThrowable().encodeToJsonString()
    val element = Json.parseToJsonElement(payload).jsonObject

    assertFalse("signal" in element)
    assertFalse("terminationReason" in element)
  }

  @Test
  fun `round-trips through JSON`() {
    val original = reportFromThrowable()

    val decoded = CrashReport.decodeFromJsonString(original.encodeToJsonString())

    assertEquals(original, decoded)
  }

  @Test
  fun `decodes an iOS-shaped payload`() {
    // MetricKit payloads carry iOS-only fields the Android model doesn't have —
    // the Mach codes (`exceptionType`/`exceptionCode`/`virtualMemoryRegionInfo`)
    // and the per-frame binary/address fields. Decoding must tolerate all of them
    // as unknown keys and still read the shared fields and the frame symbols.
    val payload = """
      {
        "exceptionType": 1,
        "exceptionCode": 2,
        "virtualMemoryRegionInfo": "0x0 is not in any region",
        "signal": 11,
        "terminationReason": "Namespace SIGNAL, Code 0xb",
        "callStackTree": {
          "callStacks": [
            {
              "threadAttributed": true,
              "callStackRootFrames": [
                {
                  "binaryName": "MyApp",
                  "binaryUUID": "12345678-1234-1234-1234-123456789012",
                  "address": 18446744073709551600,
                  "offsetIntoBinaryTextSegment": 1234,
                  "sampleCount": 1,
                  "symbol": "-[MyClass crash]"
                }
              ]
            }
          ]
        },
        "appVersion": "1.0.0",
        "timestampBegin": "2026-06-11T10:00:00Z",
        "timestampEnd": "2026-06-11T11:00:00Z",
        "ingestedAt": "2026-06-12T08:30:15Z"
      }
    """.trimIndent()

    val report = requireNotNull(CrashReport.decodeFromJsonString(payload))

    assertEquals(11, report.signal)
    assertEquals("Namespace SIGNAL, Code 0xb", report.terminationReason)
    val frame = report.callStackTree?.callStacks?.first()?.callStackRootFrames?.first()
    assertEquals("-[MyClass crash]", frame?.symbol)
  }

  @Test
  fun `decoding tolerates unknown keys`() {
    val payload = """
      {
        "someFutureField": {"nested": true},
        "appVersion": "1.0.0",
        "timestampBegin": "2026-06-11T10:00:00Z",
        "timestampEnd": "2026-06-11T11:00:00Z",
        "ingestedAt": "2026-06-12T08:30:15Z"
      }
    """.trimIndent()

    val report = CrashReport.decodeFromJsonString(payload)

    assertNotNull(report)
    assertEquals("1.0.0", report?.appVersion)
  }

  @Test
  fun `decoding malformed payloads returns null`() {
    assertNull(CrashReport.decodeFromJsonString("not json"))
    assertNull(CrashReport.decodeFromJsonString("[1, 2, 3]"))
  }
}
