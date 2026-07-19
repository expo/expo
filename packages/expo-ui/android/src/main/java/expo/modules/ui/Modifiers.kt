package expo.modules.ui

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId

/**
 * Applies a test tag to a modifier if a testID is provided.
 */
@OptIn(ExperimentalComposeUiApi::class)
fun Modifier.applyTestTag(testID: String?): Modifier =
  if (!testID.isNullOrEmpty()) {
    this
      .semantics { testTagsAsResourceId = true }
      .testTag(testID)
  } else {
    this
  }
