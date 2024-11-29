package expo.modules.rncompatibility

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.style.BoxShadow

/**
 * A compatible wrapper of [BoxShadow.parse] for React Native compatibility
 * TODO(kudo,20241127): Remove this when we drop react-native 0.76 support
 */
@Suppress("UNUSED_PARAMETER")
fun parseBoxShadow(boxShadow: ReadableMap, context: Context): BoxShadow? {
  return BoxShadow.parse(boxShadow)
}
