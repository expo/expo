/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0jsi/ABI38_0_0jsi.h>

using namespace ABI38_0_0facebook;

@class ABI38_0_0RCTBlobManager;

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

class JSI_EXPORT ABI38_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI38_0_0RCTBlobCollector(ABI38_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI38_0_0RCTBlobCollector();

  static void install(ABI38_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI38_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
