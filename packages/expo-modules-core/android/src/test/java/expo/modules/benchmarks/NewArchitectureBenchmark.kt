package expo.modules.benchmarks

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.ReadableArray
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.module
import org.junit.Before
import org.junit.Ignore
import org.junit.Test

class NewArchitectureBenchmark {
  private val benchmarkRule = BenchmarkRule(iteration = 1000000)
  private lateinit var proxy: NativeModulesProxy

  class MyModule : Module() {
    private fun retNull(): Any? {
      return null
    }

    override fun definition() = module {
      name("MyModule")
      method("m1") { -> retNull() }
      method("m2") { _: Int, _: Int -> retNull() }
      method("m3") { _: IntArray -> retNull() }
      method("m4") { _: String -> retNull() }
    }
  }

  @Before
  fun before() {
    val legacyModuleRegister = expo.modules.core.ModuleRegistry(
      emptyList(),
      emptyList(),
      emptyList(),
      emptyList()
    )

    proxy = NativeModulesProxy(
      null, legacyModuleRegister,
      object : ModulesProvider {
        override fun getModulesList(): List<Class<out Module>> =
          listOf(MyModule::class.java)
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
