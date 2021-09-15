/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0jsi/ABI42_0_0jsi.h>

using namespace ABI42_0_0facebook;

@class ABI42_0_0RCTBlobManager;

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

class JSI_EXPORT ABI42_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI42_0_0RCTBlobCollector(ABI42_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI42_0_0RCTBlobCollector();

  static void install(ABI42_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI42_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
