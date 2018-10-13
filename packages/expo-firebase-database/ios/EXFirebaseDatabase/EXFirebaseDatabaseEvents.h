//
//  EXFirebaseDatabaseEvents.h
//  EXFirebaseDatabase
//
//  Created by Evan Bacon on 10/6/18.
//

#ifndef EXFirebaseDatabaseEvents_h
#define EXFirebaseDatabaseEvents_h

#import <Foundation/Foundation.h>

static NSString *const DATABASE_SYNC_EVENT = @"Expo.Firebase.database_sync_event";
static NSString *const DATABASE_TRANSACTION_EVENT = @"Expo.Firebase.database_transaction_event";

static NSString *const DATABASE_VALUE_EVENT = @"value";
static NSString *const DATABASE_CHILD_ADDED_EVENT = @"child_added";
static NSString *const DATABASE_CHILD_MODIFIED_EVENT = @"child_changed";
static NSString *const DATABASE_CHILD_REMOVED_EVENT = @"child_removed";
static NSString *const DATABASE_CHILD_MOVED_EVENT = @"child_moved";

#endif
