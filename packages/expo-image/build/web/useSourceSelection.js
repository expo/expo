import React, { useState, useRef } from 'react';
function findBestSourceForSize(sources, size) {
    return ([...(sources || [])]
        // look for the smallest image that's still larger then a container
        ?.map((source) => {
        if (!size) {
            return { source, penalty: 0, covers: false };
        }
        const { width, height } = typeof source === 'object' ? source : { width: null, height: null };
        if (width == null || height == null) {
            return { source, penalty: 0, covers: false };
        }
        if (width < size.width || height < size.height) {
            return {
                source,
                penalty: Math.max(size.width - width, size.height - height),
                covers: false,
            };
        }
        return { source, penalty: (width - size.width) * (height - size.height), covers: true };
    })
        .sort((a, b) => a.penalty - b.penalty)
        .sort((a, b) => Number(b.covers) - Number(a.covers))[0]?.source ?? null);
}
export default function useSourceSelection(sources, sizeCalculation = 'live', measurementCallback) {
    const hasMoreThanOneSource = (sources?.length ?? 0) > 1;
    // null - not calculated yet, DOMRect - size available
    const [size, setSize] = useState(null);
    const resizeObserver = useRef(null);
    React.useEffect(() => {
        return () => {
            resizeObserver.current?.disconnect();
        };
    }, []);
    const containerRef = React.useCallback((element) => {
        if (!hasMoreThanOneSource && !measurementCallback) {
            return;
        }
        const rect = element?.getBoundingClientRect();
        measurementCallback?.(element, rect);
        setSize(rect);
        if (sizeCalculation === 'live') {
            resizeObserver.current?.disconnect();
            if (!element) {
                return;
            }
            resizeObserver.current = new ResizeObserver((entries) => {
                setSize(entries[0].contentRect);
                measurementCallback?.(entries[0].target, entries[0].contentRect);
            });
            resizeObserver.current.observe(element);
        }
    }, [hasMoreThanOneSource, sizeCalculation]);
    const bestSourceForSize = size !== undefined ? findBestSourceForSize(sources, size) : null;
    const source = (hasMoreThanOneSource ? bestSourceForSize : sources?.[0]) ?? null;
    return React.useMemo(() => ({
        containerRef,
        source,
    }), [source]);
}
//# sourceMappingURL=useSourceSelection.js.map