//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabaseInitialization+Tests.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabaseMigration4To5.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabaseMigration5To6.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabaseUtils.h>

#import <sqlite3.h>

static NSString * const ABI42_0_0EXUpdatesDatabaseV4Schema = @"\
CREATE TABLE \"updates\" (\
\"id\"  BLOB UNIQUE,\
\"scope_key\"  TEXT NOT NULL,\
\"commit_time\"  INTEGER NOT NULL,\
\"runtime_version\"  TEXT NOT NULL,\
\"launch_asset_id\" INTEGER,\
\"metadata\"  TEXT,\
\"status\"  INTEGER NOT NULL,\
\"keep\"  INTEGER NOT NULL,\
PRIMARY KEY(\"id\"),\
FOREIGN KEY(\"launch_asset_id\") REFERENCES \"assets\"(\"id\") ON DELETE CASCADE\
);\
CREATE TABLE \"assets\" (\
\"id\"  INTEGER PRIMARY KEY AUTOINCREMENT,\
\"url\"  TEXT,\
\"key\"  TEXT NOT NULL UNIQUE,\
\"headers\"  TEXT,\
\"type\"  TEXT NOT NULL,\
\"metadata\"  TEXT,\
\"download_time\"  INTEGER NOT NULL,\
\"relative_path\"  TEXT NOT NULL,\
\"hash\"  BLOB NOT NULL,\
\"hash_type\"  INTEGER NOT NULL,\
\"marked_for_deletion\"  INTEGER NOT NULL\
);\
CREATE TABLE \"updates_assets\" (\
\"update_id\"  BLOB NOT NULL,\
\"asset_id\" INTEGER NOT NULL,\
FOREIGN KEY(\"update_id\") REFERENCES \"updates\"(\"id\") ON DELETE CASCADE,\
FOREIGN KEY(\"asset_id\") REFERENCES \"assets\"(\"id\") ON DELETE CASCADE\
);\
CREATE TABLE \"json_data\" (\
\"id\" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\
\"key\" TEXT NOT NULL,\
\"value\" TEXT NOT NULL,\
\"last_updated\" INTEGER NOT NULL,\
\"scope_key\" TEXT NOT NULL\
);\
CREATE UNIQUE INDEX \"index_updates_scope_key_commit_time\" ON \"updates\" (\"scope_key\", \"commit_time\");\
CREATE INDEX \"index_updates_launch_asset_id\" ON \"updates\" (\"launch_asset_id\");\
CREATE INDEX \"index_json_data_scope_key\" ON \"json_data\" (\"scope_key\")\
";

static NSString * const ABI42_0_0EXUpdatesDatabaseV5Schema = @"\
CREATE TABLE \"updates\" (\
\"id\"  BLOB UNIQUE,\
\"scope_key\"  TEXT NOT NULL,\
\"commit_time\"  INTEGER NOT NULL,\
\"runtime_version\"  TEXT NOT NULL,\
\"launch_asset_id\" INTEGER,\
\"metadata\"  TEXT,\
\"status\"  INTEGER NOT NULL,\
\"keep\"  INTEGER NOT NULL,\
PRIMARY KEY(\"id\"),\
FOREIGN KEY(\"launch_asset_id\") REFERENCES \"assets\"(\"id\") ON DELETE CASCADE\
);\
CREATE TABLE \"assets\" (\
\"id\"  INTEGER PRIMARY KEY AUTOINCREMENT,\
\"url\"  TEXT,\
\"key\"  TEXT UNIQUE,\
\"headers\"  TEXT,\
\"type\"  TEXT NOT NULL,\
\"metadata\"  TEXT,\
\"download_time\"  INTEGER NOT NULL,\
\"relative_path\"  TEXT NOT NULL,\
\"hash\"  BLOB NOT NULL,\
\"hash_type\"  INTEGER NOT NULL,\
\"marked_for_deletion\"  INTEGER NOT NULL\
);\
CREATE TABLE \"updates_assets\" (\
\"update_id\"  BLOB NOT NULL,\
\"asset_id\" INTEGER NOT NULL,\
FOREIGN KEY(\"update_id\") REFERENCES \"updates\"(\"id\") ON DELETE CASCADE,\
FOREIGN KEY(\"asset_id\") REFERENCES \"assets\"(\"id\") ON DELETE CASCADE\
);\
CREATE TABLE \"json_data\" (\
\"id\" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\
\"key\" TEXT NOT NULL,\
\"value\" TEXT NOT NULL,\
\"last_updated\" INTEGER NOT NULL,\
\"scope_key\" TEXT NOT NULL\
);\
CREATE UNIQUE INDEX \"index_updates_scope_key_commit_time\" ON \"updates\" (\"scope_key\", \"commit_time\");\
CREATE INDEX \"index_updates_launch_asset_id\" ON \"updates\" (\"launch_asset_id\");\
CREATE INDEX \"index_json_data_scope_key\" ON \"json_data\" (\"scope_key\")\
";

