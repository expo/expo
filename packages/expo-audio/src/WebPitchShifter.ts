/**
 * Copyright 2012, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * WebPitchShifter
 *
 * This is a pure Web Audio API Phase Vocoder pitch shifter adapted from Chris Wilson's `jungle.js`.
 * Original Source: https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js
 *
 *
 * HOW IT WORKS (AND WHY IT DOESN'T "CHITTER"):
 * Standard delay-line pitch shifters (and granular synthesis) often suffer from artifacts like "chitter" or flutter
 * when shifting pitch because they alter the frequency of their LFOs to stretch/compress the audio.
 * When LFO frequencies change dynamically, the overlap boundaries shift, creating phase discontinuities, clicks,
 * or massive chorus/echo effects when the crossfade windows fall out of sync with the delay wraps.
 *
 * The Jungle algorithm solves this by using a mathematically locked system:
 * 1. It establishes a CONSTANT 100ms LFO cross-fade window that NEVER speeds up or slows down.
 * 2. It uses an exact equal-power crossfade (Math.sqrt) that is forever phase-locked to this 100ms cycle.
 * 3. To change pitch, it alters the AMPLITUDE (the depth) of the delay modulation, rather than its frequency.
 *
 * Because the LFOs always cycle exactly every 100ms, the delay-time jump always occurs EXACTLY at the lowest
 * point of the crossfade (gain = 0), making the boundaries mathematically invisible and completely eliminating clicks.
 */
export class WebPitchShifter {
  private ctx: AudioContext;
  public input: GainNode;
  public output: GainNode;

  private delay1: DelayNode;
  private delay2: DelayNode;
  private fade1: GainNode;
  private fade2: GainNode;
  private modGain1: GainNode;
  private modGain2: GainNode;

  private modDown1: AudioBufferSourceNode;
  private modDown2: AudioBufferSourceNode;
  private modUp1: AudioBufferSourceNode;
  private modUp2: AudioBufferSourceNode;

  private modDown1Gain: GainNode;
  private modDown2Gain: GainNode;
  private modUp1Gain: GainNode;
  private modUp2Gain: GainNode;

  private fadeMod1: AudioBufferSourceNode;
  private fadeMod2: AudioBufferSourceNode;

  private windowTime = 0.1;
  private fadeTime = 0.05;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.delay1 = ctx.createDelay(1.0);
    this.delay2 = ctx.createDelay(1.0);
    this.delay1.delayTime.value = 0;
    this.delay2.delayTime.value = 0;

    this.fade1 = ctx.createGain();
    this.fade2 = ctx.createGain();
    this.fade1.gain.value = 0;
    this.fade2.gain.value = 0;

    this.modGain1 = ctx.createGain();
    this.modGain2 = ctx.createGain();
    this.modGain1.gain.value = 0;
    this.modGain2.gain.value = 0;

    this.modGain1.connect(this.delay1.delayTime);
    this.modGain2.connect(this.delay2.delayTime);

    this.input.connect(this.delay1);
    this.input.connect(this.delay2);
    this.delay1.connect(this.fade1);
    this.delay2.connect(this.fade2);
    this.fade1.connect(this.output);
    this.fade2.connect(this.output);

    this.modDown1 = ctx.createBufferSource();
    this.modDown2 = ctx.createBufferSource();
    this.modUp1 = ctx.createBufferSource();
    this.modUp2 = ctx.createBufferSource();

    const shiftDownBuffer = this.createDelayBuffer(false);
    const shiftUpBuffer = this.createDelayBuffer(true);
    this.modDown1.buffer = shiftDownBuffer;
    this.modDown2.buffer = shiftDownBuffer;
    this.modUp1.buffer = shiftUpBuffer;
    this.modUp2.buffer = shiftUpBuffer;

    this.modDown1.loop = true;
    this.modDown2.loop = true;
    this.modUp1.loop = true;
    this.modUp2.loop = true;

