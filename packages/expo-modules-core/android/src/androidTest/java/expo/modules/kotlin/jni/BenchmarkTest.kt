package expo.modules.kotlin.jni

import org.junit.Ignore
import org.junit.Test
import kotlin.time.Duration.Companion.nanoseconds
import kotlin.time.measureTime

@Ignore("Benchmark tests are not run by default. They are used to measure performance of the JSI bridge and should be run manually when needed.")
class BenchmarkTest {
  @Test
  fun benchmark() {
    val numberOfTries = 10
    var totalAvg = 0.nanoseconds
    repeat(numberOfTries) {
      withSingleModule({
        Function("add") { a: Int, b: Int ->
          a + b
        }
      }) {
        val numberOfCalls = 10_000
        var total = 0.nanoseconds
        repeat(numberOfCalls) {
          val time = measureTime {
            callVoid("add", "1, 2")
          }

          total += time
        }

        val average = total / numberOfCalls
        totalAvg += average
        println("Average time: $average")
      }
    }
    val avg = totalAvg / numberOfTries
    println("Average time for $numberOfTries tries: $avg")
  }
}
