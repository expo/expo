/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_TIFF_IO_H
#define GIL_TIFF_IO_H

/// \file
/// \brief  Support for reading and writing TIFF files
///         Requires libtiff!
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated September 24, 2006

#include <vector>
#include <string>
#include <algorithm>
#include <boost/static_assert.hpp>
#include <tiffio.h>
#include "../../gil_all.hpp"
#include "io_error.hpp"

namespace boost { namespace gil {

namespace detail {

template <typename Channel,typename ColorSpace>
struct tiff_read_support_private {
    BOOST_STATIC_CONSTANT(bool,is_supported=false);
    BOOST_STATIC_CONSTANT(int,bit_depth=0);
    BOOST_STATIC_CONSTANT(int,color_type=0);
};
template <>
struct tiff_read_support_private<bits8,gray_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=8);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_MINISBLACK);
};
template <>
struct tiff_read_support_private<bits8,rgb_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=8);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_RGB);
};
template <>
struct tiff_read_support_private<bits16,gray_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=16);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_MINISBLACK);
};
template <>
struct tiff_read_support_private<bits16,rgb_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=16);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_RGB);
};
template <>
struct tiff_read_support_private<bits32f,gray_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=32);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_MINISBLACK);
};
template <>
struct tiff_read_support_private<bits32f,rgb_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=32);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_RGB);
};

template <typename Channel,typename ColorSpace>
struct tiff_write_support_private {
    BOOST_STATIC_CONSTANT(bool,is_supported=false);
    BOOST_STATIC_CONSTANT(int,bit_depth=0);
    BOOST_STATIC_CONSTANT(int,color_type=0);
};
template <>
struct tiff_write_support_private<bits8,gray_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=8);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_MINISBLACK);
};
template <>
struct tiff_write_support_private<bits8,rgb_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=8);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_RGB);
};
template <>
struct tiff_write_support_private<bits16,gray_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=16);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_MINISBLACK);
};
template <>
struct tiff_write_support_private<bits16,rgb_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=16);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_RGB);
};
template <>
struct tiff_write_support_private<bits32f,gray_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=32);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_MINISBLACK);
};
template <>
struct tiff_write_support_private<bits32f,rgb_t> {
    BOOST_STATIC_CONSTANT(bool,is_supported=true);
    BOOST_STATIC_CONSTANT(int,bit_depth=32);
    BOOST_STATIC_CONSTANT(int,color_type=PHOTOMETRIC_RGB);
};

class tiff_reader {
protected:
    TIFF *_tp;
public:
    tiff_reader(const char* filename,tdir_t dirnum=0) {
        io_error_if((_tp=TIFFOpen(filename,"r"))==NULL,
                    "tiff_reader: fail to open file");
        if(dirnum>0) {
            io_error_if(TIFFSetDirectory(_tp,dirnum)!=1,
                        "tiff_reader: fail to set directory");
        }
    }
    ~tiff_reader() { TIFFClose(_tp); }
    template <typename View>
    void apply(const View& view) {
        unsigned short bps,photometric;
        point2<std::ptrdiff_t> dims=get_dimensions();
        io_error_if(TIFFGetField(_tp,TIFFTAG_BITSPERSAMPLE,&bps)!=1);
        io_error_if(TIFFGetField(_tp,TIFFTAG_PHOTOMETRIC,&photometric)!=1);
        io_error_if(dims!=view.dimensions(),
                    "tiff_read_view: input view size does not match TIFF file size");
        io_error_if(tiff_read_support_private<typename channel_type<View>::type,
                                              typename color_space_type<View>::type>::bit_depth!=bps ||
                    tiff_read_support_private<typename channel_type<View>::type,
                                              typename color_space_type<View>::type>::color_type!=photometric,
                    "tiff_read_view: input view type is incompatible with the image type");
        std::size_t element_size=sizeof(pixel<typename channel_type<View>::type,
                                              layout<typename color_space_type<View>::type> >);
        std::size_t size_to_allocate = (std::max)((std::size_t)view.width(),
                                                 (std::size_t)(TIFFScanlineSize(_tp)+element_size-1)/element_size);
        std::vector<pixel<typename channel_type<View>::type,
                          layout<typename color_space_type<View>::type> > > row(size_to_allocate);
        for (int y=0;y<view.height();++y) {
            io_error_if(TIFFReadScanline(_tp,&row.front(), y)!=1);
            std::copy(row.begin(),row.begin()+view.width(),view.row_begin(y));
        }
    }
    point2<std::ptrdiff_t> get_dimensions() {
        int w,h;
        io_error_if(TIFFGetField(_tp,TIFFTAG_IMAGEWIDTH, &w)!=1);
        io_error_if(TIFFGetField(_tp,TIFFTAG_IMAGELENGTH,&h)!=1);
        return point2<std::ptrdiff_t>(w,h);
    }

