package expo.modules.kotlin.records

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import expo.modules.assertNotNull
import expo.modules.assertNull
import expo.modules.kotlin.types.convert
import org.junit.Test
import kotlin.reflect.KClass
import kotlin.reflect.full.createType

class RecordTypeValidatorsTest {
  private data class TestCase(
    val jsObjectSetter: JavaOnlyMap.() -> Unit,
    val recordClass: KClass<out Record>,
    val shouldThrow: Boolean
  ) {
    fun getJSObject(): Dynamic {
      return DynamicFromObject(
        JavaOnlyMap().apply {
          jsObjectSetter.invoke(this)
        }
      )
    }
  }

  @Test
  fun `test integration between range validators and record`() {
    class IntRecord : Record {
      @Field
      @IntRange(from = 1, to = 10)
      val value: Int = 2
    }

    class FloatRecord : Record {
      @Field
      @FloatRange(from = 0f, to = 1f)
      val value: Float = 0.5f
    }

    class DoubleRecord : Record {
      @Field
      @DoubleRange(from = 0.0, to = 1.0)
      val value: Double = 0.5
    }

    val testCases = listOf(
      TestCase(
        jsObjectSetter = { putInt("value", 4) },
        recordClass = IntRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putInt("value", 12) },
        recordClass = IntRecord::class,
        shouldThrow = true
      ),
      TestCase(
        jsObjectSetter = { putDouble("value", 0.6) },
        recordClass = FloatRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putDouble("value", 2.0) },
        recordClass = FloatRecord::class,
        shouldThrow = true
      ),
      TestCase(
        jsObjectSetter = { putDouble("value", 0.6) },
        recordClass = DoubleRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putDouble("value", 2.0) },
        recordClass = DoubleRecord::class,
        shouldThrow = true
      )
    )

    for (test in testCases) {
      val exception = runCatching { convert(test.getJSObject(), test.recordClass.createType()) }.exceptionOrNull()

      if (test.shouldThrow) {
        exception.assertNotNull()
      } else {
        exception.assertNull()
      }
    }
  }

  @Test
  fun `test integration between is not empty validator and record`() {
    class CollectionRecord : Record {
      @Field
      @IsNotEmpty
      val value: List<Int> = listOf(1)
    }

    class ArrayRecord : Record {
      @Field
      @IsNotEmpty
      val value: IntArray = IntArray(1) { it }
    }

    val testCases = listOf(
      TestCase(
        jsObjectSetter = { putArray("value", JavaOnlyArray().apply { pushInt(5) }) },
        recordClass = CollectionRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putArray("value", JavaOnlyArray()) },
        recordClass = CollectionRecord::class,
        shouldThrow = true
      ),
      TestCase(
        jsObjectSetter = { putArray("value", JavaOnlyArray().apply { pushInt(5) }) },
        recordClass = ArrayRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putArray("value", JavaOnlyArray()) },
        recordClass = ArrayRecord::class,
        shouldThrow = true
      )
    )

    for (test in testCases) {
      val exception = runCatching { convert(test.getJSObject(), test.recordClass.createType()) }.exceptionOrNull()

      if (test.shouldThrow) {
        exception.assertNotNull()
      } else {
        exception.assertNull()
      }
    }
  }

  @Test
  fun `test integration between size validator and record`() {
    class CollectionRecord : Record {
      @Field
      @Size(min = 2)
      val value: List<Int> = listOf(1, 2)
    }

    class ArrayRecord : Record {
      @Field
      @Size(min = 2)
      val value: IntArray = IntArray(2) { it }
    }

    class StringRecord : Record {
      @Field
      @Size(min = 2)
      val value: String = "12"
    }

    val testCases = listOf(
      TestCase(
        jsObjectSetter = {
          putArray(
            "value",
            JavaOnlyArray().apply {
              pushInt(5)
              pushInt(6)
            }
          )
        },
        recordClass = CollectionRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putArray("value", JavaOnlyArray().apply { pushInt(1) }) },
        recordClass = CollectionRecord::class,
        shouldThrow = true
      ),
      TestCase(
        jsObjectSetter = {
          putArray(
            "value",
            JavaOnlyArray().apply {
              pushInt(5)
              pushInt(6)
            }
          )
        },
        recordClass = ArrayRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putArray("value", JavaOnlyArray().apply { pushInt(1) }) },
        recordClass = ArrayRecord::class,
        shouldThrow = true
      ),
      TestCase(
        jsObjectSetter = { putString("value", "1234") },
        recordClass = StringRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putString("value", "1") },
        recordClass = StringRecord::class,
        shouldThrow = true
      )
    )

    for (test in testCases) {
      val exception = runCatching { convert(test.getJSObject(), test.recordClass.createType()) }.exceptionOrNull()

      if (test.shouldThrow) {
        exception.assertNotNull()
      } else {
        exception.assertNull()
      }
    }
  }

  @Test
  fun `test integration between regular expression validator and record`() {
    class StringRecord : Record {
      @Field
      @RegularExpression(regex = "[a-d]*")
      val value: String = "abcd"
    }

    val testCases = listOf(
      TestCase(
        jsObjectSetter = { putString("value", "aabbccdd") },
        recordClass = StringRecord::class,
        shouldThrow = false
      ),
      TestCase(
        jsObjectSetter = { putString("value", "xyz") },
        recordClass = StringRecord::class,
        shouldThrow = true
      )
    )

    for (test in testCases) {
      val exception = runCatching { convert(test.getJSObject(), test.recordClass.createType()) }.exceptionOrNull()

      if (test.shouldThrow) {
        exception.assertNotNull()
      } else {
        exception.assertNull()
      }
    }
  }
}
