package expo.modules.plugin

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StripFusedPackageListEntriesTest {
  // Mirrors the output of GeneratePackagesListTask: `package expo.modules;`, the imports, and the
  // `getServices()` signature all legitimately contain `expo.modules`.
  private val generated =
    """
    package expo.modules;

    import expo.modules.core.interfaces.Package;
    import expo.modules.kotlin.modules.Module;
    import expo.modules.kotlin.ModulesProvider;

    class ExpoModulesPackageList : ModulesProvider {
      companion object {
        val packagesList: List<Package> = listOf(
          expo.modules.foo.FooPackage(),
          expo.modules.bar.BarPackage()
        )

        val modulesMap: Map<Class<out Module>, String?> = mapOf(
          expo.modules.foo.FooModule::class.java to "Foo",
          expo.modules.bar.BarModule::class.java to "Bar"
        )

        @JvmStatic
        fun getPackageList(): List<Package> {
          return packagesList
        }
      }

      override fun getModulesMap(): Map<Class<out Module>, String?> {
        return modulesMap
      }

      override fun getServices(): List<Class<out expo.modules.kotlin.services.Service>> {
        return listOf<Class<out expo.modules.kotlin.services.Service>>(
          expo.modules.foo.FooService::class.java
        )
      }
    }
    """.trimIndent()

  private fun assertBalanced(source: String) {
    fun count(c: Char) = source.count { it == c }
    assertEquals("unbalanced braces", count('{'), count('}'))
    assertEquals("unbalanced parens", count('('), count(')'))
  }

  @Test
  fun `broad prefix strips every module entry without corrupting structure`() {
    val result = stripFusedPackageListEntries(generated, setOf("expo.modules"))

    // Structural lines that legitimately contain the prefix must survive.
    assertTrue(result.contains("package expo.modules;"))
    assertTrue(result.contains("import expo.modules.core.interfaces.Package;"))
    assertTrue(
      result.contains("override fun getServices(): List<Class<out expo.modules.kotlin.services.Service>> {")
    )
    assertTrue(result.contains("return listOf<Class<out expo.modules.kotlin.services.Service>>("))

    // The file must still be a valid, balanced Kotlin source (the reported crash was
    // `Expecting member declaration` from stray `)`/`}` left behind).
    assertBalanced(result)

    // The actual module entries are gone.
    assertFalse(result.contains("FooPackage()"))
    assertFalse(result.contains("BarPackage()"))
    assertFalse(result.contains("FooService::class.java"))
  }

  @Test
  fun `specific prefix strips only the matching module`() {
    val result = stripFusedPackageListEntries(generated, setOf("expo.modules.foo."))

    assertFalse(result.contains("FooPackage()"))
    assertFalse(result.contains("FooModule::class.java"))
    assertFalse(result.contains("FooService::class.java"))

    assertTrue(result.contains("BarPackage()"))
    assertTrue(result.contains("BarModule::class.java"))
    assertBalanced(result)
  }

  @Test
  fun `empty prefix set leaves content untouched`() {
    assertEquals(generated, stripFusedPackageListEntries(generated, emptySet()))
  }
}
