package expo.modules.devlauncher.launcher.errors.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import expo.modules.devlauncher.databinding.ErrorFragmentBinding
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivityInterface

class DevLauncherErrorFragment : Fragment() {

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
    val binding = ErrorFragmentBinding.inflate(inflater, container, false)

    binding.homeButton.setOnClickListener {
      val activity = (context as DevLauncherErrorActivityInterface)
      activity.launchHome()
    }

    binding.reloadButton.setOnClickListener {
      val activity = (context as DevLauncherErrorActivityInterface)
      activity.reload()
    }

    binding.viewErrorLog.setOnClickListener {
      val activity = (context as DevLauncherErrorActivityInterface)
      activity.onViewErrorLogs()
    }

    return binding.root
  }
}