    template <typename Image>
    void read_image(Image& im) {
        im.recreate(get_dimensions());
        apply(view(im));
    }
};

// This code will be simplified...
template <typename CC>  
class tiff_reader_color_convert : public tiff_reader {
private:
    CC _cc;
public:
    tiff_reader_color_convert(const char* filename,tdir_t dirnum=0) :
        tiff_reader(filename,dirnum) {}
    tiff_reader_color_convert(const char* filename,CC cc_in,tdir_t dirnum=0) :
        tiff_reader(filename,dirnum),_cc(cc_in) {}
    template <typename View>
    void apply(const View& view) {
        point2<std::ptrdiff_t> dims=get_dimensions();
        unsigned short bps,photometric;
        io_error_if(TIFFGetField(_tp,TIFFTAG_BITSPERSAMPLE,&bps)!=1);
        io_error_if(TIFFGetField(_tp,TIFFTAG_PHOTOMETRIC,&photometric)!=1);
        io_error_if(dims!=view.dimensions(),
                    "tiff_reader_color_convert::apply(): input view size does not match TIFF file size");
        switch (photometric) {
        case PHOTOMETRIC_MINISBLACK: {
            switch (bps) {
            case 8: {
                std::size_t element_size=sizeof(gray8_pixel_t);
                std::size_t size_to_allocate = (std::max)((std::size_t)view.width(),
                                                          (std::size_t)(TIFFScanlineSize(_tp)+element_size-1)/element_size);
                std::vector<gray8_pixel_t> row(size_to_allocate);
                for (int y=0;y<view.height();++y) {
                    io_error_if(TIFFReadScanline(_tp,&row.front(), y)!=1);
                    std::transform(row.begin(),row.begin()+view.width(),view.row_begin(y),
                                   color_convert_deref_fn<gray8_ref_t,typename View::value_type,CC>(_cc));
                }
                break;
            }
            case 16: {
                std::size_t element_size=sizeof(gray16_pixel_t);
                std::size_t size_to_allocate = (std::max)((std::size_t)view.width(),
                                                          (std::size_t)(TIFFScanlineSize(_tp)+element_size-1)/element_size);
                std::vector<gray16_pixel_t> row(size_to_allocate);
                for (int y=0;y<view.height();++y) {
                    io_error_if(TIFFReadScanline(_tp,&row.front(), y)!=1);
                    std::transform(row.begin(),row.begin()+view.width(),view.row_begin(y),
                                   color_convert_deref_fn<gray16_ref_t,typename View::value_type,CC>(_cc));
                }
                break;
            }
            case 32: {
                std::size_t element_size=sizeof(gray32f_pixel_t);
                std::size_t size_to_allocate = (std::max)((std::size_t)view.width(),
                                                          (std::size_t)(TIFFScanlineSize(_tp)+element_size-1)/element_size);
                std::vector<gray32f_pixel_t> row(size_to_allocate);
                for (int y=0;y<view.height();++y) {
                    io_error_if(TIFFReadScanline(_tp,&row.front(), y)!=1);
                    std::transform(row.begin(),row.begin()+view.width(),view.row_begin(y),
                                   color_convert_deref_fn<gray32f_ref_t,typename View::value_type,CC>(_cc));
                }
                break;
            }
            default:
                io_error("tiff_reader_color_convert::apply(): unknown combination of color type and bit depth");
            }
            break;
        }
        case PHOTOMETRIC_RGB: {
            switch (bps) {
            case 8: {
                std::size_t element_size=sizeof(rgb8_pixel_t);
                std::size_t size_to_allocate = (std::max)((std::size_t)view.width(),
                                                          (std::size_t)(TIFFScanlineSize(_tp)+element_size-1)/element_size);
                std::vector<rgb8_pixel_t> row(size_to_allocate);
                for (int y=0;y<view.height();++y) {
                    io_error_if(TIFFReadScanline(_tp,&row.front(), y)!=1);
                    std::transform(row.begin(),row.begin()+view.width(),view.row_begin(y),
                                   color_convert_deref_fn<rgb8_ref_t,typename View::value_type,CC>(_cc));
                }
                break;
            }
            case 16: {
                std::size_t element_size=sizeof(rgb16_pixel_t);
                std::size_t size_to_allocate = (std::max)((std::size_t)view.width(),
                                                          (std::size_t)(TIFFScanlineSize(_tp)+element_size-1)/element_size);
                std::vector<rgb16_pixel_t> row(size_to_allocate);
                for (int y=0;y<view.height();++y) {
                    io_error_if(TIFFReadScanline(_tp,&row.front(), y)!=1);
                    std::transform(row.begin(),row.begin()+view.width(),view.row_begin(y),
                                   color_convert_deref_fn<rgb16_ref_t,typename View::value_type,CC>(_cc));
                }
                break;
            }
            case 32: {
                std::size_t element_size=sizeof(rgb32f_pixel_t);
                std::size_t size_to_allocate = (std::max)((std::size_t)view.width(),
                                                          (std::size_t)(TIFFScanlineSize(_tp)+element_size-1)/element_size);
                std::vector<rgb32f_pixel_t> row(size_to_allocate);
                for (int y=0;y<view.height();++y) {
                    io_error_if(TIFFReadScanline(_tp,&row.front(), y)!=1);
                    std::transform(row.begin(),row.begin()+view.width(),view.row_begin(y),
                                   color_convert_deref_fn<rgb32f_ref_t,typename View::value_type,CC>(_cc));
                }
                break;
            }
            default:
                io_error("tiff_reader_color_convert::apply(): unknown combination of color type and bit depth");
            }
            break;
        }
        default: {
            // reads an image in incompatible format via TIFFReadRGBAImage
            rgba8_image_t rgbaImg(dims);
            io_error_if(!TIFFReadRGBAImage(_tp, dims.x, dims.y, (uint32*)&gil::view(rgbaImg)(0,0), 0), 
                "tiff_reader_color_convert::unsupported image format");
            copy_and_convert_pixels(flipped_up_down_view(const_view(rgbaImg)), view, _cc);
        }
        }
    }
    template <typename Image>
    void read_image(Image& im) {
        im.recreate(get_dimensions());
        apply(view(im));
    }
};

