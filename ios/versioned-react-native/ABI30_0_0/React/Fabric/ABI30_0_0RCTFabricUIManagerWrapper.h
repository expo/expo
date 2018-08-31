/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <memory>

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTInvalidating.h>
#import <ReactABI30_0_0/ABI30_0_0RCTShadowView.h>

namespace facebook {
namespace ReactABI30_0_0 {

class FabricUIManager;

} // namespace ReactABI30_0_0
} // namespace facebook

using namespace facebook::ReactABI30_0_0;

/**
 * An ObjC++ wrapper around the C++ FabricUIManager instance, so that the ABI30_0_0RCTCxxBridge can access it as needed.
 */
@interface ABI30_0_0RCTFabricUIManagerWrapper : NSObject <ABI30_0_0RCTInvalidating>

- (std::shared_ptr<FabricUIManager>)manager;

@end

@interface ABI30_0_0RCTBridge (ABI30_0_0RCTFabricUIManagerWrapper)

/**
 * To access via the bridge:
 *
 *   std::shared_ptr<FabricUIManager> fabricUIManager = [_bridge fabricUIManager];
 */
- (std::shared_ptr<FabricUIManager>)fabricUIManager;

@end
