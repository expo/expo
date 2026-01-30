/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_PUBLIC_GCTRIPWIRECONTEXT_H
#define HERMES_PUBLIC_GCTRIPWIRECONTEXT_H

#include <hermes/Public/HermesExport.h>

#include <iosfwd>
#include <string>
#include <system_error>

namespace hermes {
namespace vm {

/// Interface passed to the GC tripwire callback when it fires.
class HERMES_EXPORT GCTripwireContext {
 public:
  virtual ~GCTripwireContext();

  /// Captures the heap to a file.
  /// \param path to save the heap capture.
  /// \return Empty error code if the heap capture succeeded, else a real error
  ///   code.
  virtual std::error_code createSnapshotToFile(const std::string &path) = 0;

  /// Captures the heap to a stream.
  /// \param os stream to save the heap capture to.
  /// \return Empty error code if the heap capture succeeded, else a real error
  ///   code.
  virtual std::error_code createSnapshot(
      std::ostream &os,
      bool captureNumericValue) = 0;
};

} // namespace vm
} // namespace hermes

#endif // HERMES_PUBLIC_GCTRIPWIRECONTEXT_H
