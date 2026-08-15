/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  CanonicalPath,
  FileMetadata,
  FileSystemListener,
  ReadonlyFileSystemChanges,
} from '../types';

export class FileSystemChangeAggregator implements FileSystemListener {
  // Mutually exclusive with removedDirectories
  readonly #addedDirectories: Set<CanonicalPath> = new Set();
  // Mutually exclusive with addedDirectories
  readonly #removedDirectories: Set<CanonicalPath> = new Set();

  // Mutually exclusive with modified and removed files
  readonly #addedFiles: Map<CanonicalPath, FileMetadata> = new Map();
  // Mutually exclusive with added and removed files
  readonly #modifiedFiles: Map<CanonicalPath, FileMetadata> = new Map();
  // Mutually exclusive with added and modified files
  readonly #removedFiles: Map<CanonicalPath, FileMetadata> = new Map();

  // Removed files must be paired with the file's metadata the last time it was
  // observable by consumers - ie, immediately *before* this batch. To report
  // this accurately with minimal overhead, we'll note the current metadata of
  // a file the first time it is modified or removed within a batch. If it is
  // re-added, modified and removed again, we still have the initial metadata.
  // This is particularly important if, say, a regular file is replaced by a
  // symlink, or vice-versa.
  readonly #initialMetadata: Map<CanonicalPath, FileMetadata> = new Map();

  directoryAdded(canonicalPath: CanonicalPath): void {
    // Only add to newDirectories if this directory wasn't previously removed
    // (i.e., it's truly new). If it was removed and re-added, the net effect
    // is no directory change.
    if (!this.#removedDirectories.delete(canonicalPath)) {
      this.#addedDirectories.add(canonicalPath);
    }
  }

  directoryRemoved(canonicalPath: CanonicalPath): void {
    if (!this.#addedDirectories.delete(canonicalPath)) {
      this.#removedDirectories.add(canonicalPath);
    }
  }

  fileAdded(canonicalPath: CanonicalPath, data: FileMetadata): void {
    if (this.#removedFiles.delete(canonicalPath)) {
      // File was removed then re-added in the same batch - treat as modification
      this.#modifiedFiles.set(canonicalPath, data);
    } else {
      // New file
      this.#addedFiles.set(canonicalPath, data);
    }
  }

  fileModified(canonicalPath: CanonicalPath, oldData: FileMetadata, newData: FileMetadata): void {
    if (this.#addedFiles.has(canonicalPath)) {
      // File did not exist before this batch. Further modification only
      // updates metadata
      this.#addedFiles.set(canonicalPath, newData);
    } else {
      if (!this.#initialMetadata.has(canonicalPath)) {
        this.#initialMetadata.set(canonicalPath, oldData);
      }
      this.#modifiedFiles.set(canonicalPath, newData);
    }
  }

  fileRemoved(canonicalPath: CanonicalPath, data: FileMetadata): void {
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

  getSize(): number {
    return (
      this.#addedDirectories.size +
      this.#removedDirectories.size +
      this.#addedFiles.size +
      this.#modifiedFiles.size +
      this.#removedFiles.size
    );
  }

  getView(): ReadonlyFileSystemChanges<FileMetadata> {
    return {
      addedDirectories: this.#addedDirectories,
      removedDirectories: this.#removedDirectories,
      addedFiles: this.#addedFiles,
      modifiedFiles: this.#modifiedFiles,
      removedFiles: this.#removedFiles,
    };
  }

  getMappedView<T>(metadataMapFn: (metadata: FileMetadata) => T): ReadonlyFileSystemChanges<T> {
    return {
      addedDirectories: this.#addedDirectories,
      removedDirectories: this.#removedDirectories,
      addedFiles: mapIterable(this.#addedFiles, metadataMapFn),
      modifiedFiles: mapIterable(this.#modifiedFiles, metadataMapFn),
      removedFiles: mapIterable(this.#removedFiles, metadataMapFn),
    };
  }
}

function mapIterable<T>(
  map: Map<CanonicalPath, FileMetadata>,
  metadataMapFn: (metadata: FileMetadata) => T
): Iterable<Readonly<[CanonicalPath, T]>> {
  return {
    *[Symbol.iterator](): Iterator<Readonly<[CanonicalPath, T]>> {
      for (const [path, metadata] of map) {
        yield [path, metadataMapFn(metadata)];
      }
    },
  };
}
