//  Copyright (c) 2018, Applidium. All rights reserved
//  Geometry+Utils.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 22/11/2018.
//

import UIKit

extension CGPoint {
    func offset(by point: CGPoint) -> CGPoint {
        return offsetBy(dx: point.x, dy: point.y)
    }

    func offsetBy(dx: CGFloat, dy: CGFloat) -> CGPoint {
        return CGPoint(x: x + dx, y: y + dy)
    }

    func multiply(by multiplier: CGFloat) -> CGPoint {
        return multiplyBy(dx: multiplier, dy: multiplier)
    }

    func multiplyBy(dx: CGFloat, dy: CGFloat) -> CGPoint {
        return CGPoint(x: x * dx, y: y * dy)
    }
}
