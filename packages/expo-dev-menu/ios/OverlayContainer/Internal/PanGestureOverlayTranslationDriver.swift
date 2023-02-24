//  Copyright (c) 2018, Applidium. All rights reserved
//  PanGestureOverlayTranslationDriver.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 29/11/2018.
//

import UIKit

class PanGestureOverlayTranslationDriver: NSObject,
                                          OverlayTranslationDriver,
                                          UIGestureRecognizerDelegate {

    private weak var translationController: OverlayTranslationController?
    private let panGestureRecognizer: OverlayTranslationGestureRecognizer

    // MARK: - Life Cycle

    init(translationController: OverlayTranslationController,
         panGestureRecognizer: OverlayTranslationGestureRecognizer) {
        self.translationController = translationController
        self.panGestureRecognizer = panGestureRecognizer
        super.init()
        panGestureRecognizer.delegate = self
        panGestureRecognizer.addTarget(self, action: #selector(overlayPanGestureAction(_:)))
    }

    // MARK: - OverlayTranslationDriver

    func clean() {
        // no-op
    }

    // MARK: - UIGestureRecognizerDelegate

    func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard let view = gestureRecognizer.view,
              let gesture = gestureRecognizer as? OverlayTranslationGestureRecognizer else {
            return false
        }
        return translationController?.isDraggable(at: gesture.startingLocation, in: view) ?? false
    }

    // MARK: - Action

    @objc private func overlayPanGestureAction(_ sender: OverlayTranslationGestureRecognizer) {
        guard let controller = translationController, let view = sender.view else { return }
        let translation = sender.translation(in: nil)
        switch sender.state {
        case .began:
            controller.startOverlayTranslation()
            if controller.isDraggable(at: sender.startingLocation, in: view) {
                controller.dragOverlay(withOffset: translation.y, usesFunction: true)
            } else {
                sender.cancel()
            }
        case .changed:
            controller.dragOverlay(withOffset: translation.y, usesFunction: true)
        case .failed, .ended, .cancelled:
            let velocity = sender.velocity(in: nil)
            controller.endOverlayTranslation(withVelocity: velocity)
        case .possible:
            break
        @unknown default:
            break
        }
    }
}
