package host.exp.exponent.brownfield.test.android

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import host.exp.exponent.brownfield.showReactNativeFragment
import host.exp.exponent.brownfield.BrownfieldActivity

class ReactNativeActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        showReactNativeFragment()
    }

    override fun invokeDefaultOnBackPressed() {
        TODO("Not yet implemented")
    }
}
