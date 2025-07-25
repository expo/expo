//
// Project «InputMask»
// Created by Jeorge Taflanidi
//

#if canImport(Foundation)

import Foundation


/**
 ### RTLMask

 A right-to-left ``Mask`` subclass. Applies format from the string end.
 */
public class RTLMask: Mask {
    private static var cache: [String: RTLMask] = [:]
    
    public required init(format: String, customNotations: [Notation] = []) throws {
        try super.init(format: format.reversedFormat(), customNotations: customNotations)
    }
    
    public override class func getOrCreate(withFormat format: String, customNotations: [Notation] = []) throws -> RTLMask {
        if let cachedMask: RTLMask = cache[format.reversedFormat()] {
            return cachedMask
        } else {
            let mask: RTLMask = try RTLMask(format: format, customNotations: customNotations)
            cache[format.reversedFormat()] = mask
            return mask
        }
    }

    public override func apply(toText text: CaretString) -> Result {
        return super.apply(toText: text.reversed()).reversed()
    }
    
    override func makeIterator(forText text: CaretString) -> CaretStringIterator {
        return RTLCaretStringIterator(caretString: text)
    }
}

#endif
