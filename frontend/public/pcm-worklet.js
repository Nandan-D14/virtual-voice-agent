/**
 * AudioWorkletProcessor that captures mic input as 16-bit PCM.
 *
 * This file is served as a static asset from /public and loaded via
 * audioContext.audioWorklet.addModule('/pcm-worklet.js')
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(0);
    // Send ~100ms chunks at 16kHz = 1600 samples = 3200 bytes
    this._chunkSize = 1600;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // Float32Array, one channel

    // Append to buffer
    const newBuffer = new Float32Array(this._buffer.length + samples.length);
    newBuffer.set(this._buffer, 0);
    newBuffer.set(samples, this._buffer.length);
    this._buffer = newBuffer;

    // When we have enough, send a chunk
    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.slice(0, this._chunkSize);
      this._buffer = this._buffer.slice(this._chunkSize);

      // Convert float32 (-1..1) to int16 (-32768..32767)
      const int16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.port.postMessage(int16.buffer, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
