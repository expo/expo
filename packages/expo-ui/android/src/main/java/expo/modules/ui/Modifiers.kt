package expo.modules.ui

import androidx.compose.ui.Modifier
import expo.modules.kotlin.sharedobjects.SharedRef

class ExpoModifier(ref: Modifier?) : SharedRef<Modifier?>(ref) {}

fun Modifier.fromExpoModifiers(
  modifiers: List<ExpoModifier>
): Modifier {
  // Start from the current Modifier instance instead of creating a new one with padding(0.dp)
  return modifiers.fold(this) { acc, modifier ->
    val ref = modifier.ref
    // Use acc.then(ref) to chain modifiers appropriately, include a null check directly in the fold
    ref?.let { acc.then(it) } ?: acc
  }
}
