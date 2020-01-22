/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0jsi/ABI36_0_0jsi.h>

using namespace ABI36_0_0facebook;

@class ABI36_0_0RCTBlobManager;

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

class JSI_EXPORT ABI36_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI36_0_0RCTBlobCollector(ABI36_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI36_0_0RCTBlobCollector();

  static void install(ABI36_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI36_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
