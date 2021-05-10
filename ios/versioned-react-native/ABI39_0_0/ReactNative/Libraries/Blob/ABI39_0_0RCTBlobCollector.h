/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0jsi/ABI39_0_0jsi.h>

using namespace ABI39_0_0facebook;

@class ABI39_0_0RCTBlobManager;

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

class JSI_EXPORT ABI39_0_0RCTBlobCollector : public jsi::HostObject {
 public:
  ABI39_0_0RCTBlobCollector(ABI39_0_0RCTBlobManager *blobManager, const std::string &blobId);
  ~ABI39_0_0RCTBlobCollector();

  static void install(ABI39_0_0RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  ABI39_0_0RCTBlobManager *blobManager_;
};

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook
