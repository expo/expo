/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_TIFF_DYNAMIC_IO_H
#define GIL_TIFF_DYNAMIC_IO_H

/// \file
/// \brief  Support for reading and writing TIFF files
///         Requires libtiff!
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated June 10, 2006
//
// We are currently providing the following functions:
// template <typename Images> void tiff_read_image(const char*,any_image<Images>)
// template <typename Views> void tiff_write_view(const char*,any_image_view<Views>)
//

#include <string>
#include <boost/mpl/bool.hpp>
#include "../dynamic_image/dynamic_image_all.hpp"
#include "io_error.hpp"
#include "tiff_io.hpp"
#include "dynamic_io.hpp"

namespace boost { namespace gil {

namespace detail {

struct tiff_write_is_supported {
    template<typename View> struct apply
        : public mpl::bool_<tiff_write_support<View>::is_supported> {};
};

class tiff_writer_dynamic : public tiff_writer {
public:
    typedef void result_type;
    tiff_writer_dynamic(const char* filename) : tiff_writer(filename) {}

    template <typename Views>
    void write_view(const any_image_view<Views>& runtime_view) {
        dynamic_io_fnobj<tiff_write_is_supported, tiff_writer> op(this);
        apply_operation(runtime_view,op);
    }
};

class tiff_type_format_checker {
    int _bit_depth;
    int _color_type;
public:
    tiff_type_format_checker(int bit_depth_in,int color_type_in) :
        _bit_depth(bit_depth_in),_color_type(color_type_in) {}
    template <typename Image>
    bool apply() {
        return tiff_read_support<typename Image::view_t>::bit_depth==_bit_depth &&
               tiff_read_support<typename Image::view_t>::color_type==_color_type;
    }
};

struct tiff_read_is_supported {
    template<typename View> struct apply
        : public mpl::bool_<tiff_read_support<View>::is_supported> {};
};

class tiff_reader_dynamic : public tiff_reader {
public:
    tiff_reader_dynamic(const char* filename) : tiff_reader(filename) {}

    template <typename Images>
    void read_image(any_image<Images>& im) {
        int width,height;
        unsigned short bps,photometric;
        TIFFGetField(_tp,TIFFTAG_IMAGEWIDTH,&width);
        TIFFGetField(_tp,TIFFTAG_IMAGELENGTH,&height);
        TIFFGetField(_tp,TIFFTAG_BITSPERSAMPLE,&bps);
        TIFFGetField(_tp,TIFFTAG_PHOTOMETRIC,&photometric);
        if (!construct_matched(im,tiff_type_format_checker(bps,photometric))) {
            io_error("tiff_reader_dynamic::read_image(): no matching image type between those of the given any_image and that of the file");
        } else {
            im.recreate(width,height);
            dynamic_io_fnobj<tiff_read_is_supported, tiff_reader> op(this);
            apply_operation(view(im),op);
        }
    }
};

} // namespace detail

/// \ingroup TIFF_IO
/// \brief reads a TIFF image into a run-time instantiated image
/// Opens the given tiff file name, selects the first type in Images whose color space and channel are compatible to those of the image file
/// and creates a new image of that type with the dimensions specified by the image file.
/// Throws std::ios_base::failure if none of the types in Images are compatible with the type on disk.
template <typename Images>
inline void tiff_read_image(const char* filename,any_image<Images>& im) {
    detail::tiff_reader_dynamic m(filename);
    m.read_image(im);
}

/// \ingroup TIFF_IO
/// \brief reads a TIFF image into a run-time instantiated image
template <typename Images>
inline void tiff_read_image(const std::string& filename,any_image<Images>& im) {
    tiff_read_image(filename.c_str(),im);
}

/// \ingroup TIFF_IO
/// \brief Saves the currently instantiated view to a tiff file specified by the given tiff image file name.
/// Throws std::ios_base::failure if the currently instantiated view type is not supported for writing by the I/O extension 
/// or if it fails to create the file.
template <typename Views>
inline void tiff_write_view(const char* filename,const any_image_view<Views>& runtime_view) {
    detail::tiff_writer_dynamic m(filename);
    m.write_view(runtime_view);
}

/// \ingroup TIFF_IO
/// \brief Saves the currently instantiated view to a tiff file specified by the given tiff image file name.
template <typename Views>
inline void tiff_write_view(const std::string& filename,const any_image_view<Views>& runtime_view) {
    tiff_write_view(filename.c_str(),runtime_view);
}

} }  // namespace boost::gil

#endif
