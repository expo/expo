/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_PNG_DYNAMIC_IO_H
#define GIL_PNG_DYNAMIC_IO_H

/// \file
/// \brief  Support for reading and writing PNG files
///         Requires libpng and zlib!
///
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated June 10, 2006
//
// We are currently providing the following functions:
// template <typename Images> void png_read_image(const char*,any_image<Images>&)
// template <typename Images> void png_read_image(FILE*,any_image<Images>&,std::size_t)
// template <typename Views> void png_write_view(const char*,const any_image_view<View>&)
// template <typename Views> void png_write_view(FILE*,const any_image_view<View>&)


#include <string>
#include <stdio.h>
#include <boost/mpl/bool.hpp>
#include <boost/shared_ptr.hpp>
#include "../dynamic_image/dynamic_image_all.hpp"
#include "io_error.hpp"
#include "png_io.hpp"
#include "png_io_private.hpp"
#include "dynamic_io.hpp"

namespace boost { namespace gil {

namespace detail {

struct png_write_is_supported {
    template<typename View> struct apply
        : public mpl::bool_<png_write_support<View>::is_supported> {};
};

class png_writer_dynamic : public png_writer {
public:
    png_writer_dynamic(FILE* file          ) : png_writer(file)    {}
    png_writer_dynamic(const char* filename) : png_writer(filename){}

    template <typename Views>
    void write_view(const any_image_view<Views>& runtime_view) {
        dynamic_io_fnobj<png_write_is_supported, png_writer> op(this);
        apply_operation(runtime_view,op);
    }
};

class png_type_format_checker {
    int _bit_depth;
    int _color_type;
public:
    png_type_format_checker(int bit_depth_in,int color_type_in) :
        _bit_depth(bit_depth_in),_color_type(color_type_in) {}
    template <typename Image>
    bool apply() {
        return png_read_support<typename Image::view_t>::bit_depth==_bit_depth &&
            png_read_support<typename Image::view_t>::color_type==_color_type;
    }
};

struct png_read_is_supported {
    template<typename View> struct apply
        : public mpl::bool_<png_read_support<View>::is_supported> {};
};

class png_reader_dynamic : public png_reader {
public:
    png_reader_dynamic(FILE* file)           : png_reader(file)    {}
    png_reader_dynamic(const char* filename) : png_reader(filename){}
    
    template <typename Images>
    void read_image(any_image<Images>& im) {
        png_uint_32 width, height;
        int bit_depth, color_type, interlace_type;
        png_get_IHDR(_png_ptr, _info_ptr,
                     &width, &height,&bit_depth,&color_type,&interlace_type,
                     NULL, NULL);
        if (!construct_matched(im,png_type_format_checker(bit_depth,color_type))) {
            io_error("png_reader_dynamic::read_image(): no matching image type between those of the given any_image and that of the file");
        } else {
            im.recreate(width,height);
            dynamic_io_fnobj<png_read_is_supported, png_reader> op(this);
            apply_operation(view(im),op);
        }
    }
};

} // namespace detail 

/// \ingroup PNG_IO
/// \brief reads a PNG image into a run-time instantiated image
/// Opens the given png file name, selects the first type in Images whose color space and channel are compatible to those of the image file
/// and creates a new image of that type with the dimensions specified by the image file.
/// Throws std::ios_base::failure if none of the types in Images are compatible with the type on disk.
template <typename Images>
inline void png_read_image(const char* filename,any_image<Images>& im) {
    detail::png_reader_dynamic m(filename);
    m.read_image(im);
}

/// \ingroup PNG_IO
/// \brief reads a PNG image into a run-time instantiated image
template <typename Images>
inline void png_read_image(const std::string& filename,any_image<Images>& im) {
    png_read_image(filename.c_str(),im);
}

/// \ingroup PNG_IO
/// \brief Saves the currently instantiated view to a png file specified by the given png image file name.
/// Throws std::ios_base::failure if the currently instantiated view type is not supported for writing by the I/O extension 
/// or if it fails to create the file.
template <typename Views>
inline void png_write_view(const char* filename,const any_image_view<Views>& runtime_view) {
    detail::png_writer_dynamic m(filename);
    m.write_view(runtime_view);
}

/// \ingroup PNG_IO
/// \brief Saves the currently instantiated view to a png file specified by the given png image file name.
template <typename Views>
inline void png_write_view(const std::string& filename,const any_image_view<Views>& runtime_view) {
    png_write_view(filename.c_str(),runtime_view);
}

} }  // namespace boost::gil

#endif
