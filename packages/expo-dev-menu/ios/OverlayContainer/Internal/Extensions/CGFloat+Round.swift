//  Copyright (c) 2018, Applidium. All rights reserved
//  CGFloat+Round.swift
//  FluxTire
//
//  Created by Gaétan Zanella on 17/10/2018.
//  

import Foundation
import CoreGraphics

extension CGFloat {
    func oc_rounded(toDecimals decimals: Int = 2) -> CGFloat {
        let multiplier = CGFloat(pow(Double(10), Double(decimals)))
        return (self * multiplier).rounded() / multiplier
    }
}
