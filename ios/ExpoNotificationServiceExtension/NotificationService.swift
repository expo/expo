//
//  NotificationService.swift
//  ExpoNotificationServiceExtension
//
//  Created by Yifei He (hesyifei) on 06/27/2019.
//  Copyright © 2019 650 Industries. All rights reserved.
//

import UserNotifications

class NotificationService: UNNotificationServiceExtension {

	var contentHandler: ((UNNotificationContent) -> Void)?
	var bestAttemptContent: UNMutableNotificationContent?

	override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
		self.contentHandler = contentHandler
		bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

		if let bestAttemptContent = bestAttemptContent, let notificationBody = request.content.userInfo["body"] as? [String: Any] {
			// Display priority: video > audio > image
			if let richContent = notificationBody["_richContent"] as? [String: Any], let attachmentURLString = (richContent["video"] ?? richContent["audio"] ?? richContent["image"]) as? String {
				downloadAttachment(fromURL: attachmentURLString) { attachment in
					if let attachment = attachment {
						bestAttemptContent.attachments = [attachment]
					}
					contentHandler(bestAttemptContent)
				}
			} else {
				contentHandler(bestAttemptContent)
			}
		}
	}

	func downloadAttachment(fromURL attachmentURLString: String?, callback: ((UNNotificationAttachment?) -> Void)?) {
		if let attachmentURLString = attachmentURLString, let attachmentURL = URL(string: attachmentURLString) {
			URLSession.shared.downloadTask(with: attachmentURL) { (location, response, downloadError) in
				if let downloadError = downloadError {
					print("URLSession: Error with downloading the rich content attachment: \(downloadError.localizedDescription)")
					callback?(nil)
					return
				}

				if let location = location {
					// Prefix the filename with a random UUID to avoid having file with the same file name during `moveItem`.
					let temporaryURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString + attachmentURL.lastPathComponent)
					do {
						try FileManager.default.moveItem(at: location, to: temporaryURL)
						let attachment = try? UNNotificationAttachment(identifier: attachmentURLString, url: temporaryURL)
						callback?(attachment)
						try? FileManager.default.removeItem(at: temporaryURL)
					} catch let attachmentError {
						print("Error with using the rich content attachment: \(attachmentError)")
						callback?(nil)
					}
				}
				}.resume()
		} else {
			callback?(nil)
		}
	}

	override func serviceExtensionTimeWillExpire() {
		// Called just before the extension will be terminated by the system.
		// Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
		if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
			contentHandler(bestAttemptContent)
		}
	}

}
