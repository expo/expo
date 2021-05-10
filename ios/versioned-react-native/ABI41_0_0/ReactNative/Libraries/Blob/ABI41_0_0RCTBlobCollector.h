/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0jsi/ABI41_0_0jsi.h>

using namespace ABI41_0_0facebook;

@class ABI41_0_0RCTBlobManager;

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class JSI_EXPORT ABI41_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI41_0_0RCTBlobCollector(ABI41_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI41_0_0RCTBlobCollector();

  static void install(ABI41_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI41_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
