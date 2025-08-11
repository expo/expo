package expo.modules.ui

import androidx.compose.ui.Modifier
import expo.modules.kotlin.sharedobjects.SharedRef

class ExpoModifier(ref: Modifier?) : SharedRef<Modifier?>(ref)

fun Modifier.fromExpoModifiers(
  modifiers: List<ExpoModifier>
): Modifier {
  return modifiers.fold(this) { acc, modifier ->
    val ref = modifier.ref
    ref?.let { acc.then(it) } ?: acc
  }
}
