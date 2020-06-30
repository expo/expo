/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_JPEG_IO_H
#define GIL_JPEG_IO_H

/// \file
/// \brief  Support for reading and writing JPEG files
///         Requires libjpeg
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated September 24, 2006

#include <cstdio>
#include <algorithm>
#include <string>
#include <boost/static_assert.hpp>
#include <boost/shared_ptr.hpp>
extern "C" {
#include <jpeglib.h>
}
#include "io_error.hpp"
#include "jpeg_io_private.hpp"

namespace boost { namespace gil {

/// \ingroup JPEG_IO
/// \brief Determines whether the given view type is supported for reading
template <typename View>
struct jpeg_read_support {
    BOOST_STATIC_CONSTANT(bool,is_supported=
                          (detail::jpeg_read_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::is_supported));
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=
                          (detail::jpeg_read_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::color_type));
    BOOST_STATIC_CONSTANT(bool, value=is_supported);
};

/// \ingroup JPEG_IO
/// \brief Returns the width and height of the JPEG file at the specified location.
/// Throws std::ios_base::failure if the location does not correspond to a valid JPEG file
inline point2<std::ptrdiff_t> jpeg_read_dimensions(const char* filename) {
    detail::jpeg_reader m(filename);
    return m.get_dimensions();
}

/// \ingroup JPEG_IO
/// \brief Returns the width and height of the JPEG file at the specified location.
/// Throws std::ios_base::failure if the location does not correspond to a valid JPEG file
inline point2<std::ptrdiff_t> jpeg_read_dimensions(const std::string& filename) {
    return jpeg_read_dimensions(filename.c_str());
}

/// \ingroup JPEG_IO
/// \brief Loads the image specified by the given jpeg image file name into the given view.
/// Triggers a compile assert if the view color space and channel depth are not supported by the JPEG library or by the I/O extension.
/// Throws std::ios_base::failure if the file is not a valid JPEG file, or if its color space or channel depth are not 
/// compatible with the ones specified by View, or if its dimensions don't match the ones of the view.
template <typename View>
inline void jpeg_read_view(const char* filename,const View& view) {
    BOOST_STATIC_ASSERT(jpeg_read_support<View>::is_supported);

    detail::jpeg_reader m(filename);
    m.apply(view);
}

/// \ingroup JPEG_IO
/// \brief Loads the image specified by the given jpeg image file name into the given view.
template <typename View>
inline void jpeg_read_view(const std::string& filename,const View& view) {
    jpeg_read_view(filename.c_str(),view);
}

/// \ingroup JPEG_IO
/// \brief Allocates a new image whose dimensions are determined by the given jpeg image file, and loads the pixels into it.
/// Triggers a compile assert if the image color space or channel depth are not supported by the JPEG library or by the I/O extension.
/// Throws std::ios_base::failure if the file is not a valid JPEG file, or if its color space or channel depth are not 
/// compatible with the ones specified by Image
template <typename Image>
inline void jpeg_read_image(const char* filename,Image& im) {
    BOOST_STATIC_ASSERT(jpeg_read_support<typename Image::view_t>::is_supported);

    detail::jpeg_reader m(filename);
    m.read_image(im);
}

/// \ingroup JPEG_IO
/// \brief Allocates a new image whose dimensions are determined by the given jpeg image file, and loads the pixels into it.
template <typename Image>
inline void jpeg_read_image(const std::string& filename,Image& im) {
    jpeg_read_image(filename.c_str(),im);
}

/// \ingroup JPEG_IO
/// \brief Loads and color-converts the image specified by the given jpeg image file name into the given view.
/// Throws std::ios_base::failure if the file is not a valid JPEG file, or if its dimensions don't match the ones of the view.
template <typename View,typename CC>
inline void jpeg_read_and_convert_view(const char* filename,const View& view,CC cc) {
    detail::jpeg_reader_color_convert<CC> m(filename,cc);
    m.apply(view);
}

/// \ingroup JPEG_IO
/// \brief Loads and color-converts the image specified by the given jpeg image file name into the given view.
/// Throws std::ios_base::failure if the file is not a valid JPEG file, or if its dimensions don't match the ones of the view.
template <typename View>
inline void jpeg_read_and_convert_view(const char* filename,const View& view) {
    detail::jpeg_reader_color_convert<default_color_converter> m(filename,default_color_converter());
    m.apply(view);
}

/// \ingroup JPEG_IO
/// \brief Loads and color-converts the image specified by the given jpeg image file name into the given view.
template <typename View,typename CC>
inline void jpeg_read_and_convert_view(const std::string& filename,const View& view,CC cc) {
    jpeg_read_and_convert_view(filename.c_str(),view);
}

/// \ingroup JPEG_IO
/// \brief Loads and color-converts the image specified by the given jpeg image file name into the given view.
template <typename View>
inline void jpeg_read_and_convert_view(const std::string& filename,const View& view) {
    jpeg_read_and_convert_view(filename.c_str(),view);
}

/// \ingroup JPEG_IO
/// \brief Allocates a new image whose dimensions are determined by the given jpeg image file, loads and color-converts the pixels into it.
/// Throws std::ios_base::failure if the file is not a valid JPEG file
template <typename Image,typename CC>
inline void jpeg_read_and_convert_image(const char* filename,Image& im,CC cc) {
    detail::jpeg_reader_color_convert<CC> m(filename,cc);
    m.read_image(im);
}

/// \ingroup JPEG_IO
/// \brief Allocates a new image whose dimensions are determined by the given jpeg image file, loads and color-converts the pixels into it.
/// Throws std::ios_base::failure if the file is not a valid JPEG file
template <typename Image>
inline void jpeg_read_and_convert_image(const char* filename,Image& im) {
    detail::jpeg_reader_color_convert<default_color_converter> m(filename,default_color_converter());
    m.read_image(im);
}

/// \ingroup JPEG_IO
/// \brief Allocates a new image whose dimensions are determined by the given jpeg image file, loads and color-converts the pixels into it.
template <typename Image,typename CC>
inline void jpeg_read_and_convert_image(const std::string& filename,Image& im,CC cc) {
    jpeg_read_and_convert_image(filename.c_str(),im);
}

/// \ingroup JPEG_IO
/// \brief Allocates a new image whose dimensions are determined by the given jpeg image file, loads and color-converts the pixels into it.
template <typename Image>
inline void jpeg_read_and_convert_image(const std::string& filename,Image& im) {
    jpeg_read_and_convert_image(filename.c_str(),im);
}

/// \ingroup JPEG_IO
/// \brief Determines whether the given view type is supported for writing
template <typename View>
struct jpeg_write_support {
    BOOST_STATIC_CONSTANT(bool,is_supported=
                          (detail::jpeg_write_support_private<typename channel_type<View>::type,
                                                              typename color_space_type<View>::type>::is_supported));
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=
                          (detail::jpeg_write_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::color_type));
    BOOST_STATIC_CONSTANT(bool, value=is_supported);
};

/// \ingroup JPEG_IO
/// \brief Saves the view to a jpeg file specified by the given jpeg image file name.
/// Triggers a compile assert if the view color space and channel depth are not supported by the JPEG library or by the I/O extension.
/// Throws std::ios_base::failure if it fails to create the file.
template <typename View>
inline void jpeg_write_view(const char* filename,const View& view,int quality=100) {
    BOOST_STATIC_ASSERT(jpeg_write_support<View>::is_supported);

    detail::jpeg_writer m(filename);
    m.apply(view,quality);
}

/// \ingroup JPEG_IO
/// \brief Saves the view to a jpeg file specified by the given jpeg image file name.
template <typename View>
inline void jpeg_write_view(const std::string& filename,const View& view,int quality=100) {
    jpeg_write_view(filename.c_str(),view,quality);
}

} }  // namespace boost::gil

#endif
