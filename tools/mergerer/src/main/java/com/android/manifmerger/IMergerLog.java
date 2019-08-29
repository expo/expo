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

/**
 * Logger interface for the {@link ManifestMerger}.
 */
public interface IMergerLog {

  /**
   * The reference to the "main manifest" used in {@link FileAndLine} when the path to the main
   * manifest file isn't known. This happens when the {@link ManifestMerger} is called with the
   * {@code process(Document...)} interface.
   */
  String MAIN_MANIFEST = "@main";     //$NON-NLS-1$
  /**
   * The reference to "a library" used in {@link FileAndLine} when the path to the library file
   * isn't known. This happens when the {@link ManifestMerger} is called with the {@code
   * process(Document...)} interface.
   */
  String LIBRARY = "@library";        //$NON-NLS-1$

  /**
   * Logs an error that occurred at a specific single manifest.
   *
   * @param severity Whether this is an actual error or a mere warning.
   * @param location A file and line location of where the error was detected.
   * @param message A message string, suitable for {@link String#format(String, Object...)}.
   * @param msgParams The optional parameters for the {@code message} string.
   */
  void error(
      @NonNull Severity severity,
      @NonNull FileAndLine location,
      @NonNull String message,
      Object... msgParams);

  /**
   * Logs a conflict, that is an error that happens when comparing 2 manifests.
   *
   * @param severity Whether this is an actual error or a mere warning.
   * @param location1 A file and line location of where the error was detected. By convention,
   * location1 is generally the main manifest location.
   * @param location2 A file and line location of where the error was detected. By convention,
   * location2 is generally a library location.
   * @param message A message string, suitable for {@link String#format(String, Object...)}.
   * @param msgParams The optional parameters for the {@code message} string.
   */
  void conflict(
      @NonNull Severity severity,
      @NonNull FileAndLine location1,
      @NonNull FileAndLine location2,
      @NonNull String message,
      Object... msgParams);

  /** Severity of the error message. */
  enum Severity {
    /**
     * A very low severity information. This does not stop processing. Clients might want to have a
     * "not verbose" flag to not display this.
     */
    INFO,
    /**
     * A warning. This does not stop processing.
     */
    WARNING,
    /**
     * A fatal error. The merger does not stop on errors, in an attempt to accumulate as much info
     * as possible to return to the user. However in case even one error is generated the output
     * should not be used, if any.
     */
    ERROR
  }

  /**
   * Information about the file and line number where an error occurred.
   */
  class FileAndLine {
    private final String mFilePath;
    private final int mLine;

    /**
     * Constructs a new {@link FileAndLine}.
     *
     * @param filePath The file path. This is typically a file path when the merge is initiated via
     * the {@code process(File...)} interface. When using the {@code process(Document...)}
     * interface, this will be one of the magic constants {@link IMergerLog#LIBRARY} or {@link
     * IMergerLog#MAIN_MANIFEST}. When that fails, null is used.
     * @param line The line number where the error occurred in the XML file. Zero is used when the
     * line number isn't known (e.g. when the error happens at the document level rather than on a
     * specific element.)
     */
    public FileAndLine(@Nullable String filePath, int line) {
      mFilePath = filePath;
      mLine = line;
    }

    /**
     * Returns the file path. <p/> This is typically a file path when the merge is initiated via the
     * {@code process(File...)} interface. When using the {@code process(Document...)} interface,
     * this will be one of the magic constants {@link IMergerLog#LIBRARY} or {@link
     * IMergerLog#MAIN_MANIFEST}. When that fails, null is used.
     */
    @Nullable
    public String getFileName() {
      return mFilePath;
    }

    /**
     * Returns the line number where the error occurred in the XML file. Zero is used when the line
     * number isn't known (e.g. when the error happens at the document level rather than on a
     * specific element.)
     */
    public int getLine() {
      return mLine;
    }

    /**
     * Displays the information in the form "file:line".
     */
    @Override
    public String toString() {
      String name = mFilePath;
      if (MAIN_MANIFEST.equals(name)) {
        name = "main manifest";         // translatable
      } else if (LIBRARY.equals(name)) {
        name = "library";               // translatable
      } else if (name == null) {
        name = "(Unknown)";             // translatable
      }
      if (mLine <= 0) {
        return name;
      } else {
        return name + ':' + mLine;
      }
    }
  }
}
