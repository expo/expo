//
//  ExpoSMSModule.swift
//  ExpoSMS
//
//  Created by Alan Hughes on 11/11/2022.
//

import Foundation
import ExpoModulesCore
import WebKit
import MessageUI
import CoreServices
import MobileCoreServices
import UniformTypeIdentifiers

struct ExpoSMSContext {
    let promise: Promise
    let smsDelgate: SMSDelegate
}

public class ExpoSMSModule: Module, SMSResultHandler {
    private var smsContext: ExpoSMSContext?
    private lazy var utils = appContext?.utilities

    public func definition() -> ModuleDefinition {
        Name("ExpoSMS")

        AsyncFunction("isAvailableAsync") { (promise: Promise) in
            promise.resolve(MFMessageComposeViewController.canSendText())
        }

        AsyncFunction("sendSMSAsync") {(addresses: [String], message: String, options: SmsOptions?, promise: Promise) in
            sendSMSAsync(addresses: addresses, message: message, options: options, promise: promise)
        }.runOnQueue(.main)
    }

    private func sendSMSAsync(addresses: [String], message: String, options: SmsOptions?, promise: Promise) {
        if !MFMessageComposeViewController.canSendText() {
            promise.reject("E_SMS_UNAVAILABLE", "SMS service not available")
            return
        }

        if smsContext != nil {
            promise.reject("E_SMS_SENDING_IN_PROGRESS",
                           "Different SMS sending in progress. Await the old request and then try again.")
            return
        }

        let smsDelgate = SMSDelegate(handler: self)
        let context = ExpoSMSContext(promise: promise, smsDelgate: smsDelgate)

        let messageComposeViewController = MFMessageComposeViewController()
        messageComposeViewController.messageComposeDelegate = context.smsDelgate
        messageComposeViewController.recipients = addresses
        messageComposeViewController.body = message

        if let options {
            for attachment in options.attachments {
                let utiRef = UTTypeCreatePreferredIdentifierForTag(
                    kUTTagClassMIMEType, attachment.mimeType as CFString, nil)

                if utiRef == nil {
                    context.promise.reject("E_SMS_ATTACHMENT",
                                           "Failed to find UTI for mimeType: \(attachment.mimeType)")
                    return
                }

                guard let url = URL(string: attachment.uri) else {
                    context.promise.reject("E_SMS_ATTACHMENT", "Inavlid file uri: \(attachment.uri)")
                    return
                }

                do {
                    let data = try Data(contentsOf: url, options: .mappedIfSafe)
                    let attached = messageComposeViewController.addAttachmentData(data,
                                                                            typeIdentifier: attachment.mimeType,
                                                                            filename: attachment.filename)
                    if !attached {
                        context.promise.reject("E_SMS_ATTACHMENT", "Failed to attach file: \(attachment.uri)")
                        return
                    }
                } catch {
                    context.promise.reject(error)
                    return
                }
            }
        }

        smsContext = context
        utils?.currentViewController()?.present(messageComposeViewController, animated: true, completion: nil)
    }

    func onSuccess(_ data: [String: String]) {
        guard let promise = smsContext?.promise else {
            NSLog("Context Lost")
            return
        }
        smsContext = nil
        promise.resolve(data)
    }

    func onFailure(_ error: String) {
        guard let promise = smsContext?.promise else {
            NSLog("Context Lost")
            return
        }
        smsContext = nil
        promise.reject("E_SMS_SENDING_FAILED", error)
    }
}
