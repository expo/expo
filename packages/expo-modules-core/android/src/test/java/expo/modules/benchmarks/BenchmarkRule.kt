@file:OptIn(ExperimentalTime::class)

package expo.modules.benchmarks

import java.util.concurrent.TimeUnit
import kotlin.system.measureNanoTime
import kotlin.time.ExperimentalTime
import kotlin.time.toDuration

class BenchmarkRule(private val iteration: Int = 10) {
  fun run(name: String, block: () -> Unit) {
    var avg = 0.0
    repeat(iteration) {
      avg += measureNanoTime(block)
    }
    avg /= iteration

    printTime(name, avg)
  }

  private fun printTime(name: String, time: Double) {
    val duration = time.toDuration(TimeUnit.NANOSECONDS)
    println("`$name` on average took $duration")
  }
}
