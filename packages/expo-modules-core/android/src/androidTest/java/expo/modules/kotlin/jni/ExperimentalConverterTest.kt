package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import org.junit.Test

class ExperimentalConverterTest {

  @Test
  fun primitive_arguments_should_be_convertible() = withSingleModule({
    Function("simpleList") { listOf(1, 2, 3, 4, 5, 6) }
      .UseExperimentalConverter()
    Function("listWithMixedData") { listOf(1, 2, 3, "string", "expo" to "modules") }
      .UseExperimentalConverter()
    Function("complexList") { listOf(listOf(1, 2, "string"), listOf("expo", "modules"), listOf(listOf(1, 2, 3))) }
      .UseExperimentalConverter()
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
}
