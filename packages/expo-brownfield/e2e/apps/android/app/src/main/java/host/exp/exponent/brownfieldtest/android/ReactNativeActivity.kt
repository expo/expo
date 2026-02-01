package host.exp.exponent.brownfieldtest.android

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.community.minimaltester.brownfield.showReactNativeFragment
import com.community.minimaltester.brownfield.BrownfieldActivity

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
