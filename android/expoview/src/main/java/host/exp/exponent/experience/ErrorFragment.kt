package host.exp.exponent.experience

import android.app.Activity
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import host.exp.exponent.Constants
import host.exp.exponent.analytics.EXL
import host.exp.expoview.R
import host.exp.expoview.databinding.ErrorFragmentBinding

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
    var defaultErrorMessage = userErrorMessage

    val manifestUrl = bundle.getString(ErrorActivity.MANIFEST_URL_KEY)
    val isHomeError = bundle.getBoolean(ErrorActivity.IS_HOME_KEY, false)
    val isShellApp = manifestUrl != null && manifestUrl == Constants.INITIAL_URL

    val userFacingErrorMessage = if (isShellApp) {
      getString(R.string.error_default_shell)
    } else {
      getString(R.string.error_default_client)
    }
    if (defaultErrorMessage == null || defaultErrorMessage.isEmpty()) {
      defaultErrorMessage = if (isDebugModeEnabled) {
        developerErrorMessage
      } else {
        userFacingErrorMessage
      }
    }

    if (isHomeError || manifestUrl == null || manifestUrl == Constants.INITIAL_URL) {
      // Cannot go home in any of these cases
      binding.homeButton.visibility = View.GONE
    }

    binding.errorMessage.text = defaultErrorMessage

    EXL.e(TAG, "ErrorActivity message: $defaultErrorMessage")

    return binding.root
  }

  companion object {
    private val TAG = ErrorFragment::class.java.simpleName
  }
}
