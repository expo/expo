// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.content.Context
import androidx.viewpager.widget.ViewPager
import javax.inject.Inject
import android.os.Bundle
import host.exp.exponent.di.NativeModuleDepsProvider
import android.content.Intent
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentManager
import androidx.fragment.app.FragmentPagerAdapter
import host.exp.exponent.LauncherActivity
import host.exp.exponent.kernel.ExponentError
import host.exp.exponent.kernel.Kernel
import host.exp.expoview.databinding.ErrorActivityNewBinding
import java.util.*

class ErrorActivity() : FragmentActivity() {
  private lateinit var binding: ErrorActivityNewBinding

  private lateinit var pager: ViewPager

  private var manifestUrl: String? = null

  @Inject
  lateinit var context: Context

  @Inject
  lateinit var kernel: Kernel

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ErrorActivityNewBinding.inflate(layoutInflater)
    val view = binding.root
    setContentView(view)
    pager = binding.errorViewPager

    NativeModuleDepsProvider.instance.inject(ErrorActivity::class.java, this)

    ExperienceActivity.removeNotification(this)

    manifestUrl = intent.extras!!.getString(MANIFEST_URL_KEY)
    pager.adapter = ViewPagerAdapter(supportFragmentManager)
  }

  override fun onResume() {
    super.onResume()
    visibleActivity = this
  }

  override fun onPause() {
    super.onPause()
    if (visibleActivity === this) {
      visibleActivity = null
    }
  }

  override fun onBackPressed() {
    if (pager.currentItem == 0) {
      kernel.killActivityStack(this)
    } else {
      pager.currentItem = pager.currentItem - 1
    }
  }

  fun onClickHome() {
    clearErrorList()

    startActivity(Intent(this, LauncherActivity::class.java))

    // Mark as not visible so that any new errors go to a new activity.
    if (visibleActivity === this) {
      visibleActivity = null
    }
    kernel.killActivityStack(this)
  }

  fun onClickReload() {
    if (manifestUrl != null) {
      clearErrorList()

      // Mark as not visible so that any new errors go to a new activity.
      if (visibleActivity === this) {
        visibleActivity = null
      }
      kernel.killActivityStack(this)
      kernel.reloadVisibleExperience(manifestUrl!!)
    } else {
      // Mark as not visible so that any new errors go to a new activity.
      if (visibleActivity === this) {
        visibleActivity = null
      }
      finish()
    }
  }

  fun onClickViewErrorLog() {
    if (pager.currentItem == 0) {
      pager.currentItem = 1
    }
  }

  private inner class ViewPagerAdapter(fm: FragmentManager) : FragmentPagerAdapter(fm) {
    override fun getItem(pos: Int): Fragment {
      val args = intent.extras
      args!!.putString("manifestUrl", manifestUrl)
      return when (pos) {
        1 -> {
          errorConsoleFragment = ErrorConsoleFragment().apply {
            arguments = args
          }
          errorConsoleFragment!!
        }
        else -> {
          ErrorFragment().apply { arguments = args }
        }
      }
    }

    override fun getCount(): Int {
      return 2
    }
  }

  companion object {
    const val IS_HOME_KEY = "isHome"
    const val MANIFEST_URL_KEY = "manifestUrl"
    const val USER_ERROR_MESSAGE_KEY = "userErrorMessage"
    const val DEVELOPER_ERROR_MESSAGE_KEY = "developerErrorMessage"
    const val DEBUG_MODE_KEY = "isDebugModeEnabled"
    const val ERROR_HEADER_KEY = "errorHeader"
    const val CAN_RETRY_KEY = "canRetry"

    @JvmStatic var visibleActivity: ErrorActivity? = null
      private set

    @JvmStatic val errorList = LinkedList<ExponentError>()

    private var errorConsoleFragment: ErrorConsoleFragment? = null

    fun addError(error: ExponentError) {
      synchronized(errorList) { errorList.addFirst(error) }

      // notify ErrorConsoleFragment of the update so that it can refresh its ListView
      if (visibleActivity != null && errorConsoleFragment != null) {
        visibleActivity!!.runOnUiThread {
          errorConsoleFragment!!.adapter.notifyDataSetChanged()
        }
      }
    }

    fun clearErrorList() {
      synchronized(errorList) { errorList.clear() }
    }
  }
}
