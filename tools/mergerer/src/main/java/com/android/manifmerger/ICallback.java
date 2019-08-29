/*
 * Copyright (C) 2012 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.android.manifmerger;

import com.android.annotations.NonNull;

/**
 * Callback used by the ManifestMerger to query the caller.
 */
public interface ICallback {

  int UNKNOWN_CODENAME = 0;

  /**
   * Queries the caller to find the API level for a given provisional API codename, as used in the
   * &lt;uses-sdk&gt; {@code minSdkVersion} field.
   *
   * @param codename A non-null codename string.
   * @return The integer API > 0 for the given codename, or {@link #UNKNOWN_CODENAME}.
   */
  int queryCodenameApiLevel(@NonNull String codename);
}
