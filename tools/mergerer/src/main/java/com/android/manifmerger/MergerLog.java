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
import com.android.annotations.Nullable;
import com.android.utils.ILogger;

/**
 * Helper to create {@link IMergerLog} instances with specific purposes.
 */
public abstract class MergerLog {

  /**
   * Create a new instance of a {@link MergerLog} that prints to an {@link ILogger}.
   *
   * @param sdkLog A non-null {@link ILogger}.
   * @return A new IMergerLog.
   */
  public static IMergerLog wrapSdkLog(@NonNull final ILogger sdkLog) {
    return new IMergerLog() {
      @Override
      public void error(
          @NonNull Severity severity,
          @NonNull FileAndLine location,
          @NonNull String message,
          Object... msgParams) {

        switch (severity) {
          case INFO:
            sdkLog.info(
                "[%1$s] %2$s",                                  //$NON-NLS-1$
                location,
                String.format(message, msgParams));
            break;
          case WARNING:
            sdkLog.warning(
                "[%1$s] %2$s",                                  //$NON-NLS-1$
                location,
                String.format(message, msgParams));
            break;
          case ERROR:
            sdkLog.error(null /*throwable*/,
                "[%1$s] %2$s",                                  //$NON-NLS-1$
                location,
                String.format(message, msgParams));
            break;
        }
      }

      @Override
      public void conflict(@NonNull Severity severity,
          @NonNull FileAndLine location1,
          @NonNull FileAndLine location2,
          @NonNull String message,
          Object... msgParams) {

        switch (severity) {
          case INFO:
            sdkLog.info(
                "[%1$s, %2$s] %3$s",                          //$NON-NLS-1$
                location1,
                location2,
                String.format(message, msgParams));
            break;
          case WARNING:
            sdkLog.warning(
                "[%1$s, %2$s] %3$s",                          //$NON-NLS-1$
                location1,
                location2,
                String.format(message, msgParams));
            break;
          case ERROR:
            sdkLog.error(null /*throwable*/,
                "[%1$s, %2$s] %3$s",                          //$NON-NLS-1$
                location1,
                location2,
                String.format(message, msgParams));
            break;
        }
      }
    };
  }

  /*
   * Creates a new instance of a {@link MergerLog} that wraps another {@link IMergerLog}
   * and overrides the {@link FileAndLine} locations with the arguments specified.
   * <p/>
   * An example of usage would be merging temporary files yet associating the errors
   * with the original files.
   *
   * @param parentLog A non-null IMergerLog to wrap.
   * @param filePath1 The file path to override in location1 (for errors and conflicts).
   * @param filePath2 An optional file path to override in location2 (for conflicts).
   * @return A new IMergerLog.
   */
  public static IMergerLog mergerLogOverrideLocation(
      @NonNull final IMergerLog parentLog,
      @Nullable final String filePath1,
      @Nullable final String... filePath2) {
    return new IMergerLog() {
      @Override
      public void error(
          @NonNull Severity severity,
          @NonNull FileAndLine location,
          @NonNull String message,
          Object... msgParams) {

        if (filePath1 != null) {
          location = new FileAndLine(filePath1, location.getLine());
        }

        parentLog.error(severity, location, message, msgParams);
      }

      @Override
      public void conflict(@NonNull Severity severity,
          @NonNull FileAndLine location1,
          @NonNull FileAndLine location2,
          @NonNull String message,
          Object... msgParams) {

        if (filePath1 != null) {
          location1 = new FileAndLine(filePath1, location1.getLine());
        }

        if (filePath2 != null && filePath2.length > 0) {
          location2 = new FileAndLine(filePath2[0], location2.getLine());
        }

        parentLog.conflict(severity, location1, location2, message, msgParams);
      }
    };
  }
}
