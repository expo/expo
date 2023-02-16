/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0jsi/ABI48_0_0jsi.h>

@class ABI48_0_0RCTBlobManager;

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class JSI_EXPORT ABI48_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI48_0_0RCTBlobCollector(ABI48_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI48_0_0RCTBlobCollector();

  static void install(ABI48_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI48_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
