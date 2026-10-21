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
import com.facebook.react.interfaces.fabric.ReactSurface

private class SurfaceHolder { var surface: ReactSurface? = null }

private fun Context.expoActivity(): AppCompatActivity? = when (this) {
  is AppCompatActivity -> this
  is ContextWrapper -> baseContext.expoActivity()
  else -> null
}

@Composable
fun ExpoScene(host: ExpoHost, name: String, modifier: Modifier = Modifier, initialProps: Bundle? = null) {
  key(host, name, initialProps) {
    val holder = remember { SurfaceHolder() }
    AndroidView(
      modifier = modifier,
      factory = { context ->
        val activity = requireNotNull(context.expoActivity()) { "ExpoScene requires an AppCompatActivity. Use an AppCompatActivity-derived host with ExpoActivityDelegate." }
        val delegate = checkNotNull(ExpoActivityDelegate.from(activity)) { "ExpoScene has no Activity delegate. Call expo.attach(this, host) in Activity.onCreate() before setContent()." }
        require(delegate.host === host) { "ExpoScene must use the host attached to its Activity's ExpoActivityDelegate." }
        val surface = host.reactHost.createSurface(activity, name, initialProps)
        holder.surface = surface
        val view = requireNotNull(surface.view)
        surface.start()
        view
      },
      onRelease = {
        holder.surface?.stop()
        holder.surface = null
      },
    )
  }
}
