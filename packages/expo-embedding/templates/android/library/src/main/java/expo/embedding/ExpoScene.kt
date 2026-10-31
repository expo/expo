package expo.embedding

import android.content.Context
import android.content.ContextWrapper
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.facebook.react.runtime.ReactSurfaceImpl

private class SurfaceHolder {
  var surface: ReactSurfaceImpl? = null
  var props: Bundle? = null
}

private fun Context.expoActivity(): AppCompatActivity? = when (this) {
  is AppCompatActivity -> this
  is ContextWrapper -> baseContext.expoActivity()
  else -> null
}

@Composable
fun ExpoScene(host: ExpoHost, name: String, modifier: Modifier = Modifier, initialProps: Bundle? = null) {
  key(host, name) {
    val holder = remember { SurfaceHolder() }
    AndroidView(
      modifier = modifier,
      factory = { context ->
        val activity = requireNotNull(context.expoActivity()) { "ExpoScene requires an AppCompatActivity. Use an AppCompatActivity-derived host with ExpoActivityDelegate." }
        val delegate = checkNotNull(ExpoActivityDelegate.from(activity)) { "ExpoScene has no Activity delegate. Call expo.attach(this, host) in Activity.onCreate() before setContent()." }
        require(delegate.host === host) { "ExpoScene must use the host attached to its Activity's ExpoActivityDelegate." }
        // Remove this implementation dependency when ReactSurface exposes prop updates.
        val surface = checkNotNull(host.reactHost.createSurface(activity, name, initialProps) as? ReactSurfaceImpl) {
          "ExpoScene cannot update props for this React Native surface. Use the supported React Native 0.88.0 runtime and rerun expo-embedding init."
        }
        holder.surface = surface
        holder.props = initialProps
        val view = requireNotNull(surface.view)
        surface.start()
        view
      },
      update = {
        if (holder.props !== initialProps) {
          holder.surface?.updateInitProps(initialProps ?: Bundle.EMPTY)
          holder.props = initialProps
        }
      },
      onRelease = {
        holder.surface?.stop()
        holder.surface = null
        holder.props = null
      },
    )
  }
}
