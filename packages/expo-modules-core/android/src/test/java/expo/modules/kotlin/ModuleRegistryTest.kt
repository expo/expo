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

class AudioModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioModule")
    Class("AudioPlayer")
    // Clashes with the `Audio` module, so it is not available in the package.
    Class("Audio")
  }
}

class Audio : Module() {
  override fun definition() = ModuleDefinition {
    Name("Audio")
  }
}

class SameNamePackageModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SameName")
  }
}

class SameNameLocalModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SameName")
  }
}

class ModuleRegistryTest {
  private fun createPackagedRegistry(): ModuleRegistry {
    val provider = object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return mapOf(
          AudioModule::class.java to null,
          Audio::class.java to null,
          M1::class.java to null,
          M2::class.java to null
        )
      }

      override fun getModulePackageNames(): Map<Class<out Module>, String> {
        return mapOf(
          AudioModule::class.java to "expo-audio",
          Audio::class.java to "expo-audio",
          M1::class.java to ModulesProvider.LOCAL_PACKAGE_NAME
        )
      }
    }
    return ModuleRegistry(WeakReference(mockk())).register(provider)
  }

  @Test
  fun `should list package names`() {
    val moduleRegistry = createPackagedRegistry()

    // The local package comes first.
    Truth.assertThat(moduleRegistry.getPackageNames())
      .containsExactly(ModulesProvider.LOCAL_PACKAGE_NAME, "expo-audio")
      .inOrder()
    Truth.assertThat(moduleRegistry.hasPackage("expo-audio")).isTrue()
    Truth.assertThat(moduleRegistry.hasPackage("expo-video")).isFalse()
  }

  @Test
  fun `should list modules and classes in package`() {
    val moduleRegistry = createPackagedRegistry()

    Truth.assertThat(moduleRegistry.getPackageExportNames("expo-audio"))
      .containsExactly("Audio", "AudioModule", "AudioPlayer")
      .inOrder()
    Truth.assertThat(moduleRegistry.getPackageExportNames(ModulesProvider.LOCAL_PACKAGE_NAME)).containsExactly("m1")
  }

  @Test
  fun `should return owners of package exports`() {
    val moduleRegistry = createPackagedRegistry()

    Truth.assertThat(moduleRegistry.getPackageExportOwner("expo-audio", "AudioModule")).isEqualTo("AudioModule")
    Truth.assertThat(moduleRegistry.getPackageExportOwner("expo-audio", "AudioPlayer")).isEqualTo("AudioModule")
    // The module takes precedence over the class with the same name.
    Truth.assertThat(moduleRegistry.getPackageExportOwner("expo-audio", "Audio")).isEqualTo("Audio")
    Truth.assertThat(moduleRegistry.getPackageExportOwner("expo-audio", "m1")).isNull()
    Truth.assertThat(moduleRegistry.getPackageExportOwner("expo-audio", "m2")).isNull()
  }

  @Test
  fun `should register all classes from provider`() {
    val provider = object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return mapOf(
          M1::class.java to null,
          M2::class.java to null
        )
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
  fun `should assign package names from provider`() {
    val provider = object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return mapOf(
          M1::class.java to null,
          M2::class.java to null
        )
      }

      override fun getModulePackageNames(): Map<Class<out Module>, String> {
        return mapOf(M1::class.java to "expo-test")
      }
    }
    val moduleRegistry = ModuleRegistry(WeakReference(mockk()))

    moduleRegistry.register(provider, defaultPackageName = ModulesProvider.LOCAL_PACKAGE_NAME)

    Truth.assertThat(moduleRegistry.getModuleHolder("m1")?.packageName).isEqualTo("expo-test")
    Truth.assertThat(moduleRegistry.getModuleHolder("m2")?.packageName).isEqualTo("\$local")
  }

  @Test
  fun `should not assign a package name without one from provider`() {
    val provider = object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return mapOf(M1::class.java to null)
      }
    }
    val moduleRegistry = ModuleRegistry(WeakReference(mockk()))

    moduleRegistry.register(provider)

    Truth.assertThat(moduleRegistry.getModuleHolder("m1")?.packageName).isNull()
  }

  @Test
  fun `should register local modules last, so they win`() {
    val provider = object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return mapOf(
          SameNameLocalModule::class.java to null,
          SameNamePackageModule::class.java to null
        )
      }

      override fun getModulePackageNames(): Map<Class<out Module>, String> {
        return mapOf(
          SameNameLocalModule::class.java to ModulesProvider.LOCAL_PACKAGE_NAME,
          SameNamePackageModule::class.java to "z-package"
        )
      }
    }
    val moduleRegistry = ModuleRegistry(WeakReference(mockk())).register(provider)

    Truth.assertThat(moduleRegistry.getModuleHolder("SameName")?.module).isInstanceOf(SameNameLocalModule::class.java)
  }

  @Test
  fun `should throw on incorrect definition`() {
    class IncorrectModule : Module() {
      override fun definition() = ModuleDefinition { }
    }

    val provider = object : ModulesProvider {
      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return mapOf(IncorrectModule::class.java to null)
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
      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return mapOf(M1::class.java to null)
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
