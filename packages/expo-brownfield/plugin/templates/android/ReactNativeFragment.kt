package ${{packageId}}

import android.app.Activity
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.commit

class ReactNativeFragment : Fragment() {
  override fun onCreateView(
      inflater: LayoutInflater,
      container: ViewGroup?,
      savedInstanceState: Bundle?,
  ): FrameLayout {
    return ReactNativeViewFactory.createFrameLayout(
        requireContext(),
        requireActivity(),
        RootComponent.Main,
    )
  }

  companion object {
    private const val TAG = "ReactNativeFragment"

    fun createFragmentHost(activity: Activity): ViewGroup {
      val layout =
          object : FrameLayout(activity) {
            init {
              id = generateViewId()
            }
          }

      val fragment = createAndCommit(activity, layout)

      return layout
    }

    internal fun createAndCommit(
        activity: Activity,
        container: ViewGroup,
    ): ReactNativeFragment {
      val fragmentManager = (activity as FragmentActivity).supportFragmentManager

      val fragment = ReactNativeFragment()

      fragmentManager.commit(true) {
        setReorderingAllowed(true)
        add(container.id, fragment, TAG)
      }

      return fragment
    }

    internal fun findIn(activity: Activity): ReactNativeFragment? {
      val activity = activity ?: return null
      return (activity as FragmentActivity).supportFragmentManager.findFragmentByTag(TAG)
          as ReactNativeFragment?
    }
  }
}