class tiff_writer {
protected:
    TIFF* _tp;
public:
    tiff_writer(const char *filename) {
        io_error_if((_tp=TIFFOpen(filename,"w"))==NULL,
                    "tiff_writer: fail to open file");
    }
    ~tiff_writer() {TIFFClose(_tp);}
    template <typename View>
    void apply(const View& view) {
        io_error_if(TIFFSetField(_tp,TIFFTAG_IMAGELENGTH, view.height())!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_IMAGEWIDTH, view.width())!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_PHOTOMETRIC, tiff_write_support_private<typename channel_type<View>::type,
                                                                     typename color_space_type<View>::type>::color_type)!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_RESOLUTIONUNIT, RESUNIT_NONE)!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_PLANARCONFIG, PLANARCONFIG_CONTIG)!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_ORIENTATION, ORIENTATION_TOPLEFT)!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_SAMPLESPERPIXEL,num_channels<View>::value)!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_BITSPERSAMPLE, tiff_write_support_private<typename channel_type<View>::type,
                                                                     typename color_space_type<View>::type>::bit_depth)!=1);
        io_error_if(TIFFSetField(_tp,TIFFTAG_ROWSPERSTRIP, TIFFDefaultStripSize(_tp, 0))!=1);
        std::vector<pixel<typename channel_type<View>::type,
                          layout<typename color_space_type<View>::type> > > row(view.width());
        for (int y=0;y<view.height();++y) {
            std::copy(view.row_begin(y),view.row_end(y),row.begin());
            io_error_if(TIFFWriteScanline(_tp,&row.front(),y,0)!=1,
                        "tiff_write_view: fail to write file");
        }
    }
};

} // namespace detail

