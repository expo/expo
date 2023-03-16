"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReadableStreamFromReadable = exports.readableStreamToString = exports.writeAsyncIterableToWritable = exports.writeReadableStreamToWritable = void 0;
const stream_1 = require("stream");
async function writeReadableStreamToWritable(stream, writable) {
    let reader = stream.getReader();
    async function read() {
        let { done, value } = await reader.read();
        if (done) {
            writable.end();
            return;
        }
        writable.write(value);
        // If the stream is flushable, flush it to allow streaming to continue.
        let flushable = writable;
        if (typeof flushable.flush === 'function') {
            flushable.flush();
        }
        await read();
    }
    try {
        await read();
    }
    catch (error) {
        writable.destroy(error);
        throw error;
    }
}
exports.writeReadableStreamToWritable = writeReadableStreamToWritable;
async function writeAsyncIterableToWritable(iterable, writable) {
    try {
        for await (let chunk of iterable) {
            writable.write(chunk);
        }
        writable.end();
    }
    catch (error) {
        writable.destroy(error);
        throw error;
    }
}
exports.writeAsyncIterableToWritable = writeAsyncIterableToWritable;
async function readableStreamToString(stream, encoding) {
    let reader = stream.getReader();
    let chunks = [];
    async function read() {
        let { done, value } = await reader.read();
        if (done) {
            return;
        }
        else if (value) {
            chunks.push(value);
        }
        await read();
    }
    await read();
    return Buffer.concat(chunks).toString(encoding);
}
exports.readableStreamToString = readableStreamToString;
const createReadableStreamFromReadable = (source) => {
    let pump = new StreamPump(source);
    let stream = new ReadableStream(pump, pump);
    return stream;
};
exports.createReadableStreamFromReadable = createReadableStreamFromReadable;
class StreamPump {
    constructor(stream) {
        this.highWaterMark =
            stream.readableHighWaterMark || new stream_1.Stream.Readable().readableHighWaterMark;
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
                let bytes = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);
                let available = (this.controller.desiredSize || 0) - bytes.byteLength;
                this.controller.enqueue(bytes);
                if (available <= 0) {
                    this.pause();
                }
            }
            catch (error) {
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
