package expo.modules.benchmarks

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.ReadableArray
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import org.junit.Before
import org.junit.Ignore
import org.junit.Test

class LegacyArchitectureBenchmark {
  private val benchmarkRule = BenchmarkRule(iteration = 1000000)
  private lateinit var proxy: NativeModulesProxy

  class MyModule : ExportedModule(null) {
    private fun retNull(): Any? {
      return null
    }

    override fun getName(): String = "MyModule"

    @ExpoMethod
    fun m1(promise: Promise) {
      promise.resolve(retNull())
    }

    @ExpoMethod
    fun m2(a: Int, b: Int, promise: Promise) {
      promise.resolve(retNull())
    }

    @ExpoMethod
    fun m3(a: IntArray, promise: Promise) {
      promise.resolve(retNull())
    }

    @ExpoMethod
    fun m4(s: String, promise: Promise) {
      promise.resolve(retNull())
    }
  }

  @Before
  fun before() {
    val legacyModuleRegister = expo.modules.core.ModuleRegistry(
      emptyList(),
      listOf(MyModule()),
      emptyList(),
      emptyList()
    )

    proxy = NativeModulesProxy(
      null, legacyModuleRegister,
      object : ModulesProvider {
        override fun getModulesList(): List<Class<out Module>> = emptyList()
      }
    )
  }

  @Ignore("It's a benchmark")
  @Test
  fun `call function with simple arguments`() {
    val testCases = listOf<Pair<Dynamic, ReadableArray>>(
      DynamicFromObject("m1") to JavaOnlyArray(),
      DynamicFromObject("m2") to JavaOnlyArray().apply {
        pushInt(1)
        pushInt(2)
      },
      DynamicFromObject("m3") to JavaOnlyArray().apply {
        pushArray(
          JavaOnlyArray().apply {
            pushInt(1)
            pushInt(2)
            pushInt(3)
          }
        )
      },
      DynamicFromObject("m4") to JavaOnlyArray().apply {
        pushString("expo is awesome")
      }
    )
    val emptyPromise = EmptyRNPromise()

    repeat(3) {
      benchmarkRule.run(::`call function with simple arguments`.name) {
        testCases.forEach { (method, args) ->
          proxy.callMethod("MyModule", method, args, emptyPromise)
        }
      }
    }
  }
}
