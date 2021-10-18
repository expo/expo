package expo.modules.kotlin

import com.google.common.truth.Truth
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.module
import org.junit.Test

class M1 : Module() {
  companion object : ModuleDefinitionProvider {
    override fun definition() = module {
      name("m1")
    }
  }
}

class M2 : Module() {
  companion object : ModuleDefinitionProvider {
    override fun definition() = module {
      name("m2")
    }
  }
}

class ModuleRegistryTest {

  @Test
  fun `should register all classes from provider`() {
    val provider = object : ModulesProvider {
      override fun getModulesList(): List<Class<out Module>> {
        return listOf(M1::class.java, M2::class.java)
      }
    }
    val moduleRegistry = ModuleRegistry()

    moduleRegistry.register(provider)

    Truth.assertThat(moduleRegistry.toList()).hasSize(2)

    Truth.assertThat(moduleRegistry.hasModule("m1")).isTrue()
    Truth.assertThat(moduleRegistry.hasModule("m2")).isTrue()

    Truth.assertThat(moduleRegistry.getModule("m1")).isInstanceOf(M1::class.java)
    Truth.assertThat(moduleRegistry.getModule("m2")).isInstanceOf(M2::class.java)
  }

  @Test
  fun `should ignore incorrect definition`() {
    class IncorrectModule : Module()

    val provider = object : ModulesProvider {
      override fun getModulesList(): List<Class<out Module>> {
        return listOf(IncorrectModule::class.java)
      }
    }
    val moduleRegistry = ModuleRegistry()

    moduleRegistry.register(provider)

    Truth.assertThat(moduleRegistry.toList()).isEmpty()
  }
}
