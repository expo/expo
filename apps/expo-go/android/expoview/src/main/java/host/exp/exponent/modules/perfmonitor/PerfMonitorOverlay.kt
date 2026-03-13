package host.exp.exponent.modules.perfmonitor

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.facebook.react.bridge.ReactContext
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

internal class PerfMonitorOverlay(
  private val context: Context,
  private val dataSource: PerfMonitorDataSource,
  private val onClose: () -> Unit
) : PerfMonitorDataSource.Listener {

  private val lifecycleOwner = OverlayLifecycleOwner()
  private val composeView = ComposeView(context)
  private var snapshot by mutableStateOf<PerfMonitorDataSource.Snapshot?>(null)
  private var isShowing = false
  private var lastX = 0f
  private var lastY = 0f
  private var isDragging = false
  private var reactContext: ReactContext? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  private val dragThreshold = 20 * context.resources.displayMetrics.density
  private val container = object : FrameLayout(context) {
    override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          lastX = event.rawX
          lastY = event.rawY
          isDragging = false
          return false
        }

        MotionEvent.ACTION_MOVE -> {
          val dx = event.rawX - lastX
          val dy = event.rawY - lastY

          if (!isDragging && (abs(dx) > dragThreshold || abs(dy) > dragThreshold)) {
            isDragging = true
            return true
          }
          return isDragging
        }
      }
      return false
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
      when (event.action) {
        MotionEvent.ACTION_MOVE -> {
          if (isDragging) {
            val dx = event.rawX - lastX
            val dy = event.rawY - lastY
            x += dx
            y += dy
            lastX = event.rawX
            lastY = event.rawY
            return true
          }
        }

        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
          isDragging = false
          return true
        }
      }
      return super.onTouchEvent(event)
    }
  }

  init {
    composeView.setViewTreeLifecycleOwner(lifecycleOwner)
    composeView.setViewTreeSavedStateRegistryOwner(lifecycleOwner)

    composeView.setContent {
      MaterialTheme(colorScheme = perfMonitorColorScheme) {
        val currentSnapshot = snapshot
        if (currentSnapshot != null) {
          PerfMonitorCard(snapshot = currentSnapshot, onClose = onClose)
        } else {
          PerfMonitorCard(
            snapshot = PerfMonitorDataSource.Snapshot(
              uiTrack = PerfMonitorDataSource.Track("UI", 0, emptyList()),
              jsTrack = PerfMonitorDataSource.Track("JS", 0, emptyList()),
              rssMB = 0.0,
              layoutDurationMs = 0.0
            ),
            onClose = onClose
          )
        }
      }
    }

    container.addView(
      composeView,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.WRAP_CONTENT,
        FrameLayout.LayoutParams.WRAP_CONTENT
      )
    )
  }

  fun setReactContext(context: ReactContext?) {
    this.reactContext = context
    if (isShowing && container.parent == null) {
      show()
    }
  }

  fun show() {
    if (isShowing) {
      return
    }

    mainHandler.post {
      if (isShowing) {
        return@post
      }

      val activity = reactContext?.currentActivity
      val rootView =
        activity?.window?.decorView?.findViewById<ViewGroup>(android.R.id.content)

      if (rootView == null) {
        isShowing = true
        return@post
      }

      isShowing = true
      lifecycleOwner.resume()
      dataSource.addListener(this)

      try {
        val displayMetrics = context.resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val topMargin = (100 * displayMetrics.density).toInt()

        val params = FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.WRAP_CONTENT,
          FrameLayout.LayoutParams.WRAP_CONTENT
        )

        rootView.addView(container, params)

        container.post {
          val x = (screenWidth - container.width) / 2f
          container.x = x
          container.y = topMargin.toFloat()
        }
      } catch (_: Throwable) {
        isShowing = false
        lifecycleOwner.pause()
        dataSource.removeListener(this)
      }
    }
  }

  fun hide() {
    if (!isShowing) return

    mainHandler.post {
      if (!isShowing) {
        return@post
      }
      isShowing = false
      dataSource.removeListener(this)
      try {
        (container.parent as? ViewGroup)?.removeView(container)
      } catch (_: Throwable) {
      }
      lifecycleOwner.pause()
    }
  }

  fun isShowing() = isShowing

  override fun onSnapshot(snapshot: PerfMonitorDataSource.Snapshot) {
    this.snapshot = snapshot
  }
}

