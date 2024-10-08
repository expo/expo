package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import org.junit.Test

class ExperimentalConverterTest {
  @Test
  fun list_should_be_convertible() = withSingleModule({
    Function<_>("simpleList") { listOf(1, 2, 3, 4, 5, 6) }
      .useExperimentalConverter()
    Function<_>("listWithMixedData") { listOf(1, 2, 3, "string", "expo" to "modules") }
      .useExperimentalConverter()
    Function<_>("complexList") { listOf(listOf(1, 2, "string"), listOf("expo", "modules"), listOf(listOf(1, 2, 3))) }
      .useExperimentalConverter()
  }) {
    val simpleList = call("simpleList").getArray().map { it.getInt() }
    val listWithMixedData = call("listWithMixedData").getArray()
    val complexList = call("complexList").getArray()

    Truth.assertThat(simpleList).containsExactly(1, 2, 3, 4, 5, 6)

    Truth.assertThat(listWithMixedData[0].getInt()).isEqualTo(1)
    Truth.assertThat(listWithMixedData[1].getInt()).isEqualTo(2)
    Truth.assertThat(listWithMixedData[2].getInt()).isEqualTo(3)
    Truth.assertThat(listWithMixedData[3].getString()).isEqualTo("string")

    val (first, second) = listWithMixedData[4].getArray().map { it.getString() }
    Truth.assertThat(first).isEqualTo("expo")
    Truth.assertThat(second).isEqualTo("modules")

    val (inner1, inner2, inner3) = complexList.map { it.getArray() }

    Truth.assertThat(inner1[0].getInt()).isEqualTo(1)
    Truth.assertThat(inner1[1].getInt()).isEqualTo(2)
    Truth.assertThat(inner1[2].getString()).isEqualTo("string")

    Truth.assertThat(inner2[0].getString()).isEqualTo("expo")
    Truth.assertThat(inner2[1].getString()).isEqualTo("modules")

    val nested = inner3[0].getArray().map { it.getInt() }
    Truth.assertThat(nested).containsExactly(1, 2, 3)
  }

  @Test
  fun maps_should_be_convertible() = withSingleModule({
    Function<_>("simpleMap") { mapOf("expo" to "modules", "foo" to "bar") }
      .useExperimentalConverter()
    Function<_>("nestedMap") { mapOf("inner" to mapOf("foo" to "bar"), "expo" to "modules") }
      .useExperimentalConverter()
    Function<_>("mapWithList") { mapOf("list" to listOf(1, 2, 3)) }
      .useExperimentalConverter()
  }) {
    val simpleMap = call("simpleMap").getObject()
    val nestedMap = call("nestedMap").getObject()
    val innerMap = nestedMap["inner"]?.getObject()
    val mapWithList = call("mapWithList").getObject()
    val list = mapWithList["list"]?.getArray()?.map { it.getInt() }

    Truth.assertThat(simpleMap["expo"]?.getString()).isEqualTo("modules")
    Truth.assertThat(simpleMap["foo"]?.getString()).isEqualTo("bar")

    Truth.assertThat(innerMap).isNotNull()
    Truth.assertThat(innerMap!!["foo"]?.getString()).isEqualTo("bar")
    Truth.assertThat(nestedMap["expo"]?.getString()).isEqualTo("modules")

    Truth.assertThat(list).isNotNull()
    Truth.assertThat(list).containsExactly(1, 2, 3)
  }
}