@interface ABI42_0_0EXUpdatesDatabaseInitializationTests : XCTestCase

@property (nonatomic, strong) NSURL *testDatabaseDir;

@end

@implementation ABI42_0_0EXUpdatesDatabaseInitializationTests

- (void)setUp
{
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"ABI42_0_0EXUpdatesDatabaseTests"];
  if (![NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
    XCTAssertNil(error);
  }
}

- (void)tearDown
{
  NSError *error;
  [NSFileManager.defaultManager removeItemAtPath:_testDatabaseDir.path error:&error];
  XCTAssertNil(error);
}

- (void)testDatabasePersistence
{
  sqlite3 *db;
  NSError *initializeError;
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithLatestSchemaInDirectory:_testDatabaseDir
                                                                        database:&db
                                                                           error:&initializeError];
  XCTAssertNil(initializeError);

  // insert some test data
  NSString * const insertSql = @"INSERT INTO \"assets\" (\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES\
  (NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);";
  NSError *insertError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertSql withArgs:nil onDatabase:db error:&insertError];
  XCTAssertNil(insertError);

  // mimic the app closing and reopening
  sqlite3_close(db);
  sqlite3 *newDb;
  NSError *newInitializeError;
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithLatestSchemaInDirectory:_testDatabaseDir
                                                                        database:&newDb
                                                                           error:&newInitializeError];
  XCTAssertNil(newInitializeError);

  // ensure the data is still there
  NSString * const selectSql = @"SELECT * FROM `assets` WHERE `url` IS NULL AND `key` = 'bundle-1614137401950' AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0";
  NSArray<NSDictionary *> *rows = [ABI42_0_0EXUpdatesDatabaseUtils executeSql:selectSql withArgs:nil onDatabase:newDb error:nil];
  XCTAssertEqual(1, rows.count);
  XCTAssertEqualObjects(@1, rows[0][@"id"]);
}

