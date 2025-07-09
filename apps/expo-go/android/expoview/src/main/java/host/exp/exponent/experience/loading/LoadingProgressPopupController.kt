package host.exp.exponent.experience.loading

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.view.Gravity
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.PopupWindow
import android.widget.TextView
import host.exp.exponent.ExpoUpdatesAppLoader
import host.exp.expoview.R
import java.lang.ref.WeakReference
import java.util.*

/**
 * Presents loading progress and messages from bundler/fetcher.
 * Uses PopupWindow to present content above whole application.
 */
class LoadingProgressPopupController(activity: Activity) {
  private val mWeakActivity = WeakReference(activity)
  private var mPopupWindow: PopupWindow? = null
  private var mStatusTextView: TextView? = null
  private var mPercentageTextView: TextView? = null
  private var mContainer: ViewGroup? = null

  fun show() {
    mWeakActivity.get()?.let { activity ->
      if (activity.isFinishing || activity.isDestroyed) {
        return
      }
      activity.runOnUiThread {
        if (mPopupWindow != null) {
          // already showing
          return@runOnUiThread
        }
        val inflater = activity.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        @SuppressLint("InflateParams")
        mContainer = (inflater.inflate(R.layout.loading_progress_popup, null) as ViewGroup).also {
          mStatusTextView = it.findViewById<TextView>(R.id.status_text_view).also { textView ->
            textView.text = "Waiting for server ..."
          }
          mPercentageTextView = it.findViewById(R.id.percentage_text_view)
        }
        mPopupWindow = PopupWindow(mContainer, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).also {
          it.isTouchable = false
          activity.window.decorView.post {
            if (!activity.isFinishing || !activity.isDestroyed) {
              it.showAtLocation(activity.window.decorView, Gravity.BOTTOM, 0, 0)
            }
          }
        }
      }
    }
  }

  fun updateProgress(status: String?, done: Int?, total: Int?) {
    show()
    mWeakActivity.get()?.runOnUiThread {
      mStatusTextView!!.text = status ?: "Building JavaScript bundle..."
      if (done != null && total != null && total > 0) {
        val percent: Float = done.toFloat() / total * 100
        mPercentageTextView!!.text = String.format(Locale.getDefault(), "%.2f%%", percent)
      }
    }
  }

  fun setLoadingProgressStatus(status: ExpoUpdatesAppLoader.AppLoaderStatus) {
    val text = when (status) {
      ExpoUpdatesAppLoader.AppLoaderStatus.CHECKING_FOR_UPDATE -> {
        "Checking for new update..."
      }
      ExpoUpdatesAppLoader.AppLoaderStatus.DOWNLOADING_NEW_UPDATE -> {
        "New update available, downloading..."
      }
    }

    show()
    mWeakActivity.get()?.runOnUiThread {
      mStatusTextView!!.text = text
    }
  }

  fun hide() {
    mWeakActivity.get()?.runOnUiThread {
      if (mPopupWindow == null || !mPopupWindow!!.isShowing) {
        // already hidden
        return@runOnUiThread
      }

      mPopupWindow!!.dismiss()
      mPopupWindow = null
      mContainer = null
      mStatusTextView = null
      mPercentageTextView = null
    }
  }
}
