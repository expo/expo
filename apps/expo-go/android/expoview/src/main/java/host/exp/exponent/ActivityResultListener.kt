// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.content.Intent

interface ActivityResultListener {
  fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?)
}