- (void)testMigration4ToLatest
{
  // this test just does some simple data validation to make sure the database persists across all migrations
  // individual migrations are tested in more detail individually
  sqlite3 *db;
  NSError *initializeError;
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithSchema:ABI42_0_0EXUpdatesDatabaseV4Schema
                                                       filename:@"expo-v4.db"
                                                    inDirectory:_testDatabaseDir
                                                  shouldMigrate:NO
                                                     migrations:@[]
                                                       database:&db
                                                          error:&initializeError];
  XCTAssertNil(initializeError);

  // insert test data
  NSString * const insertAssetsSql = @"INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES\
  (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),\
  (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),\
  (4,NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);";
  NSString * const insertUpdatesSql = @"INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"metadata\",\"status\",\"keep\") VALUES\
  (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\"metadata\":{\"updateGroup\":\"34993d39-57e6-46cf-8fa2-eba836f40828\",\"branchName\":\"rollout\"}}',1,1),\
  (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1);";
  NSString * const insertUpdatesAssetsSql = @"INSERT INTO \"updates_assets\" (\"update_id\",\"asset_id\") VALUES\
  (X'8C263F9DE3FF48888496E3244C788661',2),\
  (X'8C263F9DE3FF48888496E3244C788661',3),\
  (X'594100ea066e4804b5c7c907c773f980',4);";
  NSError *insertAssetsError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertAssetsSql withArgs:nil onDatabase:db error:&insertAssetsError];
  NSError *insertUpdatesError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertUpdatesSql withArgs:nil onDatabase:db error:&insertUpdatesError];
  NSError *insertUpdatesAssetsError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertUpdatesAssetsSql withArgs:nil onDatabase:db error:&insertUpdatesAssetsError];
  XCTAssert(!insertAssetsError && !insertUpdatesError && !insertUpdatesAssetsError);

  sqlite3_close(db);

  // initialize a new database object the normal way and run migrations
  sqlite3 *migratedDb;
  NSError *migrateError;
  // initialize without specifying migrations in order to run them all
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithLatestSchemaInDirectory:_testDatabaseDir
                                                                        database:&migratedDb
                                                                           error:&migrateError];
  XCTAssertNil(migrateError);

  // verify data integrity
  NSString * const updatesSql1 = @"SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesSql2 = @"SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980'";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesSql2 withArgs:nil onDatabase:migratedDb error:nil].count);

  NSString * const assetsSql1 = @"SELECT * FROM `assets` WHERE `id` = 2";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const assetsSql2 = @"SELECT * FROM `assets` WHERE `id` = 3";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql2 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const assetsSql3 = @"SELECT * FROM `assets` WHERE `id` = 4";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql3 withArgs:nil onDatabase:migratedDb error:nil].count);

  NSString * const updatesAssetsSql1 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesAssetsSql2 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql2 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesAssetsSql3 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql3 withArgs:nil onDatabase:migratedDb error:nil].count);

  // make sure multiple migrations are running
  NSString * const lastAccessedSql1 = @"SELECT DISTINCT last_accessed FROM `updates`";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:lastAccessedSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
}

- (void)testMigration4To5
{
  sqlite3 *db;
  NSError *initializeError;
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithSchema:ABI42_0_0EXUpdatesDatabaseV4Schema
                                                       filename:@"expo-v4.db"
                                                    inDirectory:_testDatabaseDir
                                                  shouldMigrate:NO
                                                     migrations:@[]
                                                       database:&db
                                                          error:&initializeError];
  XCTAssertNil(initializeError);

  // insert test data
  NSString * const insertAssetsSql = @"INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES\
    (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),\
    (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),\
    (4,NULL,'bundle-1614137401950',NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);";
  NSString * const insertUpdatesSql = @"INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"metadata\",\"status\",\"keep\") VALUES\
  (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\"metadata\":{\"updateGroup\":\"34993d39-57e6-46cf-8fa2-eba836f40828\",\"branchName\":\"rollout\"}}',1,1),\
  (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1);";
  NSString * const insertUpdatesAssetsSql = @"INSERT INTO \"updates_assets\" (\"update_id\",\"asset_id\") VALUES\
    (X'8C263F9DE3FF48888496E3244C788661',2),\
    (X'8C263F9DE3FF48888496E3244C788661',3),\
    (X'594100ea066e4804b5c7c907c773f980',4);";
  NSError *insertAssetsError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertAssetsSql withArgs:nil onDatabase:db error:&insertAssetsError];
  NSError *insertUpdatesError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertUpdatesSql withArgs:nil onDatabase:db error:&insertUpdatesError];
  NSError *insertUpdatesAssetsError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertUpdatesAssetsSql withArgs:nil onDatabase:db error:&insertUpdatesAssetsError];
  XCTAssert(!insertAssetsError && !insertUpdatesError && !insertUpdatesAssetsError);

  sqlite3_close(db);

  // initialize a new database object the normal way and run migrations
  sqlite3 *migratedDb;
  NSError *migrateError;
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithLatestSchemaInDirectory:_testDatabaseDir
                                                                        database:&migratedDb
                                                                      migrations:@[[ABI42_0_0EXUpdatesDatabaseMigration4To5 new]]
                                                                           error:&migrateError];
  XCTAssertNil(migrateError);

  // verify data integrity
  NSString * const updatesSql1 = @"SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesSql2 = @"SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980'";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesSql2 withArgs:nil onDatabase:migratedDb error:nil].count);

  NSString * const assetsSql1 = @"SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` = 'c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b' AND `hash_type` = 0 AND `marked_for_deletion` = 0";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const assetsSql2 = @"SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` = 'e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2' AND `hash_type` = 0 AND `marked_for_deletion` = 0";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql2 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const assetsSql3 = @"SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` = 'bundle-1614137401950' AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql3 withArgs:nil onDatabase:migratedDb error:nil].count);

  NSString * const updatesAssetsSql1 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesAssetsSql2 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql2 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesAssetsSql3 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql3 withArgs:nil onDatabase:migratedDb error:nil].count);

  // make sure we can insert multiple assets with null keys
  NSError *nullInsertError;
  NSString * const nullInsertSql = @"INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES\
    (5,NULL,NULL,NULL,'js',NULL,1614137406589,'bundle-1614137401951','1234',0,0),\
    (6,NULL,NULL,NULL,'js',NULL,1614137406580,'bundle-1614137401952','5678',0,0)";
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:nullInsertSql withArgs:nil onDatabase:migratedDb error:&nullInsertError];
  XCTAssertNil(nullInsertError);

  // make sure foreign key constraint still works
  NSString * const foreignKeyInsertSql = @"INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 5)";
  NSString * const foreignKeySelectSql = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5";
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:foreignKeyInsertSql withArgs:nil onDatabase:migratedDb error:nil];
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:foreignKeySelectSql withArgs:nil onDatabase:migratedDb error:nil].count);

  NSString * const foreignKeyInsertBadSql = @"INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'594100ea066e4804b5c7c907c773f980', 13)";
  NSError *foreignKeyError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:foreignKeyInsertBadSql withArgs:nil onDatabase:migratedDb error:&foreignKeyError];
  XCTAssertNotNil(foreignKeyError);
  XCTAssertEqual(787, foreignKeyError.code); // SQLITE_CONSTRAINT_FOREIGNKEY

  // test on delete cascade
  NSString * const deleteSql = @"DELETE FROM `assets` WHERE `id` = 5";
  NSString * const selectDeletedSql = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 5";
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:deleteSql withArgs:nil onDatabase:migratedDb error:nil];
  XCTAssertEqual(0, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:selectDeletedSql withArgs:nil onDatabase:migratedDb error:nil].count);
}

