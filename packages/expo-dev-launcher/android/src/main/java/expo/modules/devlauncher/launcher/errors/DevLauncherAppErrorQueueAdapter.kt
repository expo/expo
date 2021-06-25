package expo.modules.devlauncher.launcher.errors

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import expo.modules.devlauncher.R
import expo.modules.devlauncher.databinding.ErrorConsoleListItemBinding
import java.text.SimpleDateFormat
import java.util.*

class DevLauncherAppErrorQueueAdapter(
  context: Context,
  data: List<DevLauncherAppError>
) : ArrayAdapter<DevLauncherAppError>(
  context,
  -1,
  data
) {

  override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
    val error = getItem(position)!!
    val currentView = convertView
      ?: LayoutInflater.from(context).inflate(R.layout.error_console_list_item, parent, false)
    val binding = ErrorConsoleListItemBinding.bind(currentView)

    if (error.message != null) {
      binding.errorConsoleItemMessage.text = error.message
    }

    binding.errorConsoleItemTimestamp.text = SimpleDateFormat("HH:mm:ss", Locale.US).format(error.timestamp)
    return binding.root
  }
}
