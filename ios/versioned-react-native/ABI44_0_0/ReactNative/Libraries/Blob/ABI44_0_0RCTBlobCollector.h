/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0jsi/ABI44_0_0jsi.h>

using namespace ABI44_0_0facebook;

@class ABI44_0_0RCTBlobManager;

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class JSI_EXPORT ABI44_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI44_0_0RCTBlobCollector(ABI44_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI44_0_0RCTBlobCollector();

  static void install(ABI44_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI44_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
