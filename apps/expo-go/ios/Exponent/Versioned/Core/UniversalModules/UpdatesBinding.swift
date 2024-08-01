// Copyright 2020-present 650 Industries. All rights reserved.

import Foundation
import EXUpdates

typealias UpdatesAppRelaunchCompletionBlock = (Bool) -> Void

@objc(EXUpdatesBindingDelegate)
protocol UpdatesBindingDelegate {
  func configForScopeKey(_ scopeKey: String) -> UpdatesConfig?
  func selectionPolicyForScopeKey(_ scopeKey: String) -> SelectionPolicy?
  func launchedUpdateForScopeKey(_ scopeKey: String) -> Update?
  func assetFilesMapForScopeKey(_ scopeKey: String) -> [String: Any]?
  func isUsingEmbeddedAssetsForScopeKey(_ scopeKey: String) -> Bool
  func isStartedForScopeKey(_ scopeKey: String) -> Bool
  func requestRelaunchForScopeKey(_ scopeKey: String, withCompletion completion: UpdatesAppRelaunchCompletionBlock)
}
