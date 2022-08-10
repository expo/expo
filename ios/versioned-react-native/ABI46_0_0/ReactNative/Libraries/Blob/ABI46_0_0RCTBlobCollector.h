/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0jsi/ABI46_0_0jsi.h>

using namespace ABI46_0_0facebook;

@class ABI46_0_0RCTBlobManager;

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

class JSI_EXPORT ABI46_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI46_0_0RCTBlobCollector(ABI46_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI46_0_0RCTBlobCollector();

  static void install(ABI46_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI46_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
