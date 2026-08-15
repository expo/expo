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
    val rootComponent = arguments?.getString("rootComponentName") ?: "main"
    return ReactNativeViewFactory.createFrameLayout(
        requireContext(),
        requireActivity(),
        rootComponent,
    )
  }

  companion object {
    private const val TAG = "ReactNativeFragment"

    fun createFragmentHost(activity: Activity, rootComponent: String = "main"): ViewGroup {
      val layout =
          object : FrameLayout(activity) {
            init {
              id = generateViewId()
            }
          }

      val fragment = createAndCommit(activity, layout, rootComponent)

      return layout
    }

    internal fun createAndCommit(
        activity: Activity,
        container: ViewGroup,
        rootComponent: String = "main",
    ): ReactNativeFragment {
      val fragmentManager = (activity as FragmentActivity).supportFragmentManager

      val fragment = ReactNativeFragment().apply {
        arguments = Bundle().apply { putString("rootComponentName", rootComponent) }
      }

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