@Composable
private fun PerfMonitorCard(
  snapshot: PerfMonitorDataSource.Snapshot,
  onClose: () -> Unit
) {
  Surface(
    modifier = Modifier
      .fillMaxWidth(0.9f)
      .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(18.dp)),
    shape = RoundedCornerShape(18.dp),
    color = Color(0xFF1C1F29),
    shadowElevation = 16.dp
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      Header(onClose = onClose)
      Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        UITrackCard(snapshot.uiTrack, Modifier.weight(1f))
        UITrackCard(snapshot.jsTrack, Modifier.weight(1f))
      }
      Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth()
      ) {
        StatTile(
          title = "RAM",
          value = "${snapshot.rssMB.format()} MB",
          modifier = Modifier.weight(1f)
        )
        StatTile(
          title = "Hermes",
          value = "—",
          modifier = Modifier.weight(1f)
        )
        StatTile(
          title = "Layout",
          value = "${snapshot.layoutDurationMs.format(1)} ms",
          modifier = Modifier.weight(1f)
        )
      }
    }
  }
}

@Composable
private fun Header(onClose: () -> Unit) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = Modifier.fillMaxWidth()
  ) {
    Text(
      text = "Performance monitor",
      color = Color.White,
      style = MaterialTheme.typography.titleMedium,
      modifier = Modifier.weight(1f)
    )
    Icon(
      painter = painterResource(android.R.drawable.ic_menu_close_clear_cancel),
      contentDescription = "Close",
      tint = Color.White.copy(alpha = 0.8f),
      modifier = Modifier
        .clickable(onClick = onClose)
        .padding(4.dp)
    )
  }
}

@Composable
private fun UITrackCard(track: PerfMonitorDataSource.Track, modifier: Modifier = Modifier) {
  Column(
    verticalArrangement = Arrangement.spacedBy(8.dp),
    modifier = modifier
      .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
      .padding(12.dp)
  ) {
    Graph(track.history)
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
      Text(
        text = track.label.uppercase(),
        color = Color.White.copy(alpha = 0.65f),
        style = MaterialTheme.typography.labelMedium,
        modifier = Modifier.weight(1f)
      )
      Text(
        text = "${track.currentFps} fps",
        color = Color.White,
        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
      )
    }
  }
}

@Composable
private fun Graph(samples: List<Double>) {
  val clamped = samples.map { min(max(it, 0.0), 120.0) }
  val accentColor = Color(0xFF458CFA)

  Canvas(
    modifier = Modifier
      .fillMaxWidth()
      .height(58.dp)
  ) {
    if (clamped.isEmpty()) return@Canvas

    val stepX = if (clamped.size <= 1) size.width else size.width / (clamped.size - 1)
    val points = clamped.mapIndexed { index, value ->
      val x = stepX * index
      val normalized = (value / 120.0f).coerceIn(0.0, 1.0)
      val y = size.height - (normalized * size.height)
      Offset(x, y.toFloat())
    }

    if (points.isEmpty()) return@Canvas

    val gradientPath = Path().apply {
      moveTo(points.first().x, size.height)
      lineTo(points.first().x, points.first().y)
      points.forEach { point ->
        lineTo(point.x, point.y)
      }
      lineTo(points.last().x, size.height)
      close()
    }

    drawPath(
      path = gradientPath,
      brush = Brush.verticalGradient(
        colors = listOf(
          accentColor.copy(alpha = 0.5f),
          accentColor.copy(alpha = 0.08f)
        ),
        startY = 0f,
        endY = size.height
      ),
      style = Fill
    )

    for (i in 0 until points.size - 1) {
      drawLine(
        color = accentColor,
        start = points[i],
        end = points[i + 1],
        strokeWidth = 2.2f
      )
    }
  }
}

@Composable
private fun StatTile(title: String, value: String, modifier: Modifier = Modifier) {
  Column(
    modifier = modifier
      .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
      .padding(vertical = 10.dp),
    verticalArrangement = Arrangement.spacedBy(2.dp),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    Text(
      text = title,
      color = Color.White.copy(alpha = 0.6f),
      style = MaterialTheme.typography.labelMedium
    )
    Text(
      text = value,
      color = Color.White,
      style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
    )
  }
}

private fun Double.format(decimals: Int = 2): String = String.format("%.${decimals}f", this)

private val perfMonitorColorScheme = darkColorScheme(
  primary = Color(0xFF458CFA),
  onPrimary = Color.White,
  secondary = Color(0xFF458CFA),
  background = Color(0xFF1C1F29),
  surface = Color(0xFF1C1F29),
  onSurface = Color.White
)

private class OverlayLifecycleOwner : LifecycleOwner, SavedStateRegistryOwner {
  private val lifecycleRegistry = LifecycleRegistry(this)
  private val savedStateRegistryController = SavedStateRegistryController.create(this)

  init {
    lifecycleRegistry.currentState = Lifecycle.State.INITIALIZED
    savedStateRegistryController.performRestore(null)
  }

  override val lifecycle: Lifecycle
    get() = lifecycleRegistry

  override val savedStateRegistry: SavedStateRegistry
    get() = savedStateRegistryController.savedStateRegistry

  fun resume() {
    lifecycleRegistry.currentState = Lifecycle.State.RESUMED
  }

  fun pause() {
    lifecycleRegistry.currentState = Lifecycle.State.CREATED
  }
}
