// Copyright 2018-present 650 Industries. All rights reserved.

import React
import Foundation
import ExpoModulesCore

@objc(EXTaskDelegate)
public protocol EXTaskDelegate: NSObjectProtocol {
    func executeTask(_ task: EXTaskInterface, withData data: [AnyHashable: Any]?, withError error: Error?)
}

@objc(EXTask)
public class EXTask: NSObject, EXTaskInterface {
    @objc public let name: String
    @objc public let appId: String
    @objc public let appUrl: String
    @objc public let consumer: EXTaskConsumerInterface
    @objc public var options: [AnyHashable: Any]?
    @objc public weak var delegate: EXTaskDelegate?

    @objc public init(name: String,
                      appId: String,
                      appUrl: String,
                      consumerClass: AnyClass,
                      options: [AnyHashable: Any]?,
                      delegate: EXTaskDelegate?) {
        self.name = name
        self.appId = appId
        self.appUrl = appUrl
        self.consumer = (consumerClass as! NSObject.Type).init() as! EXTaskConsumerInterface
        self.options = options
        self.delegate = delegate
        super.init()
    }

    @objc public func execute(withData data: [AnyHashable: Any]?, withError error: Error?) {
        delegate?.executeTask(self, withData: data, withError: error)
    }
}
