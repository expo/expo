//
//  EXMailComposer.h
//  Exponent
//
//  Created by Alicja Warchał on 20.12.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <MessageUI/MessageUI.h>

@interface EXMailComposer : NSObject <RCTBridgeModule, MFMailComposeViewControllerDelegate>

@end
