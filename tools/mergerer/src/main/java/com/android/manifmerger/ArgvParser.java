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

import com.android.sdklib.util.CommandLineParser;
import com.android.utils.ILogger;
import java.util.List;

/**
 * Specific command-line flags for the {@link ManifestMerger}.
 */
class ArgvParser extends CommandLineParser {

    /*
     * Steps needed to add a new action:
     * - Each action is defined as a "verb object" followed by parameters.
     * - Either reuse a VERB_ constant or define a new one.
     * - Either reuse an OBJECT_ constant or define a new one.
     * - Add a new entry to mAction with a one-line help summary.
     * - In the constructor, add a define() call for each parameter (either mandatory
     *   or optional) for the given action.
     */

  public static final String VERB_MERGE = "merge";                          //$NON-NLS-1$
  public static final String KEY_OUT = "out";                            //$NON-NLS-1$
  public static final String KEY_MAIN = "main";                           //$NON-NLS-1$
  public static final String KEY_LIBS = "libs";                           //$NON-NLS-1$

  /**
   * Action definitions for ManifestMerger command line. <p/> This list serves two purposes: first
   * it is used to know which verb/object actions are acceptable on the command-line; second it
   * provides a summary for each action that is printed in the help. <p/> Each entry is a string
   * array with: <ul> <li> the verb. <li> an object (use #NO_VERB_OBJECT if there's no object). <li>
   * a description. <li> an alternate form for the object (e.g. plural). </ul>
   */
  private static final String[][] ACTIONS = {

      {VERB_MERGE, NO_VERB_OBJECT,
          "Merge two or more manifests."},
  };

  public ArgvParser(ILogger logger) {
    super(logger, ACTIONS);

    // The following defines the parameters of the actions defined in mAction.

    // --- merge manifest ---

    define(Mode.STRING, true,
        VERB_MERGE, NO_VERB_OBJECT, "o", KEY_OUT,                           //$NON-NLS-1$
        "Output path (where to write the merged manifest). Use - for stdout.", null);

    define(Mode.STRING, true,
        VERB_MERGE, NO_VERB_OBJECT, "1", KEY_MAIN,                          //$NON-NLS-1$
        "Path of the main manifest (what to merge *into*)", null);

    define(Mode.STRING_ARRAY, true,
        VERB_MERGE, NO_VERB_OBJECT, "2", KEY_LIBS,                          //$NON-NLS-1$
        "Paths of library manifests to be merged into the main one.",
        null);
  }

  @Override
  public boolean acceptLackOfVerb() {
    return true;
  }

  // -- some helpers for generic action flags

  /** Helper to retrieve the --out value. */
  public String getParamOut() {
    return (String) getValue(null, null, KEY_OUT);
  }

  /** Helper to retrieve the --main value. */
  public String getParamMain() {
    return (String) getValue(null, null, KEY_MAIN);
  }

  /**
   * Helper to retrieve the --libs values.
   */
  public String[] getParamLibs() {
    Object v = getValue(null, null, KEY_LIBS);
    if (v instanceof List<?>) {
      List<?> a = (List<?>) v;
      return a.toArray(new String[a.size()]);
    }
    return null;
  }
}
