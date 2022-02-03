/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0jsi/ABI43_0_0jsi.h>

using namespace ABI43_0_0facebook;

@class ABI43_0_0RCTBlobManager;

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class JSI_EXPORT ABI43_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI43_0_0RCTBlobCollector(ABI43_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI43_0_0RCTBlobCollector();

  static void install(ABI43_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI43_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
