/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI14_0_0RNSVGUse.h"
#import <ReactABI14_0_0/ABI14_0_0RCTLog.h>

@implementation ABI14_0_0RNSVGUse

- (void)setHref:(NSString *)href
{
    if (href == _href) {
        return;
    }
    
    [self invalidate];
    _href = href;
}


- (void)renderLayerTo:(CGContextRef)context
{
    ABI14_0_0RNSVGNode* template = [[self getSvgView] getDefinedTemplate:self.href];
    if (template) {
        [self beginTransparencyLayer:context];
        [self clip:context];
        [template mergeProperties:self mergeList:self.ownedPropList];
        [template renderTo:context];
        [template resetProperties];
        [self endTransparencyLayer:context];
    } else if (self.href) {
        // TODO: calling yellow box here
        ABI14_0_0RCTLogWarn(@"`Use` element expected a pre-defined svg template as `href` prop, template named: %@ is not defined.", self.href);
    }
}

@end

