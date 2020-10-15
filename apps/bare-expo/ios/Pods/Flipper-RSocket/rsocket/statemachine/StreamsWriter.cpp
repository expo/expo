// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "rsocket/statemachine/StreamsWriter.h"

#include "rsocket/RSocketStats.h"
#include "rsocket/framing/FrameSerializer.h"

namespace rsocket {

void StreamsWriterImpl::outputFrameOrEnqueue(
    std::unique_ptr<folly::IOBuf> frame) {
  if (shouldQueue()) {
    enqueuePendingOutputFrame(std::move(frame));
  } else {
    outputFrame(std::move(frame));
  }
}

void StreamsWriterImpl::sendPendingFrames() {
  // We are free to try to send frames again.  Not all frames might be sent if
  // the connection breaks, the rest of them will queue up again.
  auto frames = consumePendingOutputFrames();
  for (auto& frame : frames) {
    outputFrameOrEnqueue(std::move(frame));
  }
}

void StreamsWriterImpl::enqueuePendingOutputFrame(
    std::unique_ptr<folly::IOBuf> frame) {
  auto const length = frame->computeChainDataLength();
  stats().streamBufferChanged(1, static_cast<int64_t>(length));
  pendingSize_ += length;
  pendingOutputFrames_.push_back(std::move(frame));
}

std::deque<std::unique_ptr<folly::IOBuf>>
StreamsWriterImpl::consumePendingOutputFrames() {
  if (auto const numFrames = pendingOutputFrames_.size()) {
    stats().streamBufferChanged(
        -static_cast<int64_t>(numFrames), -static_cast<int64_t>(pendingSize_));
    pendingSize_ = 0;
  }
  return std::move(pendingOutputFrames_);
}

void StreamsWriterImpl::writeNewStream(
    StreamId streamId,
    StreamType streamType,
    uint32_t initialRequestN,
    Payload payload) {
  // for simplicity, require that sent buffers don't consist of chains
  writeFragmented(
      [&](Payload p, FrameFlags flags) {
        switch (streamType) {
          case StreamType::CHANNEL:
            outputFrameOrEnqueue(
                serializer().serializeOut(Frame_REQUEST_CHANNEL(
                    streamId, flags, initialRequestN, std::move(p))));
            break;
          case StreamType::STREAM:
            outputFrameOrEnqueue(serializer().serializeOut(Frame_REQUEST_STREAM(
                streamId, flags, initialRequestN, std::move(p))));
            break;
          case StreamType::REQUEST_RESPONSE:
            outputFrameOrEnqueue(serializer().serializeOut(
                Frame_REQUEST_RESPONSE(streamId, flags, std::move(p))));
            break;
          case StreamType::FNF:
            outputFrameOrEnqueue(serializer().serializeOut(
                Frame_REQUEST_FNF(streamId, flags, std::move(p))));
            break;
          default:
            CHECK(false) << "invalid stream type " << toString(streamType);
        }
      },
      streamId,
      FrameFlags::EMPTY_,
      std::move(payload));
}

void StreamsWriterImpl::writeRequestN(Frame_REQUEST_N&& frame) {
  outputFrameOrEnqueue(serializer().serializeOut(std::move(frame)));
}

void StreamsWriterImpl::writeCancel(Frame_CANCEL&& frame) {
  outputFrameOrEnqueue(serializer().serializeOut(std::move(frame)));
}

void StreamsWriterImpl::writePayload(Frame_PAYLOAD&& f) {
  Frame_PAYLOAD frame = std::move(f);
  auto const streamId = frame.header_.streamId;
  auto const initialFlags = frame.header_.flags;

  writeFragmented(
      [this, streamId](Payload p, FrameFlags flags) {
        outputFrameOrEnqueue(serializer().serializeOut(
            Frame_PAYLOAD(streamId, flags, std::move(p))));
      },
      streamId,
      initialFlags,
      std::move(frame.payload_));
}

void StreamsWriterImpl::writeError(Frame_ERROR&& frame) {
  // TODO: implement fragmentation for writeError as well
  outputFrameOrEnqueue(serializer().serializeOut(std::move(frame)));
}

// The max amount of user data transmitted per frame - eg the size
// of the data and metadata combined, plus the size of the frame header.
// This assumes that the frame header will never be more than 512 bytes in
// size. A CHECK in FrameTransportImpl enforces this. The idea is that
// 16M is so much larger than the ~500 bytes possibly wasted that it won't
// be noticeable (0.003% wasted at most)
constexpr size_t GENEROUS_MAX_FRAME_SIZE = 0xFFFFFF - 512;

// writeFragmented takes a `payload` and splits it up into chunks which
// are sent as fragmented requests. The first fragmented payload is
// given to writeInitialFrame, which is expected to write the initial
// "REQUEST_" or "PAYLOAD" frame of a stream or response. writeFragmented
// then writes the rest of the frames as payloads.
//
// writeInitialFrame
//  - called with the payload of the first frame to send, and any additional
//    flags (eg, addFlags with FOLLOWS, if there are more frames to write)
// streamId
//  - The stream ID to write additional fragments with
// addFlags
//  - All flags that writeInitialFrame wants to write the first frame with,
//    and all flags that subsequent fragmented payloads will be sent with
// payload
//  - The unsplit payload to send, possibly in multiple fragments
template <typename WriteInitialFrame>
void StreamsWriterImpl::writeFragmented(
    WriteInitialFrame writeInitialFrame,
    StreamId const streamId,
    FrameFlags const addFlags,
    Payload payload) {
  folly::IOBufQueue metaQueue{folly::IOBufQueue::cacheChainLength()};
  folly::IOBufQueue dataQueue{folly::IOBufQueue::cacheChainLength()};

  // have to keep track of "did the full payload even have a metadata", because
  // the rsocket protocol makes a distinction between a zero-length metadata
  // and a null metadata.
  bool const haveNonNullMeta = !!payload.metadata;
  metaQueue.append(std::move(payload.metadata));
  dataQueue.append(std::move(payload.data));

  bool isFirstFrame = true;

  while (true) {
    Payload sendme;

    // chew off some metadata (splitAtMost will never return a null pointer,
    // safe to compute length on it always)
    if (haveNonNullMeta) {
      sendme.metadata = metaQueue.splitAtMost(GENEROUS_MAX_FRAME_SIZE);
      DCHECK_GE(
          GENEROUS_MAX_FRAME_SIZE, sendme.metadata->computeChainDataLength());
    }
    sendme.data = dataQueue.splitAtMost(
        GENEROUS_MAX_FRAME_SIZE -
        (haveNonNullMeta ? sendme.metadata->computeChainDataLength() : 0));

    auto const metaLeft = metaQueue.chainLength();
    auto const dataLeft = dataQueue.chainLength();
    auto const moreFragments = metaLeft || dataLeft;
    auto const flags =
        (moreFragments ? FrameFlags::FOLLOWS : FrameFlags::EMPTY_) | addFlags;

    if (isFirstFrame) {
      isFirstFrame = false;
      writeInitialFrame(std::move(sendme), flags);
    } else {
      outputFrameOrEnqueue(serializer().serializeOut(
          Frame_PAYLOAD(streamId, flags, std::move(sendme))));
    }

    if (!moreFragments) {
      break;
    }
  }
}

} // namespace rsocket
