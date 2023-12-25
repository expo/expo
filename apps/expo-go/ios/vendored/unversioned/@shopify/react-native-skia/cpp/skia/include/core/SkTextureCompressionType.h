/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkTextureCompressionType_DEFINED
#define SkTextureCompressionType_DEFINED
/*
 *   Skia                | GL_COMPRESSED_*     | MTLPixelFormat*      | VK_FORMAT_*_BLOCK
 *  --------------------------------------------------------------------------------------
 *   kETC2_RGB8_UNORM    | ETC1_RGB8           | ETC2_RGB8 (iOS-only) | ETC2_R8G8B8_UNORM
 *                       | RGB8_ETC2           |                      |
 *  --------------------------------------------------------------------------------------
 *   kBC1_RGB8_UNORM     | RGB_S3TC_DXT1_EXT   | N/A                  | BC1_RGB_UNORM
 *  --------------------------------------------------------------------------------------
 *   kBC1_RGBA8_UNORM    | RGBA_S3TC_DXT1_EXT  | BC1_RGBA (macOS-only)| BC1_RGBA_UNORM
 */
enum class SkTextureCompressionType {
    kNone,
    kETC2_RGB8_UNORM,

    kBC1_RGB8_UNORM,
    kBC1_RGBA8_UNORM,
    kLast = kBC1_RGBA8_UNORM,
    kETC1_RGB8 = kETC2_RGB8_UNORM,
};

#endif
