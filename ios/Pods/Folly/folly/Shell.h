/*
 * Copyright 2016 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * `Shell` provides a collection of functions to use with `Subprocess` that make
 * it easier to safely run processes in a unix shell.
 *
 * Note: use this rarely and carefully. By default you should use `Subprocess`
 * with a vector of arguments.
 */

#pragma once

#include <string>
#include <vector>

#include <folly/Conv.h>
#include <folly/Format.h>
#include <folly/Range.h>

namespace folly {

/**
 * Quotes an argument to make it suitable for use as shell command arguments.
 */
std::string shellQuote(StringPiece argument);

/**
  * Create argument array for `Subprocess()` for a process running in a
  * shell.
  *
  * The shell to use is always going to be `/bin/sh`.
  *
  * The format string should always be a string literal to protect against
  * shell injections. Arguments will automatically be escaped with `'`.
  *
  * TODO(dominik): find a way to ensure statically determined format strings.
  */
template <typename... Arguments>
std::vector<std::string> shellify(
    const StringPiece format,
    Arguments&&... arguments) {
  auto command = sformat(
      format,
      shellQuote(to<std::string>(std::forward<Arguments>(arguments)))...);
  return {"/bin/sh", "-c", command};
}

} // folly
