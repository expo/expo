/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_PUBLIC_JSOUTOFMEMORYERROR_H
#define HERMES_PUBLIC_JSOUTOFMEMORYERROR_H

#include <hermes/Public/HermesExport.h>

#include <stdexcept>
#include <string>

namespace hermes {
namespace vm {

/// A std::runtime_error class for out-of-memory.
class HERMES_EXPORT JSOutOfMemoryError : public std::runtime_error {
  friend class GCBase;
  JSOutOfMemoryError(const std::string &what_arg)
      : std::runtime_error(what_arg) {}
  ~JSOutOfMemoryError() override;
};

} // namespace vm
} // namespace hermes

#endif // HERMES_PUBLIC_JSOUTOFMEMORYERROR_H
