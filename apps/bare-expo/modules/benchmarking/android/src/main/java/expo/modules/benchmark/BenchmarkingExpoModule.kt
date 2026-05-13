package expo.modules.benchmark

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class Point : Record {
  @Field
  var x: Double = 0.0

  @Field
  var y: Double = 0.0
}

class SharedPoint(appContext: AppContext) : SharedObject(appContext) {
  var x: Double = 0.0
  var y: Double = 0.0
}

class BenchmarkingExpoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function<Unit>("nothing") {
      // Do nothing
    }

    AsyncFunction("nothingAsync") {
      // Do nothing
    }

    Function("addNumbers") { a: Double, b: Double ->
      a + b
    }

    AsyncFunction("addNumbersAsync") { a: Double, b: Double ->
      a + b
    }

    Function("addStrings") { a: String, b: String ->
      a + b
    }

    Function("foldArray") { array: List<Double> ->
      array.sum()
    }

    Function("passthroughDict") { point: Map<String, Any> ->
      point
    }

    Function("passthroughRecord") { point: Point ->
      point
    }

    Function("passthroughSharedObject") { point: SharedPoint ->
      point
    }

    Class(SharedPoint::class) {
      Constructor { x: Double, y: Double ->
        val point = SharedPoint(appContext)
        point.x = x
        point.y = y
        return@Constructor point
      }

      Property("x") { point: SharedPoint ->
        point.x
      }

      Property("y") { point: SharedPoint ->
        point.y
      }
    }
  }
}
