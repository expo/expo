package expo.modules.ui

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.views.ComposableScope

class ExpoModifier(ref: Modifier?) : SharedRef<Modifier?>(ref) {
  var getFromScope: ((ComposableScope) -> Modifier)? = null

  constructor(getFromScope: (ComposableScope) -> Modifier) : this(null) {
    this.getFromScope = getFromScope
  }
}

fun Modifier.fromExpoModifiers(
  modifiers: List<ExpoModifier>,
  composableScope: ComposableScope? = null
): Modifier {
  return modifiers?.fold(this) { acc, modifier ->
    composableScope?.let { holder ->
      modifier.getFromScope?.invoke(holder)?.let {
        return@fold it.then(acc)
      }
    }
    modifier.ref?.let { it.then(acc) } ?: acc
  }
}

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
