package expo.modules.ui.listDetails


import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier
import expo.modules.kotlin.views.ExpoView
import com.facebook.react.uimanager.PixelUtil.pxToDp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import kotlin.math.abs

data class ListDetailProps(
  val isExpanded: MutableState<Boolean> = mutableStateOf(false),
) : ComposeProps


abstract class BaseContentView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private var previousWidth: Int = 0
  private var previousHeight: Int = 0
  private var lastUpdateTime: Long = 0
  private val updateThresholdMs = 16L

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int
  ) {
    super.onLayout(changed, left, top, right, bottom)

    val currentTime = System.currentTimeMillis()

    // Check if enough time has passed since last update
    if (currentTime - lastUpdateTime < updateThresholdMs) {
      return
    }

    val width = right - left
    val height = bottom - top
    val widthChanged = abs(width - previousWidth) >= 10
    val heightChanged = abs(height - previousHeight) >= 10

    if (changed && (widthChanged || heightChanged)) {
      lastUpdateTime = currentTime
      shadowNodeProxy.setViewSize(width.pxToDp().toDouble(), height.pxToDp().toDouble())
      previousWidth = width
      previousHeight = height
    }
  }
}

class ListContentView(context: Context, appContext: AppContext) :
  BaseContentView(context, appContext)

class DetailContentView(context: Context, appContext: AppContext) :
  BaseContentView(context, appContext)

class ListDetailView(context: Context, appContext: AppContext) :
  ExpoComposeView<ListDetailProps>(context, appContext, withHostingView = true) {
  override val props = ListDetailProps()

  var listContent: ListContentView? = null
  var detailContent: DetailContentView? = null

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    when (child) {
      is ListContentView -> {
        if (listContent == null) {
          listContent = child
        } else {
          Log.w("EXPO_SPLIT", "listContent is already set")
        }
      }

      is DetailContentView -> {
        if (detailContent == null) {
          detailContent = child
        } else {
          Log.w("EXPO_SPLIT", "detailContent is already set")
        }
      }

      else -> {
        super.addView(child, index, params)
      }
    }
  }

  override fun removeView(view: View) {
    when (view) {
      listContent -> {
        listContent = null
        // Only call super.removeView if the view is actually our child
        if (view.parent == this) {
          super.removeView(view)
        }
      }

      detailContent -> {
        detailContent = null
        // Only call super.removeView if the view is actually our child
        if (view.parent == this) {
          super.removeView(view)
        }
      }

      else -> super.removeView(view)
    }
  }

  @Composable
  override fun Content(modifier: Modifier) {
    val currentListContent = listContent
    val currentDetailContent = detailContent
    if (currentListContent != null && currentDetailContent != null) {
      ListDetailViewComposable(
        listContent = currentListContent,
        detailContent = currentDetailContent,
      )
    } else {
      Box(modifier = Modifier)
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // Clean up references when detached
    listContent = null
    detailContent = null
  }
}