//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <sqlite3.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesDatabaseMigration

@property (nonatomic, strong, readonly) NSString *filename;

- (BOOL)runMigrationOnDatabase:(struct sqlite3 *)db error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
