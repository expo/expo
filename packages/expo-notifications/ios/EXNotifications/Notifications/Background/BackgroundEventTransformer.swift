// Copyright 2023-present 650 Industries. All rights reserved.

import Foundation

/**
 * Transforms background notification payloads into a format expected by the JavaScript layer.
 */
public class BackgroundEventTransformer {
  
  public static func transform(_ payload: NSDictionary) -> [String: Any] {
    var result: [String: Any] = [:]
    
    // Set notification to null by default
    result["notification"] = NSNull()
    
    // Extract and transform data
    var data: [String: Any] = [:]
    
    // Copy aps dictionary if it exists
    if let aps = payload["aps"] as? [String: Any] {
      result["aps"] = aps
      
      if let alert = aps["alert"] {
        result["notification"] = alert
      }
    }
    
    if let body = payload["body"] {
      data["body"] = body
    }
    
    if let aps = payload["aps"] as? [String: Any],
       let category = aps["category"] as? String {
      data["categoryId"] = category
    }
    
    // TODO do not hand-pick these fields, just copy all the fields from the payload (except for aps and body)
    if let scopeKey = payload["scopeKey"] {
      data["scopeKey"] = scopeKey
    }
    if let experienceId = payload["experienceId"] {
      data["experienceId"] = experienceId
    }
    if let projectId = payload["projectId"] {
      data["projectId"] = projectId
    }
    
    result["data"] = data
    
    return result
  }
}
