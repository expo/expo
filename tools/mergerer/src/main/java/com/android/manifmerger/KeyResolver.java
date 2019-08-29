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

import com.android.annotations.Nullable;

/**
 * Facility to identify an element from its key.
 */
public interface KeyResolver<T> {

  /**
   * Returns an element identified with the passed key.
   *
   * @param key key to resolve.
   * @return the element identified by the passed key or null if there is no key of that name.
   */
  @Nullable T resolve(String key);

  Iterable<String> getKeys();
}
