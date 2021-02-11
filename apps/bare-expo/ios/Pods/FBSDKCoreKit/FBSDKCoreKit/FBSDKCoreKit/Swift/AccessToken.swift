// Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import Foundation

/**
 AccessToken Extension
 */
public extension AccessToken {
  /**
   Returns the known granted permissions.
   */
  var permissions: Set<Permission> {
    Set(__permissions.map { Permission(stringLiteral: $0) })
  }

  /**
   Returns the known declined permissions.
   */
  var declinedPermissions: Set<Permission> {
    Set(__declinedPermissions.map { Permission(stringLiteral: $0) })
  }

  /**
   Returns the known expired permissions.
   */
  var expiredPermissions: Set<Permission> {
    Set(__expiredPermissions.map { Permission(stringLiteral: $0) })
  }

  /**
   Convenience getter to determine if a permission has been granted
   - parameter permission: The permission to check
   */
  func hasGranted(_ permission: Permission) -> Bool {
    hasGranted(permission: permission.name)
  }
}
