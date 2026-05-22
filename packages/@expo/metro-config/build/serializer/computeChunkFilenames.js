"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.precomputeChunkFilenames = precomputeChunkFilenames;
/** Tarjan's SCC partition, exposing lazy transitive reachability per chunk */
const makeTopologicalSet = (chunks, chunksByPath) => {
    const discoveryIndex = new Map();
    const lowLink = new Map();
    const onPath = new Set();
    const path = [];
    const groupOf = new Map();
    let nextIndex = 0;
    const visit = (node) => {
        discoveryIndex.set(node, nextIndex);
        lowLink.set(node, nextIndex);
        nextIndex++;
        path.push(node);
        onPath.add(node);
        for (const neighbor of node.getAsyncChunkTargets(chunksByPath)) {
            if (!discoveryIndex.has(neighbor)) {
                visit(neighbor);
                lowLink.set(node, Math.min(lowLink.get(node), lowLink.get(neighbor)));
            }
            else if (onPath.has(neighbor)) {
                lowLink.set(node, Math.min(lowLink.get(node), discoveryIndex.get(neighbor)));
            }
        }
        // A node whose lowLink equals its own discoveryIndex is the root of an SCC
        if (lowLink.get(node) === discoveryIndex.get(node)) {
            const component = new Set();
            let member;
            do {
                member = path.pop();
                onPath.delete(member);
                component.add(member);
                groupOf.set(member, component);
            } while (member !== node);
        }
    };
    for (const chunk of chunks) {
        if (!discoveryIndex.has(chunk)) {
            visit(chunk);
        }
    }
    const _closureCache = new Map();
    const collect = (group) => {
        const cached = _closureCache.get(group);
        if (cached)
            return cached;
        const closure = new Set(group);
        _closureCache.set(group, closure);
        for (const member of group) {
            for (const target of member.getAsyncChunkTargets(chunksByPath)) {
                const transitiveGroup = groupOf.get(target);
                if (transitiveGroup === group)
                    continue;
                for (const reachable of collect(transitiveGroup)) {
                    closure.add(reachable);
                }
            }
        }
        return closure;
    };
    return {
        getReachable(chunk) {
            return collect(groupOf.get(chunk));
        },
    };
};
/** Each chunk's intrinsic (no-async-paths) source and the corresponding filename hash */
const makeIntrinsics = (serializerConfig) => {
    const source = new Map();
    const hashes = new Map();
    const intrinsics = {
        getSource(chunk) {
            let src = source.get(chunk);
            if (src === undefined) {
                src = chunk.getStableChunkSource(serializerConfig);
                source.set(chunk, src);
            }
            return src;
        },
        getHash(chunk) {
            let hash = hashes.get(chunk);
            if (hash === undefined) {
                const src = intrinsics.getSource(chunk);
                hash = chunk.getFilename(src);
                hashes.set(chunk, hash);
            }
            return hash;
        },
    };
    return intrinsics;
};
/** Precompute each chunk's emitted filename.
 *
 * Hashes each chunk's intrinsic source combined with the intrinsics of all
 * its transitively reachabl async chunks.
 */
function precomputeChunkFilenames({ chunks, chunksByPath, serializerConfig, recomputeChunkNames, }) {
    const filenames = new Map();
    // When not exporting, chunk.getFilename ignores its input
    if (!recomputeChunkNames) {
        for (const chunk of chunks) {
            filenames.set(chunk, chunk.name);
        }
        return filenames;
    }
    const intrinsics = makeIntrinsics(serializerConfig);
    const topology = makeTopologicalSet(chunks, chunksByPath);
    for (const chunk of chunks) {
        const parts = [intrinsics.getSource(chunk)];
        for (const candidate of topology.getReachable(chunk)) {
            if (candidate !== chunk) {
                parts.push(intrinsics.getHash(candidate));
            }
        }
        filenames.set(chunk, chunk.getFilename(parts.join('\n')));
    }
    return filenames;
}
//# sourceMappingURL=computeChunkFilenames.js.map