    this.modDown1Gain = ctx.createGain();
    this.modDown2Gain = ctx.createGain();
    this.modUp1Gain = ctx.createGain();
    this.modUp2Gain = ctx.createGain();

    this.modDown1Gain.gain.value = 0;
    this.modDown2Gain.gain.value = 0;
    this.modUp1Gain.gain.value = 0;
    this.modUp2Gain.gain.value = 0;

    this.modDown1.connect(this.modDown1Gain);
    this.modDown2.connect(this.modDown2Gain);
    this.modUp1.connect(this.modUp1Gain);
    this.modUp2.connect(this.modUp2Gain);

    this.modDown1Gain.connect(this.modGain1);
    this.modDown2Gain.connect(this.modGain2);
    this.modUp1Gain.connect(this.modGain1);
    this.modUp2Gain.connect(this.modGain2);

    this.fadeMod1 = ctx.createBufferSource();
    this.fadeMod2 = ctx.createBufferSource();
    const fadeBuffer = this.createFadeBuffer();
    this.fadeMod1.buffer = fadeBuffer;
    this.fadeMod2.buffer = fadeBuffer;
    this.fadeMod1.loop = true;
    this.fadeMod2.loop = true;

    this.fadeMod1.connect(this.fade1.gain);
    this.fadeMod2.connect(this.fade2.gain);

    const now = ctx.currentTime;
    this.modDown1.start(now);
    this.modUp1.start(now);
    this.fadeMod1.start(now);

    const halfWindow = this.windowTime / 2;
    this.modDown2.start(now + halfWindow);
    this.modUp2.start(now + halfWindow);
    this.fadeMod2.start(now + halfWindow);
  }

  private createDelayBuffer(shiftUp: boolean): AudioBuffer {
    const length = this.windowTime * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const p = buffer.getChannelData(0);
    for (let i = 0; i < length; ++i) {
      if (shiftUp) {
        p[i] = (length - i) / length;
      } else {
        p[i] = i / length;
      }
    }
    return buffer;
  }

  private createFadeBuffer(): AudioBuffer {
    const length = this.windowTime * this.ctx.sampleRate;
    const fadeSamples = this.fadeTime * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const p = buffer.getChannelData(0);

    for (let i = 0; i < length; ++i) {
      let value = 1.0;
      if (i < fadeSamples) {
        value = Math.sqrt(i / fadeSamples);
      } else if (i >= length - fadeSamples) {
        value = Math.sqrt(1 - (i - (length - fadeSamples)) / fadeSamples);
      }
      p[i] = value;
    }
    return buffer;
  }

  public setPitch(semitones: number) {
    if (Math.abs(semitones) < 0.01) {
      this.modGain1.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
      this.modGain2.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
      return;
    }

    const ratio = Math.pow(2, semitones / 12);
    let depth = (1 - ratio) * this.windowTime;
    const shiftUp = depth < 0;
    depth = Math.abs(depth);

    if (shiftUp) {
      this.modUp1Gain.gain.value = 1;
      this.modUp2Gain.gain.value = 1;
      this.modDown1Gain.gain.value = 0;
      this.modDown2Gain.gain.value = 0;
    } else {
      this.modUp1Gain.gain.value = 0;
      this.modUp2Gain.gain.value = 0;
      this.modDown1Gain.gain.value = 1;
      this.modDown2Gain.gain.value = 1;
    }

    this.modGain1.gain.setTargetAtTime(depth, this.ctx.currentTime, 0.01);
    this.modGain2.gain.setTargetAtTime(depth, this.ctx.currentTime, 0.01);
  }

  public disconnect() {
    this.modDown1.stop();
    this.modDown2.stop();
    this.modUp1.stop();
    this.modUp2.stop();
    this.fadeMod1.stop();
    this.fadeMod2.stop();
    this.input.disconnect();
    this.output.disconnect();
  }
}
