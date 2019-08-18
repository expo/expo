// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Intent;

public interface ActivityResultListener {
  void onActivityResult(int requestCode, int resultCode, Intent data);
}
