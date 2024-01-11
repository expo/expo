package host.exp.exponent.experience

import android.widget.ArrayAdapter
import android.app.Activity
import android.view.LayoutInflater
import android.view.ViewGroup
import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import host.exp.exponent.kernel.ExponentError
import host.exp.expoview.databinding.ErrorConsoleFragmentBinding

class ErrorConsoleFragment : Fragment() {
  private var _binding: ErrorConsoleFragmentBinding? = null
  private val binding get() = _binding!!

  lateinit var adapter: ArrayAdapter<ExponentError>

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

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View {
    _binding = ErrorConsoleFragmentBinding.inflate(inflater, container, false)
    binding.consoleHomeButton.setOnClickListener { onClickHome() }
    binding.consoleReloadButton.setOnClickListener { onClickReload() }

    val bundle = arguments
    val manifestUrl = bundle!!.getString(ErrorActivity.MANIFEST_URL_KEY)
    val isHomeError = bundle.getBoolean(ErrorActivity.IS_HOME_KEY, false)
    if (isHomeError || manifestUrl == null) {
      // Cannot go home in any of these cases
      binding.consoleHomeButton.visibility = View.GONE
    }

    val errorQueue = ErrorActivity.errorList
    synchronized(errorQueue) {
      val adapter = ErrorQueueAdapter(requireContext(), errorQueue)
      binding.listView.adapter = adapter
      this.adapter = adapter
    }

    return binding.root
  }

  override fun onDestroyView() {
    super.onDestroyView()
    _binding = null
  }
}
