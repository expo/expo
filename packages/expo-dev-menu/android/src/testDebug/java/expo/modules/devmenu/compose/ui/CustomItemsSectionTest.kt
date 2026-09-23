package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.devmenu.compose.newtheme.AppTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class CustomItemsSectionTest {
  @get:Rule
  val compose = createComposeRule()

  @Test
  fun groupsInterleavedItemsInFirstSeenOrder() {
    compose.setContent {
      AppTheme {
        Column {
          CustomItemsSection(
            listOf(
              item("Intro", "Previews"),
              item("Profile", "Account"),
              item("Card", "Previews"),
              item("Legacy")
            )
          ) {}
        }
      }
    }

    val labels = listOf("PREVIEWS", "Intro", "Card", "ACCOUNT", "Profile", "CUSTOM MENU ITEMS", "Legacy")
    val positions = labels.map { compose.onNodeWithText(it).fetchSemanticsNode().boundsInRoot.top }
    assertTrue(positions.zipWithNext().all { (first, second) -> first < second })
  }

  @Test
  fun validMissingAndOmittedIconsKeepItemsClickable() {
    val clicked = mutableListOf<String>()
    val items = listOf(
      item("Valid icon", icon = "home"),
      item("Missing icon", icon = "missing_dev_menu_icon"),
      item("No icon")
    )
    compose.setContent {
      AppTheme {
        Column {
          CustomItemsSection(items) { clicked.add(it.name) }
        }
      }
    }

    items.forEach { compose.onNodeWithText(it.name).assertIsDisplayed().performClick() }
    assertEquals(items.map { it.name }, clicked)
  }

  @Test
  fun replacingAndClearingItemsRemovesOldSections() {
    val items = mutableStateOf(listOf(item("Old action", "Old group")))
    compose.setContent {
      AppTheme {
        Column {
          CustomItemsSection(items.value) {}
        }
      }
    }
    compose.onNodeWithText("OLD GROUP").assertIsDisplayed()
    compose.runOnIdle { items.value = listOf(item("New action", "New group")) }
    compose.onNodeWithText("OLD GROUP").assertDoesNotExist()
    compose.onNodeWithText("Old action").assertDoesNotExist()
    compose.onNodeWithText("NEW GROUP").assertIsDisplayed()
    compose.onNodeWithText("New action").assertIsDisplayed()
    compose.runOnIdle { items.value = emptyList() }
    compose.onNodeWithText("NEW GROUP").assertDoesNotExist()
    compose.onNodeWithText("New action").assertDoesNotExist()
  }

  private fun item(name: String, group: String? = null, icon: String? = null) =
    DevMenuState.CustomItem(name, shouldCollapse = true, icon = icon, group = group) {}
}
