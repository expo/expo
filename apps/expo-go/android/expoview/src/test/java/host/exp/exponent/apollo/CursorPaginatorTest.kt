package host.exp.exponent.apollo

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CursorPaginatorTest {
  @Test
  fun appendsPagesAndStopsWhenServerSaysNoNextPage() = runTest {
    val pages = mapOf(
      null to CursorPage(listOf("a", "b"), hasNextPage = true, endCursor = "c1"),
      "c1" to CursorPage(listOf("c"), hasNextPage = false, endCursor = "c2")
    )
    val requested = mutableListOf<String?>()
    val paginator = CursorPaginator<String>(defaultLimit = 2) { first, after ->
      requested += after
      assertEquals(2, first)
      pages.getValue(after)
    }

    paginator.loadMore()
    assertEquals(listOf("a", "b"), paginator.data.value)
    assertFalse(paginator.isLastPage.value)

    paginator.loadMore()
    assertEquals(listOf("a", "b", "c"), paginator.data.value)
    assertTrue(paginator.isLastPage.value)

    paginator.loadMore()
    assertEquals(listOf(null, "c1"), requested)
  }
}
