/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0jsi/ABI47_0_0jsi.h>

using namespace ABI47_0_0facebook;

@class ABI47_0_0RCTBlobManager;

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class JSI_EXPORT ABI47_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI47_0_0RCTBlobCollector(ABI47_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI47_0_0RCTBlobCollector();

  static void install(ABI47_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI47_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
