// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import StoreKit
import UIKit

@MainActor
final class UserReviewManager: ObservableObject {
  @Published private(set) var shouldShowReviewSection = false

  private let storageKey = "userReviewInfo"
  private let lastCrashKey = "EXKernelLastFatalErrorDateDefaultsKey"
  private var info = UserReviewInfo()
  private var appsCount = 0
  private var snacksCount = 0
  private var lastCrashDate: Date?

  init() {
    loadInfo()
    loadLastCrashDate()
    refreshShouldShow()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
  }

  func recordHomeAppear() {
    info.appOpenedCounter += 1
    saveInfo()
    refreshShouldShow()
  }

  func updateCounts(apps: Int, snacks: Int) {
    appsCount = apps
    snacksCount = snacks
    refreshShouldShow()
  }

  func dismissReviewSection() {
    info.lastDismissDate = Date()
    saveInfo()
    refreshShouldShow()
  }

  func requestReview() {
    info.askedForNativeReviewDate = Date()
    saveInfo()
    refreshShouldShow()
    requestStoreReview()
  }

  func provideFeedback() {
    info.showFeedbackFormDate = Date()
    saveInfo()
    refreshShouldShow()
  }

  private func refreshShouldShow() {
    let now = Date()
    let noRecentDismisses = info.lastDismissDate.map {
      now.timeIntervalSince($0) > 15 * 24 * 60 * 60
    } ?? true
    let noRecentCrashes = lastCrashDate.map {
      now.timeIntervalSince($0) > 60 * 60
    } ?? true
    let hasAskedForReview = info.askedForNativeReviewDate != nil
    let hasFeedbackForm = info.showFeedbackFormDate != nil
    let meetsUsageThreshold = info.appOpenedCounter >= 50 || appsCount >= 5 || snacksCount >= 5

    shouldShowReviewSection = noRecentDismisses
      && !hasAskedForReview
      && !hasFeedbackForm
      && noRecentCrashes
      && meetsUsageThreshold
  }

  private func requestStoreReview() {
    if let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .first(where: { $0.activationState == .foregroundActive }) {
      SKStoreReviewController.requestReview(in: scene)
    } else {
      SKStoreReviewController.requestReview()
    }
  }

  private func loadInfo() {
    let storedData: Data?
    if let data = UserDefaults.standard.data(forKey: storageKey) {
      storedData = data
    } else if let string = UserDefaults.standard.string(forKey: storageKey) {
      storedData = string.data(using: .utf8)
    } else {
      storedData = nil
    }

    guard let storedData else {
      info = UserReviewInfo()
      return
    }

    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    if let decoded = try? decoder.decode(UserReviewInfo.self, from: storedData) {
      info = decoded
    } else {
      info = UserReviewInfo()
    }
  }

  @objc private func handleWillEnterForeground() {
    loadLastCrashDate()
    refreshShouldShow()
  }

  private func loadLastCrashDate() {
    if let date = UserDefaults.standard.object(forKey: lastCrashKey) as? Date {
      lastCrashDate = date
    } else {
      lastCrashDate = nil
    }
  }

  private func saveInfo() {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    if let data = try? encoder.encode(info),
       let string = String(data: data, encoding: .utf8) {
      UserDefaults.standard.set(string, forKey: storageKey)
    }
  }
}

private struct UserReviewInfo: Codable {
  var askedForNativeReviewDate: Date?
  var lastDismissDate: Date?
  var showFeedbackFormDate: Date?
  var appOpenedCounter: Int = 0
}