/// \ingroup TIFF_IO
/// \brief Determines whether the given view type is supported for reading
template <typename View>
struct tiff_read_support {
    BOOST_STATIC_CONSTANT(bool,is_supported=
                          (detail::tiff_read_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::is_supported));
    BOOST_STATIC_CONSTANT(int,bit_depth=
                          (detail::tiff_read_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::bit_depth));
    BOOST_STATIC_CONSTANT(int,color_type=
                          (detail::tiff_read_support_private<typename channel_type<View>::type,
                                                             typename color_space_type<View>::type>::color_type));
};

/// \ingroup TIFF_IO
/// \brief Returns the number of directories in the TIFF file
inline int tiff_get_directory_count(const char* filename) {
    TIFF *tif;
    io_error_if((tif=TIFFOpen(filename,"r"))==NULL,
                    "tiff_get_count: fail to open file");

    int dircount = 0;
    do {
        dircount++;
    } while (TIFFReadDirectory(tif));

    TIFFClose(tif);
    return dircount;
}

/// \ingroup TIFF_IO
/// \brief Returns the width and height of the TIFF file at the specified location.
/// Throws std::ios_base::failure if the location does not correspond to a valid TIFF file
inline point2<std::ptrdiff_t> tiff_read_dimensions(const char* filename,tdir_t dirnum=0) {
    detail::tiff_reader m(filename,dirnum);
    return m.get_dimensions();
}

/// \ingroup TIFF_IO
/// \brief Returns the width and height of the TIFF file at the specified location.
/// Throws std::ios_base::failure if the location does not correspond to a valid TIFF file
inline point2<std::ptrdiff_t> tiff_read_dimensions(const std::string& filename,tdir_t dirnum=0) {
    return tiff_read_dimensions(filename.c_str(),dirnum);
}

/// \ingroup TIFF_IO
/// \brief Loads the image specified by the given tiff image file name into the given view.
/// Triggers a compile assert if the view color space and channel depth are not supported by the TIFF library or by the I/O extension.
/// Throws std::ios_base::failure if the file is not a valid TIFF file, or if its color space or channel depth are not 
/// compatible with the ones specified by View, or if its dimensions don't match the ones of the view.
template <typename View>
inline void tiff_read_view(const char* filename,const View& view,tdir_t dirnum=0) {
    BOOST_STATIC_ASSERT(tiff_read_support<View>::is_supported);
    detail::tiff_reader m(filename,dirnum);
    m.apply(view);
}

/// \ingroup TIFF_IO
/// \brief Loads the image specified by the given tiff image file name into the given view.
template <typename View>
inline void tiff_read_view(const std::string& filename,const View& view,tdir_t dirnum=0) {
    tiff_read_view(filename.c_str(),view,dirnum);
}

/// \ingroup TIFF_IO
/// \brief Allocates a new image whose dimensions are determined by the given tiff image file, and loads the pixels into it.
/// Triggers a compile assert if the image color space or channel depth are not supported by the TIFF library or by the I/O extension.
/// Throws std::ios_base::failure if the file is not a valid TIFF file, or if its color space or channel depth are not 
/// compatible with the ones specified by Image
template <typename Image>
void tiff_read_image(const char* filename,Image& im,tdir_t dirnum=0) {
    BOOST_STATIC_ASSERT(tiff_read_support<typename Image::view_t>::is_supported);
    detail::tiff_reader m(filename,dirnum);
    m.read_image(im);
}

/// \ingroup TIFF_IO
/// \brief Allocates a new image whose dimensions are determined by the given tiff image file, and loads the pixels into it.
template <typename Image>
inline void tiff_read_image(const std::string& filename,Image& im,tdir_t dirnum=0) {
    tiff_read_image(filename.c_str(),im,dirnum);
}

/// \ingroup TIFF_IO
/// \brief Loads and color-converts the image specified by the given tiff image file name into the given view.
/// Throws std::ios_base::failure if the file is not a valid TIFF file, or if its dimensions don't match the ones of the view.
template <typename View,typename CC>
inline void tiff_read_and_convert_view(const char* filename,const View& view,CC cc,tdir_t dirnum=0) {
    detail::tiff_reader_color_convert<CC> m(filename,cc,dirnum);
    m.apply(view);
}