- (void)testMigration5To6
{
  sqlite3 *db;
  NSError *initializeError;
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithSchema:ABI42_0_0EXUpdatesDatabaseV5Schema
                                                       filename:@"expo-v5.db"
                                                    inDirectory:_testDatabaseDir
                                                  shouldMigrate:NO
                                                     migrations:@[]
                                                       database:&db
                                                          error:&initializeError];
  XCTAssertNil(initializeError);

  // insert test data
  NSString * const insertAssetsSql = @"INSERT INTO \"assets\" (\"id\",\"url\",\"key\",\"headers\",\"type\",\"metadata\",\"download_time\",\"relative_path\",\"hash\",\"hash_type\",\"marked_for_deletion\") VALUES\
  (2,'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e','b56cf690e0afa93bd4dc7756d01edd3e.png',NULL,'image/png',NULL,1614137309295,'b56cf690e0afa93bd4dc7756d01edd3e.png','c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b',0,0),\
  (3,'https://url.to/bundle-1614137308871','bundle-1614137308871',NULL,'application/javascript',NULL,1614137309513,'bundle-1614137308871','e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2',0,0),\
  (4,NULL,NULL,NULL,'js',NULL,1614137406588,'bundle-1614137401950','6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952',0,0);";
  NSString * const insertUpdatesSql = @"INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"metadata\",\"status\",\"keep\") VALUES\
  (X'8C263F9DE3FF48888496E3244C788661','http://192.168.4.44:3000',1614137308871,'40.0.0',3,'{\\\"metadata\\\":{\\\"updateGroup\\\":\\\"34993d39-57e6-46cf-8fa2-eba836f40828\\\",\\\"branchName\\\":\\\"rollout\\\"}}',1,1),\
  (X'594100ea066e4804b5c7c907c773f980','http://192.168.4.44:3000',1614137401950,'40.0.0',4,NULL,1,1);";
  NSString * const insertUpdatesAssetsSql = @"INSERT INTO \"updates_assets\" (\"update_id\",\"asset_id\") VALUES\
  (X'8C263F9DE3FF48888496E3244C788661',2),\
  (X'8C263F9DE3FF48888496E3244C788661',3),\
  (X'594100ea066e4804b5c7c907c773f980',4);";
  NSError *insertAssetsError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertAssetsSql withArgs:nil onDatabase:db error:&insertAssetsError];
  NSError *insertUpdatesError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertUpdatesSql withArgs:nil onDatabase:db error:&insertUpdatesError];
  NSError *insertUpdatesAssetsError;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:insertUpdatesAssetsSql withArgs:nil onDatabase:db error:&insertUpdatesAssetsError];
  XCTAssert(!insertAssetsError && !insertUpdatesError && !insertUpdatesAssetsError);

  sqlite3_close(db);

  // initialize a new database object the normal way and run migrations
  sqlite3 *migratedDb;
  NSError *migrateError;
  [ABI42_0_0EXUpdatesDatabaseInitialization initializeDatabaseWithLatestSchemaInDirectory:_testDatabaseDir
                                                                        database:&migratedDb
                                                                      migrations:@[[ABI42_0_0EXUpdatesDatabaseMigration5To6 new]]
                                                                           error:&migrateError];
  XCTAssertNil(migrateError);

  // verify data integrity
  NSString * const updatesSql1 = @"SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137308871 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 3 AND `manifest` IS NOT NULL AND `status` = 1 AND `keep` = 1";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesSql2 = @"SELECT * FROM `updates` WHERE `id` = X'594100ea066e4804b5c7c907c773f980' AND `scope_key` = 'http://192.168.4.44:3000' AND `commit_time` = 1614137401950 AND `runtime_version` = '40.0.0' AND `launch_asset_id` = 4 AND `manifest` IS NULL AND `status` = 1 AND `keep` = 1";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesSql2 withArgs:nil onDatabase:migratedDb error:nil].count);

  NSString * const assetsSql1 = @"SELECT * FROM `assets` WHERE `id` = 2 AND `url` = 'https://url.to/b56cf690e0afa93bd4dc7756d01edd3e' AND `key` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `headers` IS NULL AND `type` = 'image/png' AND `metadata` IS NULL AND `download_time` = 1614137309295 AND `relative_path` = 'b56cf690e0afa93bd4dc7756d01edd3e.png' AND `hash` = 'c4fdfc2ec388025067a0f755bda7731a0a868a2be79c84509f4de4e40d23161b' AND `hash_type` = 0 AND `marked_for_deletion` = 0";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const assetsSql2 = @"SELECT * FROM `assets` WHERE `id` = 3 AND `url` = 'https://url.to/bundle-1614137308871' AND `key` = 'bundle-1614137308871' AND `headers` IS NULL AND `type` = 'application/javascript' AND `metadata` IS NULL AND `download_time` = 1614137309513 AND `relative_path` = 'bundle-1614137308871' AND `hash` = 'e4d658861e85e301fb89bcfc49c42738ebcc0f9d5c979e037556435f44a27aa2' AND `hash_type` = 0 AND `marked_for_deletion` = 0";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql2 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const assetsSql3 = @"SELECT * FROM `assets` WHERE `id` = 4 AND `url` IS NULL AND `key` IS NULL AND `headers` IS NULL AND `type` = 'js' AND `metadata` IS NULL AND `download_time` = 1614137406588 AND `relative_path` = 'bundle-1614137401950' AND `hash` = '6ff4ee75b48a21c7a9ed98015ff6bfd0a47b94cd087c5e2258262e65af239952' AND `hash_type` = 0 AND `marked_for_deletion` = 0";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:assetsSql3 withArgs:nil onDatabase:migratedDb error:nil].count);

  NSString * const updatesAssetsSql1 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql1 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesAssetsSql2 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql2 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const updatesAssetsSql3 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'594100ea066e4804b5c7c907c773f980' AND `asset_id` = 4";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesAssetsSql3 withArgs:nil onDatabase:migratedDb error:nil].count);

  // make sure metadata -> manifest column rename worked
  NSString * const updatesNonNullManifestSql = @"SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661' AND `manifest` = '{\\\"metadata\\\":{\\\"updateGroup\\\":\\\"34993d39-57e6-46cf-8fa2-eba836f40828\\\",\\\"branchName\\\":\\\"rollout\\\"}}'";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:updatesNonNullManifestSql withArgs:nil onDatabase:migratedDb error:nil].count);

  // make sure last_accessed column was filled in appropriately (all existing updates have the same last_accessed time)
  NSString * const lastAccessedSql1 = @"SELECT DISTINCT last_accessed FROM `updates`";
  XCTAssertEqual(1, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:lastAccessedSql1 withArgs:nil onDatabase:migratedDb error:nil].count);

  // make sure we can add new updates with different last_accessed times
  NSError *lastAccessedError;
  NSString * const lastAccessedSql2 = @"INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES\
  (X'8F06A50E5A68499F986CCA31EE159F81','https://exp.host/@esamelson/sdk41updates',1619133262732,'41.0.0',NULL,NULL,1,1,1619647642456)";
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:lastAccessedSql2 withArgs:nil onDatabase:migratedDb error:&lastAccessedError];
  XCTAssertNil(lastAccessedError);
  NSString * const lastAccessedSql3 = @"SELECT DISTINCT last_accessed FROM `updates`";
  XCTAssertEqual(2, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:lastAccessedSql3 withArgs:nil onDatabase:migratedDb error:nil].count);

  // make sure foreign key constraints still work

  // try to insert an update with a non-existent launch asset id (47)
  NSString * const foreignKeyInsertBadSql1 = @"INSERT INTO \"updates\" (\"id\",\"scope_key\",\"commit_time\",\"runtime_version\",\"launch_asset_id\",\"manifest\",\"status\",\"keep\", \"last_accessed\") VALUES\
  (X'E1AC9D5F55E041BBA5A9193DD1C1123A','https://exp.host/@esamelson/sdk41updates',1620168547318,'41.0.0',47,NULL,1,1,1619647642456)";
  NSError *foreignKeyError1;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:foreignKeyInsertBadSql1 withArgs:nil onDatabase:migratedDb error:&foreignKeyError1];
  XCTAssertNotNil(foreignKeyError1);
  XCTAssertEqual(787, foreignKeyError1.code); // SQLITE_CONSTRAINT_FOREIGNKEY

  // try to insert an entry in updates_assets that references a nonexistent update
  NSString * const foreignKeyInsertBadSql2 = @"INSERT INTO `updates_assets` (`update_id`, `asset_id`) VALUES (X'3CF0A835CB3A4A5D9C14DFA3D55DE44D', 3)";
  NSError *foreignKeyError2;
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:foreignKeyInsertBadSql2 withArgs:nil onDatabase:migratedDb error:&foreignKeyError2];
  XCTAssertNotNil(foreignKeyError2);
  XCTAssertEqual(787, foreignKeyError2.code); // SQLITE_CONSTRAINT_FOREIGNKEY

  // test updates on delete cascade
  NSString * const deleteSql = @"DELETE FROM `assets` WHERE `id` = 3";
  NSString * const selectDeletedSql1 = @"SELECT * FROM `updates` WHERE `id` = X'8C263F9DE3FF48888496E3244C788661'";
  [ABI42_0_0EXUpdatesDatabaseUtils executeSql:deleteSql withArgs:nil onDatabase:migratedDb error:nil];
  XCTAssertEqual(0, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:selectDeletedSql1 withArgs:nil onDatabase:migratedDb error:nil].count);

  // test updates_assets on delete cascade
  // previous deletion should have deleted the update, which then should have deleted both entries in updates_assets
  NSString * const selectDeletedSql2 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 2";
  XCTAssertEqual(0, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:selectDeletedSql2 withArgs:nil onDatabase:migratedDb error:nil].count);
  NSString * const selectDeletedSql3 = @"SELECT * FROM `updates_assets` WHERE `update_id` = X'8C263F9DE3FF48888496E3244C788661' AND `asset_id` = 3";
  XCTAssertEqual(0, [ABI42_0_0EXUpdatesDatabaseUtils executeSql:selectDeletedSql3 withArgs:nil onDatabase:migratedDb error:nil].count);
}

@end
