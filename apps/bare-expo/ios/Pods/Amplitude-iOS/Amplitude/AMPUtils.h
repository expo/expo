//
//  AMPUtils.h
//  Pods
//
//  Created by Daniel Jih on 10/4/15.
//
//

@interface AMPUtils : NSObject

+ (NSString*) generateUUID;
+ (id) makeJSONSerializable:(id) obj;
+ (BOOL) isEmptyString:(NSString*) str;
+ (NSDictionary*) validateGroups:(NSDictionary*) obj;
+ (NSString*) platformDataDirectory;

@end
