/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_PNG_IO_H
#define GIL_PNG_IO_H

/// \file
/// \brief  Support for reading and writing PNG files
///         Requires libpng and zlib!
//
// We are currently providing the following functions:
// point2<std::ptrdiff_t>    png_read_dimensions(const char*)
// template <typename View>  void png_read_view(const char*,const View&)
// template <typename View>  void png_read_image(const char*,image<View>&)
// template <typename View>  void png_write_view(const char*,const View&)
// template <typename View>  struct png_read_support;
// template <typename View>  struct png_write_support;
//
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated September 24, 2006

#include <stdio.h>
#include <string>
extern "C" {
#include "png.h"
}
#include <boost/static_assert.hpp>
#include "../../gil_config.hpp"
#include "../../utilities.hpp"
#include "io_error.hpp"
#include "png_io_private.hpp"

namespace boost { namespace gil {

/// \ingroup PNG_IO
/// \brief Returns the width and height of the PNG file at the specified location.
/// Throws std::ios_base::failure if the location does not correspond to a valid PNG file
inline point2<std::ptrdiff_t> png_read_dimensions(const char *filename) {
    detail::png_reader m(filename);
    return m.get_dimensions();
}

/// \ingroup PNG_IO
/// \brief Returns the width and height of the PNG file at the specified location.
/// Throws std::ios_base::failure if the location does not correspond to a valid PNG file
inline point2<std::ptrdiff_t> png_read_dimensions(const std::string& filename) {
    return png_read_dimensions(filename.c_str());
}

/// \ingroup PNG_IO
/// \brief Determines whether the given view type is supported for reading
template <typename View>
struct png_read_support {
    BOOST_STATIC_CONSTANT(bool,is_supported=
                          (detail::png_read_support_private<typename channel_type<View>::type,
                                                            typename color_space_type<View>::type>::is_supported));
    BOOST_STATIC_CONSTANT(int,bit_depth=
                          (detail::png_read_support_private<typename channel_type<View>::type,
                                                            typename color_space_type<View>::type>::bit_depth));
    BOOST_STATIC_CONSTANT(int,color_type=
                          (detail::png_read_support_private<typename channel_type<View>::type,
                                                            typename color_space_type<View>::type>::color_type));
    BOOST_STATIC_CONSTANT(bool, value=is_supported);
};

/// \ingroup PNG_IO
/// \brief Loads the image specified by the given png image file name into the given view.
/// Triggers a compile assert if the view color space and channel depth are not supported by the PNG library or by the I/O extension.
/// Throws std::ios_base::failure if the file is not a valid PNG file, or if its color space or channel depth are not 
/// compatible with the ones specified by View, or if its dimensions don't match the ones of the view.
template <typename View>
inline void png_read_view(const char* filename,const View& view) {
    BOOST_STATIC_ASSERT(png_read_support<View>::is_supported);
    detail::png_reader m(filename);
    m.apply(view);
}

/// \ingroup PNG_IO
/// \brief Loads the image specified by the given png image file name into the given view.
template <typename View>
inline void png_read_view(const std::string& filename,const View& view) {
    png_read_view(filename.c_str(),view);
}

/// \ingroup PNG_IO
/// \brief Allocates a new image whose dimensions are determined by the given png image file, and loads the pixels into it.
/// Triggers a compile assert if the image color space or channel depth are not supported by the PNG library or by the I/O extension.
/// Throws std::ios_base::failure if the file is not a valid PNG file, or if its color space or channel depth are not 
/// compatible with the ones specified by Image
template <typename Image>
inline void png_read_image(const char* filename,Image& im) {
    BOOST_STATIC_ASSERT(png_read_support<typename Image::view_t>::is_supported);
    detail::png_reader m(filename);
    m.read_image(im);
}

/// \ingroup PNG_IO
/// \brief Allocates a new image whose dimensions are determined by the given png image file, and loads the pixels into it.
template <typename Image>
inline void png_read_image(const std::string& filename,Image& im) {
    png_read_image(filename.c_str(),im);
}

/// \ingroup PNG_IO
/// \brief Loads the image specified by the given png image file name and color-converts it into the given view.
/// Throws std::ios_base::failure if the file is not a valid PNG file, or if its dimensions don't match the ones of the view.
template <typename View,typename CC>
inline void png_read_and_convert_view(const char* filename,const View& view,CC cc) {
    detail::png_reader_color_convert<CC> m(filename,cc);
    m.apply(view);
}

/// \ingroup PNG_IO
/// \brief Loads the image specified by the given png image file name and color-converts it into the given view.
/// Throws std::ios_base::failure if the file is not a valid PNG file, or if its dimensions don't match the ones of the view.
template <typename View>
inline void png_read_and_convert_view(const char* filename,const View& view) {
    detail::png_reader_color_convert<default_color_converter> m(filename,default_color_converter());
    m.apply(view);
}

/// \ingroup PNG_IO
/// \brief Loads the image specified by the given png image file name and color-converts it into the given view.
template <typename View,typename CC>
inline void png_read_and_convert_view(const std::string& filename,const View& view,CC cc) {
    png_read_and_convert_view(filename.c_str(),view,cc);
}

/// \ingroup PNG_IO
/// \brief Loads the image specified by the given png image file name and color-converts it into the given view.
template <typename View>
inline void png_read_and_convert_view(const std::string& filename,const View& view) {
    png_read_and_convert_view(filename.c_str(),view);
}

/// \ingroup PNG_IO
/// \brief Allocates a new image whose dimensions are determined by the given png image file, loads and color-converts the pixels into it.
/// Throws std::ios_base::failure if the file is not a valid PNG file
template <typename Image,typename CC>
inline void png_read_and_convert_image(const char* filename,Image& im,CC cc) {
    detail::png_reader_color_convert<CC> m(filename,cc);
    m.read_image(im);
}

/// \ingroup PNG_IO
/// \brief Allocates a new image whose dimensions are determined by the given png image file, loads and color-converts the pixels into it.
/// Throws std::ios_base::failure if the file is not a valid PNG file
template <typename Image>
inline void png_read_and_convert_image(const char* filename,Image& im) {
    detail::png_reader_color_convert<default_color_converter> m(filename,default_color_converter());
    m.read_image(im);
}

/// \ingroup PNG_IO
/// \brief Allocates a new image whose dimensions are determined by the given png image file, loads and color-converts the pixels into it.
template <typename Image,typename CC>
inline void png_read_and_convert_image(const std::string& filename,Image& im,CC cc) {
    png_read_and_convert_image(filename.c_str(),im,cc);
}

/// \ingroup PNG_IO
/// \brief Allocates a new image whose dimensions are determined by the given png image file, loads and color-converts the pixels into it.
template <typename Image>
inline void png_read_and_convert_image(const std::string& filename,Image& im) {
    png_read_and_convert_image(filename.c_str(),im);
}

/// \ingroup PNG_IO
/// \brief Determines whether the given view type is supported for writing
template <typename View>
struct png_write_support {
    BOOST_STATIC_CONSTANT(bool,is_supported=
                          (detail::png_write_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::is_supported));
    BOOST_STATIC_CONSTANT(int,bit_depth=
                          (detail::png_write_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::bit_depth));
    BOOST_STATIC_CONSTANT(int,color_type=
                          (detail::png_write_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::color_type));
    BOOST_STATIC_CONSTANT(bool, value=is_supported);
};

/// \ingroup PNG_IO
/// \brief Saves the view to a png file specified by the given png image file name.
/// Triggers a compile assert if the view color space and channel depth are not supported by the PNG library or by the I/O extension.
/// Throws std::ios_base::failure if it fails to create the file.
template <typename View>
inline void png_write_view(const char* filename,const View& view) {
    BOOST_STATIC_ASSERT(png_write_support<View>::is_supported);
    detail::png_writer m(filename);
    m.apply(view);
}

/// \ingroup PNG_IO
/// \brief Saves the view to a png file specified by the given png image file name.
template <typename View>
inline void png_write_view(const std::string& filename,const View& view) {
    png_write_view(filename.c_str(),view);
}

} }  // namespace boost::gil

#endif
