/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0jsi/ABI45_0_0jsi.h>

using namespace ABI45_0_0facebook;

@class ABI45_0_0RCTBlobManager;

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

class JSI_EXPORT ABI45_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI45_0_0RCTBlobCollector(ABI45_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI45_0_0RCTBlobCollector();

  static void install(ABI45_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI45_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
