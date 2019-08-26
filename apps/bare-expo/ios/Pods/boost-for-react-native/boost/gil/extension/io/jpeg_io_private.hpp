/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_JPEG_IO_PRIVATE_H
#define GIL_JPEG_IO_PRIVATE_H

/// \file
/// \brief  Internal support for reading and writing JPEG files
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated September 24, 2006

#include <stdio.h>
#include <boost/static_assert.hpp>
#include <vector>
#include "../../gil_all.hpp"
#include "io_error.hpp"
#include <jpeglib.h>

namespace boost { namespace gil {

namespace detail {

// lbourdev: What is the advantage of having channel and colorspace together? Are there cases where they are interrelated?

template <typename Channel,typename ColorSpace>
struct jpeg_read_support_private {
    BOOST_STATIC_CONSTANT(bool,is_supported=false);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_UNKNOWN);
};
template <>
struct jpeg_read_support_private<bits8,gray_t> {
    BOOST_STATIC_ASSERT(BITS_IN_JSAMPLE==8);
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_GRAYSCALE);
};
template <>
struct jpeg_read_support_private<bits8,rgb_t> {
    BOOST_STATIC_ASSERT(BITS_IN_JSAMPLE==8);
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_RGB);
};
template <>
struct jpeg_read_support_private<bits8,cmyk_t> {
    BOOST_STATIC_ASSERT(BITS_IN_JSAMPLE==8);
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_CMYK);
};
template <typename Channel,typename ColorSpace>
struct jpeg_write_support_private {
    BOOST_STATIC_CONSTANT(bool,is_supported=false);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_UNKNOWN);
};
template <>
struct jpeg_write_support_private<bits8,gray_t> {
    BOOST_STATIC_ASSERT(BITS_IN_JSAMPLE==8);
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_GRAYSCALE);
};
template <>
struct jpeg_write_support_private<bits8,rgb_t> {
    BOOST_STATIC_ASSERT(BITS_IN_JSAMPLE==8);
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_RGB);
};
template <>
struct jpeg_write_support_private<bits8,cmyk_t> {
    BOOST_STATIC_ASSERT(BITS_IN_JSAMPLE==8);
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(J_COLOR_SPACE,color_type=JCS_CMYK);
};


class jpeg_reader : public file_mgr {
protected:
    jpeg_decompress_struct  _cinfo;
    jpeg_error_mgr          _jerr;

    void init() {
        _cinfo.err=jpeg_std_error(&_jerr);
        jpeg_create_decompress(&_cinfo);
        jpeg_stdio_src(&_cinfo,_fp.get());
        jpeg_read_header(&_cinfo,TRUE);
    }
public:
    jpeg_reader(FILE* file)           : file_mgr(file)           { init(); }
    jpeg_reader(const char* filename) : file_mgr(filename, "rb") { init(); }

    ~jpeg_reader() { jpeg_destroy_decompress(&_cinfo); }

    template <typename View>
    void apply(const View& view) {
        jpeg_start_decompress(&_cinfo);    // lbourdev: Can this return an error? You need to check and throw. Check all other library methods that can return an error state...
        io_error_if(_cinfo.data_precision!=8,"jpeg_reader::apply(): this image file is not supported");
        io_error_if(_cinfo.out_color_space!=jpeg_read_support_private<typename channel_type<View>::type,
                                                                      typename color_space_type<View>::type>::color_type,
                    "jpeg_reader::apply(): input view type does not match the image file");
        io_error_if(view.dimensions() != get_dimensions(), "jpeg_reader::apply(): input view dimensions do not match the image file");
        std::vector<pixel<bits8,layout<typename color_space_type<View>::type> > > row(view.width());
        JSAMPLE* row_address=(JSAMPLE*)&row.front();
        for(int y=0;y<view.height();++y) {
            io_error_if(jpeg_read_scanlines(&_cinfo,(JSAMPARRAY)&row_address,1)!=1,
                        "jpeg_reader::apply(): fail to read JPEG file");
            std::copy(row.begin(),row.end(),view.row_begin(y));
        }
        jpeg_finish_decompress(&_cinfo);
    }
    
    template <typename Image>
    void read_image(Image& im) {
        im.recreate(get_dimensions());
        apply(view(im));
    }

    point2<std::ptrdiff_t> get_dimensions() const {
        return point2<std::ptrdiff_t>(_cinfo.image_width,_cinfo.image_height);
    }
};

