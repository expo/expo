/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_JPEG_DYNAMIC_IO_H
#define GIL_JPEG_DYNAMIC_IO_H

/// \file
/// \brief  Support for reading and writing JPEG files
///         Requires libjpeg
///
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated June 10, 2006

#include <stdio.h>
#include <string>
#include <boost/mpl/bool.hpp>
#include <boost/shared_ptr.hpp>
#include "../dynamic_image/dynamic_image_all.hpp"
#include "io_error.hpp"

#include "jpeg_io.hpp"
#include "jpeg_io_private.hpp"
#include "dynamic_io.hpp"

namespace boost { namespace gil {

namespace detail {

struct jpeg_write_is_supported {
    template<typename View> struct apply
        : public mpl::bool_<jpeg_write_support<View>::is_supported> {};
};

class jpeg_writer_dynamic : public jpeg_writer {
    int _quality;
public:    
    jpeg_writer_dynamic(FILE* file,           int quality=100) : jpeg_writer(file)    , _quality(quality) {}
    jpeg_writer_dynamic(const char* filename, int quality=100) : jpeg_writer(filename), _quality(quality) {}

    template <typename Views>
    void write_view(const any_image_view<Views>& runtime_view) {
        dynamic_io_fnobj<jpeg_write_is_supported, jpeg_writer> op(this);
        apply_operation(runtime_view,op);
    }
};

class jpeg_type_format_checker {
    J_COLOR_SPACE _color_type;
public:
    jpeg_type_format_checker(J_COLOR_SPACE color_type_in) :
        _color_type(color_type_in) {}
    template <typename Image>
    bool apply() {
        return jpeg_read_support<typename Image::view_t>::color_type==_color_type;
    }
};

struct jpeg_read_is_supported {
    template<typename View> struct apply
        : public mpl::bool_<jpeg_read_support<View>::is_supported> {};
};

class jpeg_reader_dynamic : public jpeg_reader {
public:
    jpeg_reader_dynamic(FILE* file)           : jpeg_reader(file)    {}
    jpeg_reader_dynamic(const char* filename) : jpeg_reader(filename){}
        
    template <typename Images>
    void read_image(any_image<Images>& im) {
        if (!construct_matched(im,detail::jpeg_type_format_checker(_cinfo.out_color_space))) {
            io_error("jpeg_reader_dynamic::read_image(): no matching image type between those of the given any_image and that of the file");
        } else {
            im.recreate(get_dimensions());
            dynamic_io_fnobj<jpeg_read_is_supported, jpeg_reader> op(this);
            apply_operation(view(im),op);
        }
    }
};

} // namespace detail


/// \ingroup JPEG_IO
/// \brief reads a JPEG image into a run-time instantiated image
/// Opens the given JPEG file name, selects the first type in Images whose color space and channel are compatible to those of the image file
/// and creates a new image of that type with the dimensions specified by the image file.
/// Throws std::ios_base::failure if none of the types in Images are compatible with the type on disk.
template <typename Images>
inline void jpeg_read_image(const char* filename,any_image<Images>& im) {
    detail::jpeg_reader_dynamic m(filename);
    m.read_image(im);
}

/// \ingroup JPEG_IO
/// \brief reads a JPEG image into a run-time instantiated image
template <typename Images>
inline void jpeg_read_image(const std::string& filename,any_image<Images>& im) {
    jpeg_read_image(filename.c_str(),im);
}

/// \ingroup JPEG_IO
/// \brief Saves the currently instantiated view to a jpeg file specified by the given jpeg image file name.
/// Throws std::ios_base::failure if the currently instantiated view type is not supported for writing by the I/O extension 
/// or if it fails to create the file.
template <typename Views>
inline void jpeg_write_view(const char* filename,const any_image_view<Views>& runtime_view) {
    detail::jpeg_writer_dynamic m(filename);
    m.write_view(runtime_view);
}

/// \ingroup JPEG_IO
/// \brief Saves the currently instantiated view to a jpeg file specified by the given jpeg image file name.
template <typename Views>
inline void jpeg_write_view(const std::string& filename,const any_image_view<Views>& runtime_view) {
    jpeg_write_view(filename.c_str(),runtime_view);
}

} }  // namespace boost::gil

#endif
