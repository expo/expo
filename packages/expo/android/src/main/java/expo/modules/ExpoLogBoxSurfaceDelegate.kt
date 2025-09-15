package expo.modules

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Dialog
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.google.android.material.bottomsheet.BottomSheetDialog

internal class ExpoLogBoxSurfaceDelegate(private val devSupportManager: DevSupportManager) :
    SurfaceDelegate {

    private var dialog: Dialog? = null

    override fun createContentView(appKey: String) {
        // Noop
    }

    override fun isContentViewReady(): Boolean {
        return true
    }

    override fun destroyContentView() {

    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun show() {
        val context: Activity? = devSupportManager.currentActivity
        if (context == null || context.isFinishing) {
            devSupportManager.currentReactContext?.let { reactContext ->
                /**
                 * If the activity isn't available, try again after the next onHostResume(). onHostResume()
                 * is when the activity gets attached to the react native.
                 */
                // TODO: Add
                //runAfterHostResume(reactContext) { this.show() }
                return
            }
//            FLog.e(
//                ReactConstants.TAG,
//                "Unable to launch redbox because react activity and react context is not available, here is the error that redbox would've displayed: ${message ?: "N/A"}")
            return
        }

//        if (redBoxContentView?.context !== context) {
//            // Create a new RedBox when currentActivity get updated
//            createContentView("RedBox")
//        }

        // Create the BottomSheetDialog
        dialog = BottomSheetDialog(context)

        // Create a simple layout programmatically
        val container = WebView(context).apply {
            settings.javaScriptEnabled = true
            webViewClient = WebViewClient()
            loadUrl("file:///android_asset/index.html")
        }

        dialog?.setContentView(container)
        dialog?.show()
    }

    override fun hide() {

    }

    override fun isShowing(): Boolean {
        return dialog?.isShowing == true
    }
}
