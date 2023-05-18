// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
import CoreSpotlight
import MobileCoreServices

struct MetadataOptions: Record {
    @Field
    var activityType: String!
    @Field
    var id: String!
    @Field
    var isEligibleForHandoff: Bool = true
    @Field
    var isEligibleForPrediction: Bool = true
    @Field
    var isEligibleForPublicIndexing: Bool = false
    @Field
    var isEligibleForSearch: Bool = true
    @Field
    var title: String?
    @Field
    var webpageURL: URL?
    @Field
    var imageUrl: URL?
    @Field
    var keywords: [String]?
    @Field
    var dateModified: Date?
    @Field
    var userInfo: [String: AnyHashable]?
    @Field
    var description: String?
}

let INDEXED_ROUTE = Bundle.main.bundleIdentifier! + ".expo.index_route"

var launchedActivity: NSUserActivity?

internal class InvalidSchemeException: Exception {
    override var reason: String {
        "Scheme file:// is not allowed for location origin (webpageUrl in NSUserActivity)"
    }
}

public class ExpoHeadModule: Module {
    private var activities = Set<NSUserActivity>()
    
    public required init(appContext: AppContext) {
        super.init(appContext: appContext)
    }
    
    
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    public func definition() -> ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ExpoHead')` in JavaScript.
        Name("ExpoHead")
        
        Constants([
            "activities": [
                "INDEXED_ROUTE": INDEXED_ROUTE
            ]
        ])
        
        Function("getLaunchActivity") { () -> [String: Any]? in
            if let activity = launchedActivity {
                return [
                    "activityType": activity.activityType,
                    "description": activity.contentAttributeSet?.contentDescription,
                    "id": activity.persistentIdentifier,
                    "isEligibleForHandoff": activity.isEligibleForHandoff,
                    "isEligibleForPrediction": activity.isEligibleForPrediction,
                    "isEligibleForPublicIndexing": activity.isEligibleForPublicIndexing,
                    "isEligibleForSearch": activity.isEligibleForSearch,
                    "title": activity.title,
                    "webpageURL": activity.webpageURL,
                    "imageUrl": activity.contentAttributeSet?.thumbnailURL,
                    "keywords": activity.keywords,
                    "dateModified": activity.contentAttributeSet?.metadataModificationDate,
                    "userInfo": activity.userInfo,
                ]
            }
            return nil
        }
        
        Function("createActivity") { (value: MetadataOptions) in
            if (value.webpageURL?.absoluteString.starts(with: "file://") == true) {
                throw Exception(name: "Invalid webpageUrl", description: "Scheme file:// is not allowed for location origin (webpageUrl in NSUserActivity). URL: \(value.webpageURL!.absoluteString)")
            }
            
            let activity = createOrUpdateActivity(value: value)
            activity.becomeCurrent()
        }
        
        AsyncFunction("clearActivitiesAsync") { (ids: [String], promise: Promise) in
            ids.forEach { id in
                self.revokeActivity(id: id)
            }
            
            CSSearchableIndex.default().deleteSearchableItems(withIdentifiers: ids, completionHandler: { error in
                if (error != nil) {
                    promise.reject(error as! Exception)
                } else {
                    promise.resolve()
                }
            })
        }
        
        Function("suspendActivity") { (id: String) in
            let activity = self.activities.first(where: { $0.persistentIdentifier == id })
            activity?.resignCurrent()
        }
        
        Function("revokeActivity") { (id: String) in
            self.revokeActivity(id: id)
        }
    }
    
    func createOrUpdateActivity(value: MetadataOptions) -> NSUserActivity {
        let att = CSSearchableItemAttributeSet(itemContentType: kUTTypeText as String)
        let existing = self.activities.first(where: { $0.persistentIdentifier == value.id })
        let activity = existing ?? NSUserActivity(activityType: value.activityType)
        
        if (existing == nil) {
            self.activities.insert(activity)
        }
        
        // TODO: https://gist.github.com/alexruperez/ea81aa3e371f7d0d7ea5e594d7e9ad08
        activity.targetContentIdentifier = value.id
        activity.persistentIdentifier = value.id
        activity.isEligibleForHandoff = value.isEligibleForHandoff
        activity.isEligibleForPrediction = value.isEligibleForPrediction;
        activity.isEligibleForPublicIndexing = value.isEligibleForPublicIndexing
        activity.isEligibleForSearch = value.isEligibleForSearch
        activity.title = value.title
        
        if let keywords = value.keywords {
            activity.keywords = Set(keywords)
        }
        
        activity.userInfo = value.userInfo
        // Required for handling incoming requests
        //      activity.requiredUserInfoKeys = ["href"]
        
        if (value.webpageURL != nil) {
            
            // If you’re using all three APIs, it works well to use the URL of the relevant webpage as the value for uniqueIdentifier, relatedUniqueIdentifier, and webpageURL.
            // https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/CombiningAPIs.html#//apple_ref/doc/uid/TP40016308-CH10-SW1
            activity.webpageURL = value.webpageURL
            att.relatedUniqueIdentifier = value.webpageURL?.absoluteString
        }
        
        att.title = value.title
        // Make all indexed routes deletable
        att.domainIdentifier = INDEXED_ROUTE
        
        if let localUrl = value.imageUrl?.path {
            att.thumbnailURL = value.imageUrl
        }

        if let description = value.description {
            att.contentDescription = description
        }
        
        activity.contentAttributeSet = att;
        
        return activity
    }
    
    @discardableResult
    func revokeActivity(id: String) -> NSUserActivity? {
        let activity = self.activities.first(where: { $0.persistentIdentifier == id })
        activity?.invalidate()
        if let activity = activity {
            self.activities.remove(activity)
        }
        return activity
    }
}
