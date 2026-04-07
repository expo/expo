"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.planQuery = planQuery;
function planQuery({ since, directoryFilters, extensions, includeSha1, includeSymlinks, }) {
    const fields = ['name', 'exists', 'mtime_ms', 'size'];
    if (includeSha1) {
        fields.push('content.sha1hex');
    }
    /**
     * Note on symlink_target:
     *
     * Watchman supports requesting the symlink_target field, which is
     * *potentially* more efficient if targets can be read from metadata without
     * reading/materialising files. However, at the time of writing, Watchman has
     * issues reporting symlink_target on some backends[1]. Additionally, though
     * the Eden watcher is known to work, it reads links serially[2] on demand[3]
     *  - less efficiently than we can do ourselves.
     * [1] https://github.com/facebook/watchman/issues/1084
     * [2] https://github.com/facebook/watchman/blob/v2023.01.02.00/watchman/watcher/eden.cpp#L476-L485
     * [3] https://github.com/facebook/watchman/blob/v2023.01.02.00/watchman/watcher/eden.cpp#L433-L434
     */
    if (includeSymlinks) {
        fields.push('type');
    }
    const allOfTerms = includeSymlinks
        ? [['anyof', ['allof', ['type', 'f'], ['suffix', extensions]], ['type', 'l']]]
        : [['type', 'f']];
    const query = { fields };
    /**
     * Watchman "query planner".
     *
     * Watchman file queries consist of 1 or more generators that feed
     * files through the expression evaluator.
     *
     * Strategy:
     * 1. Select the narrowest possible generator so that the expression
     *    evaluator has fewer candidates to process.
     * 2. Evaluate expressions from narrowest to broadest.
     * 3. Don't use an expression to recheck a condition that the
     *    generator already guarantees.
     * 4. Compose expressions to avoid combinatorial explosions in the
     *    number of terms.
     *
     * The ordering of generators/filters, from narrow to broad, is:
     * - since          = O(changes)
     * - glob / dirname = O(files in a subtree of the repo)
     * - suffix         = O(files in the repo)
     *
     * We assume that file extensions are ~uniformly distributed in the
     * repo but Haste map projects are focused on a handful of
     * directories. Therefore `glob` < `suffix`.
     */
    let queryGenerator;
    if (since != null) {
        // Prefer the since generator whenever we have a clock
        query.since = since;
        queryGenerator = 'since';
        // Filter on directories using an anyof expression
        if (directoryFilters.length > 0) {
            allOfTerms.push([
                'anyof',
                ...directoryFilters.map((dir) => ['dirname', dir]),
            ]);
        }
    }
    else if (directoryFilters.length > 0) {
        // Use the `glob` generator and filter only by extension.
        query.glob = directoryFilters.map((directory) => `${directory}/**`);
        query.glob_includedotfiles = true;
        queryGenerator = 'glob';
    }
    else if (!includeSymlinks) {
        // Use the `suffix` generator with no path/extension filtering, as long
        // as we don't need (suffixless) directory symlinks.
        query.suffix = extensions;
        queryGenerator = 'suffix';
    }
    else {
        // Fall back to `all` if we need symlinks and don't have a clock or
        // directory filters.
        queryGenerator = 'all';
    }
    // `includeSymlinks` implies we need (suffixless) directory links. In the
    // case of the `suffix` generator, a suffix expression would be redundant.
    if (!includeSymlinks && queryGenerator !== 'suffix') {
        allOfTerms.push(['suffix', extensions]);
    }
    // If we only have one "all of" expression we can use it directly, otherwise
    // wrap in ['allof', ...expressions]. By construction we should never have
    // length 0.
    query.expression = allOfTerms.length === 1 ? allOfTerms[0] : ['allof', ...allOfTerms];
    return { query, queryGenerator };
}
