// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

struct sqlite3;

int crsqlite_auto_init_from_swift(void);

int crsqlite_init_from_swift(struct sqlite3 *db);
