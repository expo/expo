/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0jsi/ABI49_0_0jsi.h>

@class ABI49_0_0RCTBlobManager;

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class JSI_EXPORT ABI49_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI49_0_0RCTBlobCollector(ABI49_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI49_0_0RCTBlobCollector();

  static void install(ABI49_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI49_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
