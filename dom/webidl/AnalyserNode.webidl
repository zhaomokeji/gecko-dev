/* -*- Mode: IDL; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * The origin of this IDL file is
 * https://webaudio.github.io/web-audio-api/
 *
 * Copyright © 2012 W3C® (MIT, ERCIM, Keio), All Rights Reserved. W3C
 * liability, trademark and document use rules apply.
 */

dictionary AnalyserOptions : AudioNodeOptions {
             unsigned long fftSize = 2048;
             float         maxDecibels = -30;
             float         minDecibels = -100;
             float         smoothingTimeConstant = 0.8;
};

[Pref="dom.webaudio.enabled",
 Constructor(AudioContext context, optional AnalyserOptions options)]
interface AnalyserNode : AudioNode {

    // Real-time frequency-domain data
    void getFloatFrequencyData(Float32Array array);
    void getByteFrequencyData(Uint8Array array);

    // Real-time waveform data
    void getFloatTimeDomainData(Float32Array array);
    void getByteTimeDomainData(Uint8Array array);

    [SetterThrows, Pure]
    attribute unsigned long fftSize;
    [Pure]
    readonly attribute unsigned long frequencyBinCount;

    [SetterThrows, Pure]
    attribute double minDecibels;
    [SetterThrows, Pure]
    attribute double maxDecibels;

    [SetterThrows, Pure]
    attribute double smoothingTimeConstant;

};

// Mozilla extension
AnalyserNode implements AudioNodePassThrough;
