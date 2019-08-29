/*
 * Copyright (C) 2014 The Android Open Source Project
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

/**
 * Defines the default merging activity for same type.
 *
 * WIP more work needed.
 */
public enum MergeType {

  /**
   * Merge this element's children with lower priority element's children. Do not merge element's
   * attributes.
   */
  MERGE_CHILDREN_ONLY,

  /**
   * Merge this element with lower priority elements.
   */
  MERGE,

  /**
   * Always generate a merging failure when encountering lower priority elements.
   */
  CONFLICT,

  /**
   * Do not attempt to merge with lower priority elements.
   */
  IGNORE,

  /**
   * Always consume lower priority elements unless it is strictly equals to the higher priority
   * element.
   */
  ALWAYS,
}