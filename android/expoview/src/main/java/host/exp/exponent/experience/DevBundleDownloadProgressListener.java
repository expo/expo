// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.support.annotation.Nullable;

public interface DevBundleDownloadProgressListener {
  void onProgress(@Nullable String status, @Nullable Integer done, @Nullable Integer total);
}