/// \ingroup TIFF_IO
/// \brief Loads and color-converts the image specified by the given tiff image file name into the given view.
/// Throws std::ios_base::failure if the file is not a valid TIFF file, or if its dimensions don't match the ones of the view.
template <typename View>
inline void tiff_read_and_convert_view(const char* filename,const View& view,tdir_t dirnum=0) {
    detail::tiff_reader_color_convert<default_color_converter> m(filename,default_color_converter(),dirnum);
    m.apply(view);
}

/// \ingroup TIFF_IO
/// \brief Loads and color-converts the image specified by the given tiff image file name into the given view.
template <typename View,typename CC>
inline void tiff_read_and_convert_view(const std::string& filename,const View& view,CC cc,tdir_t dirnum=0) {
    tiff_read_and_convert_view(filename.c_str(),view,cc,dirnum);
}

/// \ingroup TIFF_IO
/// \brief Loads and color-converts the image specified by the given tiff image file name into the given view.
template <typename View>
inline void tiff_read_and_convert_view(const std::string& filename,const View& view,tdir_t dirnum=0) {
    tiff_read_and_convert_view(filename.c_str(),view,dirnum);
}

/// \ingroup TIFF_IO
/// \brief Allocates a new image whose dimensions are determined by the given tiff image file, loads and color-converts the pixels into it.
/// Throws std::ios_base::failure if the file is not a valid TIFF file
template <typename Image,typename CC>
void tiff_read_and_convert_image(const char* filename,Image& im,CC cc,tdir_t dirnum=0) {
    detail::tiff_reader_color_convert<CC> m(filename,cc,dirnum);
    m.read_image(im);
}

/// \ingroup TIFF_IO
/// \brief Allocates a new image whose dimensions are determined by the given tiff image file, loads and color-converts the pixels into it.
/// Throws std::ios_base::failure if the file is not a valid TIFF file
template <typename Image>
void tiff_read_and_convert_image(const char* filename,Image& im,tdir_t dirnum=0) {
    detail::tiff_reader_color_convert<default_color_converter> m(filename,default_color_converter(),dirnum);
    m.read_image(im);
}

/// \ingroup TIFF_IO
/// \brief Allocates a new image whose dimensions are determined by the given tiff image file, loads and color-converts the pixels into it.
template <typename Image,typename CC>
inline void tiff_read_and_convert_image(const std::string& filename,Image& im,CC cc,tdir_t dirnum=0) {
    tiff_read_and_convert_image(filename.c_str(),im,cc,dirnum);
}

/// \ingroup TIFF_IO
/// \brief Allocates a new image whose dimensions are determined by the given tiff image file, loads and color-converts the pixels into it.
template <typename Image>
inline void tiff_read_and_convert_image(const std::string& filename,Image& im,tdir_t dirnum=0) {
    tiff_read_and_convert_image(filename.c_str(),im,dirnum);
}

/// \ingroup TIFF_IO
/// \brief Determines whether the given view type is supported for writing
template <typename View>
struct tiff_write_support {
    BOOST_STATIC_CONSTANT(bool,is_supported=
                          (detail::tiff_write_support_private<typename channel_type<View>::type,
                                                              typename color_space_type<View>::type>::is_supported));
    BOOST_STATIC_CONSTANT(int,bit_depth=
                          (detail::tiff_write_support_private<typename channel_type<View>::type,
                                                              typename color_space_type<View>::type>::bit_depth));
    BOOST_STATIC_CONSTANT(int,color_type=
                          (detail::tiff_write_support_private<typename channel_type<View>::type,
                                                              typename color_space_type<View>::type>::color_type));
    BOOST_STATIC_CONSTANT(bool, value=is_supported);
};

/// \ingroup TIFF_IO
/// \brief Saves the view to a tiff file specified by the given tiff image file name.
/// Triggers a compile assert if the view color space and channel depth are not supported by the TIFF library or by the I/O extension.
/// Throws std::ios_base::failure if it fails to create the file.
template <typename View>
inline void tiff_write_view(const char* filename,const View& view) {
    BOOST_STATIC_ASSERT(tiff_write_support<View>::is_supported);
    detail::tiff_writer m(filename);
    m.apply(view);
}

/// \ingroup TIFF_IO
/// \brief Saves the view to a tiff file specified by the given tiff image file name.
template <typename View>
inline void tiff_write_view(const std::string& filename,const View& view) {
    tiff_write_view(filename.c_str(),view);
}

} }  // namespace boost::gil

#endif
