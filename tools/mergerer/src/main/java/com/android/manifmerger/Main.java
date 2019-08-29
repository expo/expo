/*
 * Copyright (C) 2011 The Android Open Source Project
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

import com.android.utils.ILogger;
import com.android.utils.StdLogger;
import java.io.File;
import java.util.Map;

/**
 * Command-line entry point of the Manifest Merger. The goal of the manifest merger is to merge
 * library manifest into a main application manifest. See {@link ManifestMerger} for the exact
 * merging rules. <p/> The command-line version creates a {@link ManifestMerger} which takes file
 * arguments from the command-line and dumps all errors and warnings on the stdout/stderr console.
 * <p/> Usage: <br/> {@code $ manifmerger merge --main main_manifest.xml --libs lib1.xml lib2.xml
 * --out result.xml} <p/> When used as a library, please call {@link ManifestMerger#process(File,
 * File, File[], Map, String)} directly.
 */
public class Main {

  /** Logger object. Use this to print normal output, warnings or errors. Never null. */
  private ILogger mSdkLog;
  /** Command line parser. Never null. */
  private ArgvParser mArgvParser;

  public static void main(String[] args) {
    new Main().run(args);
  }

  /**
   * Runs the sdk manager app
   */
  private void run(String[] args) {
    createLogger();

    mArgvParser = new ArgvParser(mSdkLog);
    mArgvParser.parseArgs(args);

    // Create a new ManifestMerger and call its process method.
    // It will take care of validating its own arguments.
    ManifestMerger mm = new ManifestMerger(MergerLog.wrapSdkLog(mSdkLog), null);

    String[] libPaths = mArgvParser.getParamLibs();
    File[] libFiles = new File[libPaths.length];
    for (int n = libPaths.length - 1; n >= 0; n--) {
      libFiles[n] = new File(libPaths[n]);
    }

    boolean ok = mm.process(
        new File(mArgvParser.getParamOut()),
        new File(mArgvParser.getParamMain()),
        libFiles,
        null /*injectAttributes*/,
        null /*packageOverride*/
    );
    System.exit(ok ? 0 : 1);
  }

  /**
   * Creates the {@link #mSdkLog} object. This logger prints to the attached console.
   */
  private void createLogger() {
    mSdkLog = new StdLogger(StdLogger.Level.VERBOSE);
  }

  /** For testing */
  public void setLogger(ILogger logger) {
    mSdkLog = logger;
  }
}
