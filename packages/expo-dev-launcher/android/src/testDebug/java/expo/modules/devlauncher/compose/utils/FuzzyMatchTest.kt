package expo.modules.devlauncher.compose.utils

import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class FuzzyMatchTest {
  @Test
  fun `matches contiguous substrings`() {
    Truth.assertThat(fuzzyMatch("feat", "feature/search")).isTrue()
    Truth.assertThat(fuzzyMatch("search", "feature/search")).isTrue()
  }

  @Test
  fun `matches are case-insensitive`() {
    Truth.assertThat(fuzzyMatch("MAIN", "main")).isTrue()
    Truth.assertThat(fuzzyMatch("main", "MAIN")).isTrue()
  }

  @Test
  fun `an empty query matches everything`() {
    Truth.assertThat(fuzzyMatch("", "anything")).isTrue()
    Truth.assertThat(fuzzyMatch("", "")).isTrue()
  }

  @Test
  fun `matches non-contiguous characters as long as order is preserved`() {
    Truth.assertThat(fuzzyMatch("fs", "feature/search")).isTrue()
    Truth.assertThat(fuzzyMatch("ftsh", "feature/search")).isTrue()
  }

  @Test
  fun `matches broadly, a tiny query can hit unrelated branch names`() {
    Truth.assertThat(fuzzyMatch("ee", "feature/search")).isTrue()
    Truth.assertThat(fuzzyMatch("ee", "release/hotfix")).isTrue()
    Truth.assertThat(fuzzyMatch("ee", "develop")).isTrue()
    Truth.assertThat(fuzzyMatch("fresh", "feature/search")).isTrue()
    Truth.assertThat(fuzzyMatch("sea", "feature/search")).isTrue()
  }

  @Test
  fun `returns false when a character is missing`() {
    Truth.assertThat(fuzzyMatch("z", "feature/search")).isFalse()
    Truth.assertThat(fuzzyMatch("searchx", "feature/search")).isFalse()
  }

  @Test
  fun `returns false when characters are out of order`() {
    Truth.assertThat(fuzzyMatch("hs", "search")).isFalse()
  }
}
