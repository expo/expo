package expo.modules.kotlin

import com.google.common.truth.Truth
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import io.mockk.mockk
import org.junit.Assert
import org.junit.Test
import java.lang.ref.WeakReference

class M1 : Module() {
  override fun definition() = ModuleDefinition {
    Name("m1")
  }
}

class M2 : Module() {
  override fun definition() = ModuleDefinition {
    Name("m2")
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
    val moduleRegistry = ModuleRegistry(WeakReference(mockk()))

    moduleRegistry.register(provider)

    Truth.assertThat(moduleRegistry.toList()).hasSize(2)

    Truth.assertThat(moduleRegistry.hasModule("m1")).isTrue()
    Truth.assertThat(moduleRegistry.hasModule("m2")).isTrue()

    Truth.assertThat(moduleRegistry.getModule("m1")).isInstanceOf(M1::class.java)
    Truth.assertThat(moduleRegistry.getModule("m2")).isInstanceOf(M2::class.java)
  }

  @Test
  fun `should throw on incorrect definition`() {
    class IncorrectModule : Module() {
      override fun definition() = ModuleDefinition { }
    }

    val provider = object : ModulesProvider {
      override fun getModulesList(): List<Class<out Module>> {
        return listOf(IncorrectModule::class.java)
      }
    }
    val moduleRegistry = ModuleRegistry(mockk())

    try {
      moduleRegistry.register(provider)
      Assert.fail("Module registry should throw.")
    } catch (_: Exception) {
    }
  }

  @Test
  fun `should return holder for module`() {
    val provider = object : ModulesProvider {
      override fun getModulesList(): List<Class<out Module>> {
        return listOf(M1::class.java)
      }
    }

    val moduleRegistry = ModuleRegistry(WeakReference(mockk()))
    moduleRegistry.register(provider)
    val m1 = moduleRegistry.getModule("m1")!!
    val holder = moduleRegistry.getModuleHolder(m1)

    Truth.assertThat(holder).isNotNull()
    Truth.assertThat(holder).isSameInstanceAs(moduleRegistry.getModuleHolder("m1"))
  }
}
