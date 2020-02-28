/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0jsi/ABI37_0_0jsi.h>

using namespace ABI37_0_0facebook;

@class ABI37_0_0RCTBlobManager;

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class JSI_EXPORT ABI37_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI37_0_0RCTBlobCollector(ABI37_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI37_0_0RCTBlobCollector();

  static void install(ABI37_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI37_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