// This code will be simplified...
template <typename CC>
class jpeg_reader_color_convert : public jpeg_reader {
private:
    CC _cc;
public:
    jpeg_reader_color_convert(FILE* file,CC cc_in)           : jpeg_reader(file),_cc(cc_in) {}
    jpeg_reader_color_convert(FILE* file)           : jpeg_reader(file) {}
    jpeg_reader_color_convert(const char* filename,CC cc_in) : jpeg_reader(filename),_cc(cc_in) {}
    jpeg_reader_color_convert(const char* filename) : jpeg_reader(filename) {}
    template <typename View>
    void apply(const View& view) {
        jpeg_start_decompress(&_cinfo);    // lbourdev: Can this return an error? You need to check and throw. Check all other library methods that can return an error state...
        io_error_if(_cinfo.data_precision!=8,"jpeg_reader_color_covert::apply(): this image file is not supported");
        io_error_if(view.dimensions() != get_dimensions(), "jpeg_reader_color_covert::apply(): input view dimensions don't match the image file");
        switch (_cinfo.out_color_space) {
        case JCS_GRAYSCALE: {
            std::vector<gray8_pixel_t> row(view.width());
            JSAMPLE* row_address=(JSAMPLE*)&row.front();
            for(int y=0;y<view.height();++y) {
                io_error_if(jpeg_read_scanlines(&_cinfo,(JSAMPARRAY)&row_address,1)!=1,
                            "jpeg_reader_color_covert::apply(): fail to read JPEG file");
                std::transform(row.begin(),row.end(),view.row_begin(y),color_convert_deref_fn<gray8_ref_t, typename View::value_type,CC>(_cc));
            }
            break;
        }
        case JCS_RGB: {
            std::vector<rgb8_pixel_t> row(view.width());
            JSAMPLE* row_address=(JSAMPLE*)&row.front();
            for(int y=0;y<view.height();++y) {
                io_error_if(jpeg_read_scanlines(&_cinfo,(JSAMPARRAY)&row_address,1)!=1,
                            "jpeg_reader_color_covert::apply(): fail to read JPEG file");
                std::transform(row.begin(),row.end(),view.row_begin(y),color_convert_deref_fn<rgb8_ref_t, typename View::value_type,CC>(_cc));
            }
            break;
        }
        case JCS_CMYK: {
            std::vector<cmyk8_pixel_t> row(view.width());
            JSAMPLE* row_address=(JSAMPLE*)&row.front();
            for(int y=0;y<view.height();++y) {
                io_error_if(jpeg_read_scanlines(&_cinfo,(JSAMPARRAY)&row_address,1)!=1,
                            "jpeg_reader_color_covert::apply(): fail to read JPEG file");
                std::transform(row.begin(),row.end(),view.row_begin(y),color_convert_deref_fn<cmyk8_ref_t, typename View::value_type,CC>(_cc));
            }
            break;
        }
        default:
            io_error("jpeg_reader_color_covert::apply(): unknown color type");
        }
        jpeg_finish_decompress(&_cinfo);
    }    
    template <typename Image>
    void read_image(Image& im) {
        im.recreate(get_dimensions());
        apply(view(im));
    }
};

class jpeg_writer : public file_mgr {
    jpeg_compress_struct _cinfo;
    jpeg_error_mgr _jerr;

    void init() {
        _cinfo.err=jpeg_std_error(&_jerr);
        jpeg_create_compress(&_cinfo);
        jpeg_stdio_dest(&_cinfo,_fp.get());
    }
public:
    jpeg_writer(FILE* file)           : file_mgr(file)           { init(); }
    jpeg_writer(const char* filename) : file_mgr(filename, "wb") { init(); }
    ~jpeg_writer() { jpeg_destroy_compress(&_cinfo); }
    
    template <typename View>
    void apply(const View& view,int quality=100) {
        _cinfo.image_width  = (JDIMENSION)view.width();
        _cinfo.image_height = (JDIMENSION)view.height();
        _cinfo.input_components=num_channels<View>::value;
        _cinfo.in_color_space = jpeg_write_support_private<typename channel_type<View>::type,
                                                           typename color_space_type<View>::type>::color_type;
        jpeg_set_defaults(&_cinfo);
        jpeg_set_quality(&_cinfo, quality, TRUE);
        jpeg_start_compress(&_cinfo, TRUE);
        std::vector<pixel<bits8,layout<typename color_space_type<View>::type> > > row(view.width());
        JSAMPLE* row_address=(JSAMPLE*)&row.front();
        for (int y=0;y<view.height(); ++y) {
            std::copy(view.row_begin(y),view.row_end(y),row.begin());
            io_error_if(jpeg_write_scanlines(&_cinfo,(JSAMPARRAY)&row_address,1) != 1,
                        "jpeg_writer::apply(): fail to write file");
        }
        jpeg_finish_compress(&_cinfo);
    }
};

} // namespace detail

} }  // namespace boost::gil

#endif
