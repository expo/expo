// meter-processor.js
class MeterProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Accumulators for RMS calculation
        this._sum = 0;
        this._count = 0;
    }
    process(inputs /*, outputs, parameters */) {
        const input = inputs[0];
        if (input && input[0]) {
            const channel = input[0];
            // Accumulate square‐sum and sample count
            for (let i = 0; i < channel.length; i++) {
                const s = channel[i];
                this._sum += s * s;
                this._count++;
            }
            // Every 128 samples, compute and post an RMS value
            if (this._count >= 128) {
                const rms = Math.sqrt(this._sum / this._count);
                this.port.postMessage(rms);
                this._sum = 0;
                this._count = 0;
            }
        }
        return true; // keep the processor alive
    }
}
registerProcessor('meter-processor', MeterProcessor);
export {};
//# sourceMappingURL=meter-processor.js.map