package expo.modules.medialibrary

import android.provider.MediaStore
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.reflect.jvm.internal.impl.load.kotlin.JvmType

@RunWith(RobolectricTestRunner::class)
internal class GetQueryInfoTest {

  @Test
  fun `test if first value is handled properly`() {
    // arrange
    val limit = 5.0
    val inputMap = mapOf(
      "first" to limit
    )

    // act
    val queryInfo = GetQueryInfo(inputMap).invoke()

    // assert
    assertEquals(queryInfo.limit, limit.toInt())
  }

  @Test
  fun `test if no input gives default values`() {
    // arrange
    val expectedSelection = "${MediaStore.Files.FileColumns.MEDIA_TYPE} != ${MediaStore.Files.FileColumns.MEDIA_TYPE_NONE}";

    // act
    val queryInfo = GetQueryInfo(emptyMap()).invoke()

    // assert
    assertEquals(20, queryInfo.limit)
    assertEquals(0, queryInfo.offset)
    assertEquals(expectedSelection, queryInfo.selection)
    assertEquals(MediaStore.Images.Media.DEFAULT_SORT_ORDER, queryInfo.order)
  }
}
