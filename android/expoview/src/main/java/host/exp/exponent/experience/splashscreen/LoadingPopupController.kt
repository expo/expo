package host.exp.exponent.experience.splashscreen

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.view.Gravity
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.PopupWindow
import android.widget.TextView
import host.exp.expoview.R
import java.lang.ref.WeakReference
import java.util.*

/**
 * Class responsible for showing progress of the Experience t
 */
class LoadingPopupController(activity: Activity) {
  private val mWeakActivity = WeakReference(activity)
  private var mPopupWindow: PopupWindow? = null
  private var mStatusTextView: TextView? = null
  private var mPercentageTextView: TextView? = null
  private var mContainer: ViewGroup? = null

  fun show() {
    if (mPopupWindow != null && mPopupWindow!!.isShowing) {
      // already showing
      return
    }

    mWeakActivity.get()?.let { activity ->
      activity.runOnUiThread {
        val inflater = activity.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        @SuppressLint("InflateParams")
        mContainer = inflater.inflate(R.layout.loading_popup, null) as ViewGroup
        mStatusTextView = mContainer!!.findViewById(R.id.status_text_view)
        mPercentageTextView = mContainer!!.findViewById(R.id.percentage_text_view)
        mPopupWindow = PopupWindow(mContainer, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        mPopupWindow!!.isTouchable = false
        mPopupWindow!!.showAtLocation(activity.window.decorView, Gravity.BOTTOM, 0, 0)
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

  fun hide() {
    if (mPopupWindow == null || !mPopupWindow!!.isShowing) {
      // already hidden
      return
    }

    mWeakActivity.get()?.runOnUiThread {
      mPopupWindow!!.dismiss()
      mPopupWindow = null
      mContainer = null
      mStatusTextView = null
      mPercentageTextView = null
    }
  }
}