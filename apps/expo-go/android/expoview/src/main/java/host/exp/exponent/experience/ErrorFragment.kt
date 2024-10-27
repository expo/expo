package host.exp.exponent.experience

import android.app.Activity
import android.os.Bundle
import android.text.method.LinkMovementMethod
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.text.HtmlCompat
import androidx.fragment.app.Fragment
import host.exp.exponent.analytics.EXL
import host.exp.expoview.R
import host.exp.expoview.databinding.ErrorFragmentBinding
import java.util.regex.Pattern

class ErrorFragment : Fragment() {
  private var _binding: ErrorFragmentBinding? = null
  private val binding get() = _binding!!

  private fun onClickHome() {
    val activity: Activity? = activity
    if (activity is ErrorActivity) {
      activity.onClickHome()
    }
  }

  private fun onClickReload() {
    val activity: Activity? = activity
    if (activity is ErrorActivity) {
      activity.onClickReload()
    }
  }

  private fun onClickViewErrorLog() {
    val activity: Activity? = activity
    if (activity is ErrorActivity) {
      activity.onClickViewErrorLog()
    }
  }

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View {
    _binding = ErrorFragmentBinding.inflate(inflater, container, false)

    binding.homeButton.setOnClickListener { onClickHome() }
    binding.reloadButton.setOnClickListener { onClickReload() }
    binding.viewErrorLog.setOnClickListener { onClickViewErrorLog() }

    val bundle = arguments
    val isDebugModeEnabled = bundle!!.getBoolean(ErrorActivity.DEBUG_MODE_KEY)
    val userErrorMessage = bundle.getString(ErrorActivity.USER_ERROR_MESSAGE_KEY)
    val developerErrorMessage = bundle.getString(ErrorActivity.DEVELOPER_ERROR_MESSAGE_KEY)
    val errorHeader = bundle.getString(ErrorActivity.ERROR_HEADER_KEY)
    val canRetry = bundle.getBoolean(ErrorActivity.CAN_RETRY_KEY, true)

    var defaultErrorMessage = userErrorMessage

    val manifestUrl = bundle.getString(ErrorActivity.MANIFEST_URL_KEY)
    val isHomeError = bundle.getBoolean(ErrorActivity.IS_HOME_KEY, false)

    val userFacingErrorMessage = getString(R.string.error_default_client)
    if (defaultErrorMessage.isNullOrEmpty()) {
      defaultErrorMessage = if (isDebugModeEnabled) {
        developerErrorMessage
      } else {
        userFacingErrorMessage
      }
    }

    if (isHomeError || manifestUrl == null) {
      // Cannot go home in any of these cases
      binding.homeButton.visibility = View.GONE
    }

    if (!canRetry) {
      binding.reloadButton.visibility = View.GONE
    }

    // Some errors are in HTML format and contain hyperlinks with instructions / more information (
    // eq. EXPERIENCE_SDK_VERSION_OUTDATED). We detect HTML tags and render that text as HTML.
    val htmlPattern = Pattern.compile("<([A-Za-z][A-Za-z0-9]*)\\b[^>]*>(.*?)</\\1>")

    if (htmlPattern.matcher(defaultErrorMessage).find()) {
      binding.errorMessage.text = HtmlCompat.fromHtml(defaultErrorMessage!!, HtmlCompat.FROM_HTML_MODE_COMPACT)
    } else {
      binding.errorMessage.text = defaultErrorMessage
    }

    binding.errorMessage.movementMethod = LinkMovementMethod.getInstance()

    if (errorHeader != null) {
      binding.errorHeader.text = errorHeader
    }

    EXL.e(TAG, "ErrorActivity message: $defaultErrorMessage")

    return binding.root
  }

  companion object {
    private val TAG = ErrorFragment::class.java.simpleName
  }
}
