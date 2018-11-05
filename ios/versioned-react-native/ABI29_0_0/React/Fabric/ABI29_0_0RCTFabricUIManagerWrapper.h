/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <memory>

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTInvalidating.h>
#import <ReactABI29_0_0/ABI29_0_0RCTShadowView.h>

namespace facebook {
namespace ReactABI29_0_0 {

class FabricUIManager;

} // namespace ReactABI29_0_0
} // namespace facebook

using namespace facebook::ReactABI29_0_0;

/**
 * An ObjC++ wrapper around the C++ FabricUIManager instance, so that the ABI29_0_0RCTCxxBridge can access it as needed.
 */
@interface ABI29_0_0RCTFabricUIManagerWrapper : NSObject <ABI29_0_0RCTInvalidating>

- (std::shared_ptr<FabricUIManager>)manager;

@end

@interface ABI29_0_0RCTBridge (ABI29_0_0RCTFabricUIManagerWrapper)

/**
 * To access via the bridge:
 *
 *   std::shared_ptr<FabricUIManager> fabricUIManager = [_bridge fabricUIManager];
 */
- (std::shared_ptr<FabricUIManager>)fabricUIManager;

@end
