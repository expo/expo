//
//  ConstantsModule.swift
//  ExpoConstants-ExpoConstants
//
//  Created by Alan Hughes on 11/11/2022.
//

import ExpoModulesCore
import WebKit

public class ConstantsModule: Module {

    private lazy var constants = {
        let dict = appContext?.constants?.constants()

        if let result = dict as? [String: Any?] {
            return result
        }

        return [String: Any?]()
    }()

    public func definition() -> ModuleDefinition {
        Name("ExponentConstants")

        Constants {
            return constants
        }

        AsyncFunction("getWebViewUserAgentAsync") { (promise: Promise) in
            let webView = WKWebView()
            let result = webView.value(forKey: "userAgent")
            promise.resolve(result)
        }.runOnQueue(.main)
    }
}
