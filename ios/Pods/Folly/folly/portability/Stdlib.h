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

#pragma once

#include <cstdlib>

#ifdef _WIN32
// These are technically supposed to be defined linux/limits.h and
// sys/param.h respectively, but Windows defines _MAX_PATH in stdlib.h,
// so, instead of creating two headers for a single define each, we put
// them here, where they are likely to already have been included in the
// code that needs them.
#define PATH_MAX _MAX_PATH
#define MAXPATHLEN _MAX_PATH

extern "C" {
char* mktemp(char* tn);
char* mkdtemp(char* tn);
int mkstemp(char* tn);
char* realpath(const char* path, char* resolved_path);
}
#endif
