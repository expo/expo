package expo.modules.kotlin.modules

import com.google.common.truth.Truth
import com.google.gson.Gson
import com.google.gson.internal.`$Gson$Types`
import com.google.gson.reflect.TypeToken
import expo.modules.core.Promise
import org.junit.Assert
import org.junit.Test

class ModuleDefinitionBuilderTest {

  @Test
  fun `builder should throw if modules name wasn't provided`() {
    Assert.assertThrows(IllegalArgumentException::class.java) {
      module { }
    }

    Assert.assertThrows(IllegalArgumentException::class.java) {
      module {
        method("method") { _: Int, _: Int -> }
      }
    }
  }

  @Test
  fun `builder should constructed correct definition`() {
    val moduleName = "Module"
    val moduleConstants = emptyMap<String, Any?>()

    val moduleDefinition = module {
      name(moduleName)
      constants {
        moduleConstants
      }
      method("m1") { _: Int -> }
      method("m2") { _: Int, _: Promise -> }
    }

    Truth.assertThat(moduleDefinition.name).isEqualTo(moduleName)
    Truth.assertThat(moduleDefinition.constantsProvider()).isSameInstanceAs(moduleConstants)
    Truth.assertThat(moduleDefinition.methods).containsKey("m1")
    Truth.assertThat(moduleDefinition.methods).containsKey("m2")
  }

  @Test
  fun `can interfere complex type`() {
    val typeToken = object : TypeToken<Array<String>>() {}
    typeToken.type
    val elementType = `$Gson$Types`.getCollectionElementType(typeToken.type, typeToken.rawType)


    val list = Gson().fromJson<List<String>>("""
      ["123", "3123", "312"]
    """.trimIndent(), object : TypeToken<List<String>>() {}.type)

  }
}
