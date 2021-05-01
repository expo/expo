package expo.modules.devlauncher.launcher.errors.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import expo.modules.devlauncher.databinding.ErrorConsoleFragmentBinding
import expo.modules.devlauncher.launcher.errors.DevLauncherAppErrorQueueAdapter
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivity
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivityInterface

class DevLauncherErrorConsoleFragment : Fragment() {
  internal lateinit var binding: ErrorConsoleFragmentBinding

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
    binding = ErrorConsoleFragmentBinding.inflate(inflater, container, false)
    val errors = (context as DevLauncherErrorActivity).getErrors()
    binding.listView.adapter = DevLauncherAppErrorQueueAdapter(context!!, errors)

    binding.consoleHomeButton.setOnClickListener {
      val activity = (context as DevLauncherErrorActivityInterface)
      activity.launchHome()
    }

    binding.consoleReloadButton.setOnClickListener {
      val activity = (context as DevLauncherErrorActivityInterface)
      activity.reload()
    }

    return binding.root
  }
}
