package expo.modules.devmenu

import com.google.common.truth.Truth
import devmenu.expo.modules.vendored.VendoredClass
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import expo.modules.unvendored.UnvendoredClass

@RunWith(RobolectricTestRunner::class)
internal class DevMenuUtilsTest {

  @Test
  fun `checks if getPrivateFiled returns correct value of private field`() {
    @Suppress("unused")
    class TestClass {
      private val intField = 10
      private val stringField = "expo is awesome"
    }

    val obj = TestClass()

    val intValue = getPrivateFiled<Int>(
      obj,
      TestClass::class.java,
      "intField"
    )
    val stringValue = getPrivateFiled<String>(
      obj,
      TestClass::class.java,
      "stringField"
    )

    Truth.assertThat(intValue).isEqualTo(10)
    Truth.assertThat(stringValue).isEqualTo("expo is awesome")
  }

  @Test
  fun `checks if setPrivateField can set private field`() {
    class TestClass {
      var intField = 10
        private set
    }

    val obj = TestClass()
    setPrivateField(
      obj,
      TestClass::class.java,
      "intField",
      20
    )

    Truth.assertThat(obj.intField).isEqualTo(20)
  }

  @Test
  fun `checks if getVendoredClass finds vendored class`() {
    val vendoredClass = getVendoredClass<VendoredClass>(
      "expo.modules.vendored.VendoredClass",
      emptyArray(),
      emptyArray()
    )

    Truth.assertThat(vendoredClass.javaClass.name).isEqualTo("devmenu.expo.modules.vendored.VendoredClass")
  }

  @Test
  fun `checks if getVendoredClass fallbacks to not vendored class`() {
    val unVendoredClass = getVendoredClass<UnvendoredClass>(
      "expo.modules.unvendored.UnvendoredClass",
      emptyArray(),
      emptyArray()
    )

    Truth.assertThat(unVendoredClass.javaClass.name).isEqualTo("expo.modules.unvendored.UnvendoredClass")
  }
}
