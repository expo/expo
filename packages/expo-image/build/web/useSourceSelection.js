import React, { useState, useRef } from 'react';
import { isBlurhashString, isThumbhashString } from '../utils/resolveSources';
function findBestSourceForSize(sources, size) {
    if (sources?.length === 1) {
        return sources[0];
    }
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
function getDefaultResponsivePolicy(sources) {
    const allSourcesHaveStaticSizeSelectionInfo = sources?.every((source) => typeof source === 'object' && source.webMaxViewportWidth != null);
    return allSourcesHaveStaticSizeSelectionInfo ? 'static' : 'live';
}
function selectSource(sources, size, responsivePolicy) {
    if (sources == null || sources.length === 0) {
        return null;
    }
    if (responsivePolicy !== 'static') {
        return findBestSourceForSize(sources, size);
    }
    const staticSupportedSources = sources
        .filter((s) => s.uri &&
        s.webMaxViewportWidth != null &&
        s.width != null &&
        !isBlurhashString(s.uri) &&
        !isThumbhashString(s.uri))
        .sort((a, b) => (a.webMaxViewportWidth ?? 0) - (b.webMaxViewportWidth ?? 0));
    if (staticSupportedSources.length === 0) {
        console.warn("You've set the `static` responsivePolicy but none of the sources have the `webMaxViewportWidth` and `width` properties set. Falling back to the `initial` policy.");
        return findBestSourceForSize(sources, size);
    }
    const srcset = staticSupportedSources
        ?.map((source) => `${source.uri} ${source.width}w`)
        .join(', ');
    const sizes = `${staticSupportedSources
        ?.map((source) => `(max-width: ${source.webMaxViewportWidth}px) ${source.width}px`)
        .join(', ')}, ${staticSupportedSources[staticSupportedSources.length - 1]?.width}px`;
    return {
        srcset,
        sizes,
        uri: staticSupportedSources[staticSupportedSources.length - 1]?.uri ?? '',
        type: 'srcset',
    };
}
export default function useSourceSelection(sources, responsivePolicy = getDefaultResponsivePolicy(sources), measurementCallback) {
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
        // we can't short circuit here since we need to read the size for better animated transitions
        if (!hasMoreThanOneSource && !measurementCallback) {
            return;
        }
        const rect = element?.getBoundingClientRect();
        measurementCallback?.(element, rect);
        setSize(rect);
        if (responsivePolicy === 'live') {
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
    }, [hasMoreThanOneSource, responsivePolicy]);
    const source = selectSource(sources, size, responsivePolicy);
    return React.useMemo(() => ({
        containerRef,
        source,
    }), [source]);
}
//# sourceMappingURL=useSourceSelection.js.map