/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTBlobCollector.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <ABI41_0_0React/ABI41_0_0RCTBlobManager.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

ABI41_0_0RCTBlobCollector::ABI41_0_0RCTBlobCollector(ABI41_0_0RCTBlobManager *blobManager, const std::string &blobId)
: blobId_(blobId), blobManager_(blobManager) {}

ABI41_0_0RCTBlobCollector::~ABI41_0_0RCTBlobCollector() {
  ABI41_0_0RCTBlobManager *blobManager = blobManager_;
  NSString *blobId = [NSString stringWithUTF8String:blobId_.c_str()];
  dispatch_async([blobManager_ methodQueue], ^{
    [blobManager remove:blobId];
  });
}

void ABI41_0_0RCTBlobCollector::install(ABI41_0_0RCTBlobManager *blobManager) {
  __weak ABI41_0_0RCTCxxBridge *cxxBridge = (ABI41_0_0RCTCxxBridge *)blobManager.bridge;
  [cxxBridge dispatchBlock:^{
    if (!cxxBridge || cxxBridge.runtime == nullptr) {
      return;
    }
    jsi::Runtime &runtime = *(jsi::Runtime *)cxxBridge.runtime;
    runtime.global().setProperty(
      runtime,
      "__blobCollectorProvider",
      jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "__blobCollectorProvider"),
        1,
        [blobManager](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
          auto blobId = args[0].asString(rt).utf8(rt);
          auto blobCollector = std::make_shared<ABI41_0_0RCTBlobCollector>(blobManager, blobId);
          return jsi::Object::createFromHostObject(rt, blobCollector);
        }
      )
    );
  } queue:ABI41_0_0RCTJSThread];
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
