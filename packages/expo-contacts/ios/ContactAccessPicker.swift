// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import ContactsUI
import ExpoModulesCore

/**
 A plain view that presents contact access picker on mount.
 */
@available(iOS 18.0, *)
internal struct ContactAccessPicker: View {
  @State
  private var isPickerPresented = false

  internal var completion: (([String]) -> Void)?

  var body: some View {
    EmptyView()
      .contactAccessPicker(isPresented: $isPickerPresented) { contactIds in
        isPickerPresented = false
        completion?(contactIds)
      }
      .onAppear {
        isPickerPresented = true
      }
  }

  // MARK: - Statics

  private static var presentedHostingController: UIHostingController<ContactAccessPicker>?
  private static var presentedPickerPromise: Promise?

  internal static func present(inViewController viewController: UIViewController, promise: Promise) {
    if presentedHostingController != nil {
      return promise.reject(AccessPickerAlreadyPresentedException())
    }
    // There is no equivalent for the contact access picker in UIKit,
    // so we mount a dedicated SwiftUI view wherever to then present the picker.
    // The completion handler is called when the picker is dismissed by either canceling or saving the selection.
    let accessPicker = ContactAccessPicker { contactIds in
      presentedPickerPromise?.resolve(contactIds)

      // SwiftUI doesn't guarantee that the completion is called on the main thread.
      DispatchQueue.main.async {
        // Unmount the hosting controller and a view that presented the picker.
        presentedHostingController?.view.removeFromSuperview()
        presentedHostingController?.removeFromParent()
        presentedHostingController = nil
        presentedPickerPromise = nil
      }
    }
    let hostingController = UIHostingController(rootView: accessPicker)

    // Mount the hosting controller with a view that presents the picker.
    viewController.addChild(hostingController)
    viewController.view.addSubview(hostingController.view)
    hostingController.didMove(toParent: viewController)
    presentedHostingController = hostingController
    presentedPickerPromise = promise
  }
}
