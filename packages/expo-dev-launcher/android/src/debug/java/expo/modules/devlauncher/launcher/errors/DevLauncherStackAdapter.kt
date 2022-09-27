package expo.modules.devlauncher.launcher.errors

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import expo.modules.devlauncher.R
import expo.modules.devlauncher.databinding.ErrorConsoleListItemBinding

class DevLauncherStackAdapter(
  val context: Context,
  var data: DevLauncherAppError?
) : BaseAdapter() {
  override fun getCount(): Int {
    return data?.error?.stackTrace?.size ?: 0
  }

  override fun getItem(position: Int): Any {
    return data?.error?.stackTrace?.get(position) ?: 0
  }

  override fun getItemId(position: Int): Long {
    return position.toLong()
  }

  override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
    val stackTraceElement = getItem(position) as StackTraceElement

    val currentView = convertView
      ?: LayoutInflater.from(context).inflate(R.layout.error_console_list_item, parent, false)
    val binding = ErrorConsoleListItemBinding.bind(currentView)

    binding.rnFrameMethod.text = stackTraceElement.methodName
    binding.rnFrameFile.text = stackTraceElement.fileName

    return binding.root
  }
}
