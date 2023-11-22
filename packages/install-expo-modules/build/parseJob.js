/**
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 'License'); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

// parsing is slow and blocking right now
// so we do it in a separate process
var fs = require('fs'),
    parser = require('./parser/pbxproj'),
    path = process.argv[2],
    fileContents, obj;

try {
    fileContents = fs.readFileSync(path, 'utf-8');
    obj = parser.parse(fileContents);
    process.send(obj);
} catch (e) {
    process.send(e);
    process.exitCode = 1;
}
