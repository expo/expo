"use strict";
/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Remix Software Inc. 2020-2021
 * Copyright (c) Shopify Inc. 2022-2024
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Original license https://github.com/remix-run/remix/blob/6d6caaed5dfc436242962dcb2ff9617757a11e17/LICENSE.md
 * Code from https://github.com/remix-run/remix/blob/6d6caaed5dfc436242962dcb2ff9617757a11e17/packages/remix-node/stream.ts#L66
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReadableStreamFromReadable = void 0;
const node_stream_1 = require("node:stream");
const createReadableStreamFromReadable = (source) => {
    const pump = new StreamPump(source);
    const stream = new ReadableStream(pump, pump);
    return stream;
};
exports.createReadableStreamFromReadable = createReadableStreamFromReadable;
class StreamPump {
    highWaterMark;
    accumalatedSize;
    stream;
    controller;
    constructor(stream) {
        this.highWaterMark =
            stream.readableHighWaterMark || new node_stream_1.Stream.Readable().readableHighWaterMark;
        this.accumalatedSize = 0;
        this.stream = stream;
        this.enqueue = this.enqueue.bind(this);
        this.error = this.error.bind(this);
        this.close = this.close.bind(this);
    }
    size(chunk) {
        return chunk?.byteLength || 0;
    }
    start(controller) {
        this.controller = controller;
        this.stream.on('data', this.enqueue);
        this.stream.once('error', this.error);
        this.stream.once('end', this.close);
        this.stream.once('close', this.close);
    }
    pull() {
        this.resume();
    }
    cancel(reason) {
        if (this.stream.destroy) {
            this.stream.destroy(reason);
        }
        this.stream.off('data', this.enqueue);
        this.stream.off('error', this.error);
        this.stream.off('end', this.close);
        this.stream.off('close', this.close);
    }
    enqueue(chunk) {
        if (this.controller) {
            try {
                const bytes = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);
                const available = (this.controller.desiredSize || 0) - bytes.byteLength;
                this.controller.enqueue(bytes);
                if (available <= 0) {
                    this.pause();
                }
            }
            catch {
                this.controller.error(new Error('Could not create Buffer, chunk must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object'));
                this.cancel();
            }
        }
    }
    pause() {
        if (this.stream.pause) {
            this.stream.pause();
        }
    }
    resume() {
        if (this.stream.readable && this.stream.resume) {
            this.stream.resume();
        }
    }
    close() {
        if (this.controller) {
            this.controller.close();
            delete this.controller;
        }
    }
    error(error) {
        if (this.controller) {
            this.controller.error(error);
            delete this.controller;
        }
    }
}
//# sourceMappingURL=utils.js.map