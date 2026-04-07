"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemChangeAggregator = void 0;
class FileSystemChangeAggregator {
    // Mutually exclusive with removedDirectories
    #addedDirectories = new Set();
    // Mutually exclusive with addedDirectories
    #removedDirectories = new Set();
    // Mutually exclusive with modified and removed files
    #addedFiles = new Map();
    // Mutually exclusive with added and removed files
    #modifiedFiles = new Map();
    // Mutually exclusive with added and modified files
    #removedFiles = new Map();
    // Removed files must be paired with the file's metadata the last time it was
    // observable by consumers - ie, immediately *before* this batch. To report
    // this accurately with minimal overhead, we'll note the current metadata of
    // a file the first time it is modified or removed within a batch. If it is
    // re-added, modified and removed again, we still have the initial metadata.
    // This is particularly important if, say, a regular file is replaced by a
    // symlink, or vice-versa.
    #initialMetadata = new Map();
    directoryAdded(canonicalPath) {
        // Only add to newDirectories if this directory wasn't previously removed
        // (i.e., it's truly new). If it was removed and re-added, the net effect
        // is no directory change.
        if (!this.#removedDirectories.delete(canonicalPath)) {
            this.#addedDirectories.add(canonicalPath);
        }
    }
    directoryRemoved(canonicalPath) {
        if (!this.#addedDirectories.delete(canonicalPath)) {
            this.#removedDirectories.add(canonicalPath);
        }
    }
    fileAdded(canonicalPath, data) {
        if (this.#removedFiles.delete(canonicalPath)) {
            // File was removed then re-added in the same batch - treat as modification
            this.#modifiedFiles.set(canonicalPath, data);
        }
        else {
            // New file
            this.#addedFiles.set(canonicalPath, data);
        }
    }
    fileModified(canonicalPath, oldData, newData) {
        if (this.#addedFiles.has(canonicalPath)) {
            // File did not exist before this batch. Further modification only
            // updates metadata
            this.#addedFiles.set(canonicalPath, newData);
        }
        else {
            if (!this.#initialMetadata.has(canonicalPath)) {
                this.#initialMetadata.set(canonicalPath, oldData);
            }
            this.#modifiedFiles.set(canonicalPath, newData);
        }
    }
    fileRemoved(canonicalPath, data) {
        // Check if this file was added in the same batch
        if (!this.#addedFiles.delete(canonicalPath)) {
            let initialData = this.#initialMetadata.get(canonicalPath);
            if (!initialData) {
                initialData = data;
                this.#initialMetadata.set(canonicalPath, initialData);
            }
            // File was not added in this batch, so add to removed with last metadata
            this.#modifiedFiles.delete(canonicalPath);
            this.#removedFiles.set(canonicalPath, initialData);
        }
        // else: File was added then removed in the same batch - no net change
    }
    getSize() {
        return (this.#addedDirectories.size +
            this.#removedDirectories.size +
            this.#addedFiles.size +
            this.#modifiedFiles.size +
            this.#removedFiles.size);
    }
    getView() {
        return {
            addedDirectories: this.#addedDirectories,
            removedDirectories: this.#removedDirectories,
            addedFiles: this.#addedFiles,
            modifiedFiles: this.#modifiedFiles,
            removedFiles: this.#removedFiles,
        };
    }
    getMappedView(metadataMapFn) {
        return {
            addedDirectories: this.#addedDirectories,
            removedDirectories: this.#removedDirectories,
            addedFiles: mapIterable(this.#addedFiles, metadataMapFn),
            modifiedFiles: mapIterable(this.#modifiedFiles, metadataMapFn),
            removedFiles: mapIterable(this.#removedFiles, metadataMapFn),
        };
    }
}
exports.FileSystemChangeAggregator = FileSystemChangeAggregator;
function mapIterable(map, metadataMapFn) {
    return {
        *[Symbol.iterator]() {
            for (const [path, metadata] of map) {
                yield [path, metadataMapFn(metadata)];
            }
        },
    };
}
