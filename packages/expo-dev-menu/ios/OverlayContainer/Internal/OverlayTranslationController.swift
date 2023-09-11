//  Copyright (c) 2018, Applidium. All rights reserved
//  OverlayTranslationController.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 29/11/2018.
//

import UIKit

enum OverlayTranslationPosition {
    case top, bottom, inFlight, stationary
}

protocol OverlayTranslationController: AnyObject {
    var lastTranslationEndNotchIndex: Int { get }
    var translationHeight: CGFloat { get }
    var translationPosition: OverlayTranslationPosition { get }

    func isDraggable(at point: CGPoint, in coordinateSpace: UICoordinateSpace) -> Bool

    func overlayHasReachedANotch() -> Bool

    func startOverlayTranslation()
    func dragOverlay(withOffset offset: CGFloat, usesFunction: Bool)
    func endOverlayTranslation(withVelocity velocity: CGPoint)
}
