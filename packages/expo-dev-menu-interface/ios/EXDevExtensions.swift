// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

// A protocol for determining if a given bridge module is a "DevExtension"
// DevExtensions are passed through to the dev-menu and dev-launcher JS runtimes
// This protocol has no fields on it as of yet but could be extended if additional functionality is needed in the future

@objc
public protocol EXDevExtensionProtocol {}
