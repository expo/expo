package expo.modules.kotlin.jni

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.IntrospectableRecordConversionStrategy
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.ReflectionRecordConversionStrategy
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.types.TypeConverterProviderImpl
import expo.modules.kotlin.types.descriptors.toTypeDescriptor
import expo.modules.kotlin.types.descriptors.typeDescriptorOf
import org.junit.Ignore
import org.junit.Test
import kotlin.reflect.typeOf
import kotlin.time.Duration.Companion.nanoseconds
import kotlin.time.measureTime

@Ignore("Benchmark tests are not run by default. Run manually to compare ReflectionRecordConversionStrategy vs IntrospectableRecordConversionStrategy.")
class RecordConversionStrategyBenchmarkTest {

  class ReflectionRecord : Record {
    @Field
    var id: Int = 0

    @Field
    var name: String = ""

    @Field
    var value: Double = 0.0

    @Field
    var enabled: Boolean = false
  }

  @OptimizedRecord
  class IntrospectableRecord : Record {
    @Field
    var id: Int = 0

    @Field
    var name: String = ""

    @Field
    var value: Double = 0.0

    @Field
    var enabled: Boolean = false
  }

  private val sampleMap = mapOf(
    "id" to 42,
    "name" to "benchmark",
    "value" to 3.14,
    "enabled" to true
  )

  @Test
  fun benchmarkCreation() {
    val numberOfTries = 10
    val numberOfCreations = 10_000

    var reflectionTotal = 0.nanoseconds
    var introspectableTotal = 0.nanoseconds

    repeat(numberOfTries) {
      val reflectionTime = measureTime {
        repeat(numberOfCreations) {
          val typeDescriptorForReflection = typeOf<ReflectionRecord>().toTypeDescriptor()
          ReflectionRecordConversionStrategy<ReflectionRecord>(
            TypeConverterProviderImpl,
            typeDescriptorForReflection
          )
        }
      }
      reflectionTotal += reflectionTime / numberOfCreations

      val introspectableTime = measureTime {
        repeat(numberOfCreations) {
          val typeDescriptor = typeDescriptorOf<IntrospectableRecord>()
          IntrospectableRecordConversionStrategy<IntrospectableRecord>(
            TypeConverterProviderImpl,
            typeDescriptor
          )
        }
      }
      introspectableTotal += introspectableTime / numberOfCreations
    }

    println("[Creation] ReflectionRecordConversionStrategy avg: ${(reflectionTotal / numberOfTries).inWholeNanoseconds}")
    println("[Creation] IntrospectableRecordConversionStrategy avg: ${(introspectableTotal / numberOfTries).inWholeNanoseconds}")
  }

  @Test
  fun benchmarkConversion() {
    val numberOfTries = 10
    val numberOfCalls = 10_000

    // Pre-create strategies (warm up lazy init)
    val reflectionDescriptor = typeOf<ReflectionRecord>().toTypeDescriptor()
    val reflectionStrategy = ReflectionRecordConversionStrategy<ReflectionRecord>(
      TypeConverterProviderImpl,
      reflectionDescriptor
    )

    val introspectableDescriptor = typeDescriptorOf<IntrospectableRecord>()
    val introspectableStrategy = IntrospectableRecordConversionStrategy<IntrospectableRecord>(
      TypeConverterProviderImpl,
      introspectableDescriptor
    )

    // Warm up lazy propertyDescriptors
    reflectionStrategy.convertFromMap(sampleMap, null, false)
    introspectableStrategy.convertFromMap(sampleMap, null, false)

    var reflectionTotal = 0.nanoseconds
    var introspectableTotal = 0.nanoseconds

    repeat(numberOfTries) {
      val reflectionTime = measureTime {
        repeat(numberOfCalls) {
          reflectionStrategy.convertFromMap(sampleMap, null, false)
        }
      }
      reflectionTotal += reflectionTime / numberOfCalls

      val introspectableTime = measureTime {
        repeat(numberOfCalls) {
          introspectableStrategy.convertFromMap(sampleMap, null, false)
        }
      }
      introspectableTotal += introspectableTime / numberOfCalls
    }

    println("[Conversion] ReflectionRecordConversionStrategy avg per call: ${reflectionTotal / numberOfTries}")
    println("[Conversion] IntrospectableRecordConversionStrategy avg per call: ${introspectableTotal / numberOfTries}")
  }

  @Test
  fun benchmarkCreationAndConversion() {
    val numberOfTries = 10
    val numberOfCalls = 1_000

    var reflectionTotal = 0.nanoseconds
    var introspectableTotal = 0.nanoseconds

    repeat(numberOfTries) {
      val reflectionTime = measureTime {
        repeat(numberOfCalls) {
          val typeDescriptor = typeOf<ReflectionRecord>().toTypeDescriptor()
          val strategy = ReflectionRecordConversionStrategy<ReflectionRecord>(
            TypeConverterProviderImpl,
            typeDescriptor
          )
          strategy.convertFromMap(sampleMap, null, false)
        }
      }
      reflectionTotal += reflectionTime / numberOfCalls

      val introspectableTime = measureTime {
        repeat(numberOfCalls) {
          val typeDescriptor = typeDescriptorOf<IntrospectableRecord>()
          val strategy = IntrospectableRecordConversionStrategy<IntrospectableRecord>(
            TypeConverterProviderImpl,
            typeDescriptor
          )
          strategy.convertFromMap(sampleMap, null, false)
        }
      }
      introspectableTotal += introspectableTime / numberOfCalls
    }

    println("[Creation+Conversion] ReflectionRecordConversionStrategy avg: ${reflectionTotal / numberOfTries}")
    println("[Creation+Conversion] IntrospectableRecordConversionStrategy avg: ${introspectableTotal / numberOfTries}")
  }
}
