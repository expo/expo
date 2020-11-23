/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0jsi/ABI40_0_0jsi.h>

using namespace ABI40_0_0facebook;

@class ABI40_0_0RCTBlobManager;

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

class JSI_EXPORT ABI40_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI40_0_0RCTBlobCollector(ABI40_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI40_0_0RCTBlobCollector();

  static void install(ABI40_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI40_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
