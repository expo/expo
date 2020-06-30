/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_COLOR_CONVERT_HPP
#define GIL_COLOR_CONVERT_HPP

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief GIL default color space conversions
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on January 30, 2007
///
/// Support for fast and simple color conversion. Accurate color conversion using color
/// profiles can be supplied separately in a dedicated module
///
////////////////////////////////////////////////////////////////////////////////////////

#include <functional>
#include "gil_config.hpp"
#include "channel_algorithm.hpp"
#include "pixel.hpp"
#include "gray.hpp"
#include "rgb.hpp"
#include "rgba.hpp"
#include "cmyk.hpp"
#include "metafunctions.hpp"
#include "utilities.hpp"
#include "color_base_algorithm.hpp"

namespace boost { namespace gil {

// Forward-declare
template <typename P> struct channel_type;

////////////////////////////////////////////////////////////////////////////////////////
///                 
///                 COLOR SPACE CONVERSION
///
////////////////////////////////////////////////////////////////////////////////////////

/// \ingroup ColorConvert 
/// \brief Color Convertion function object. To be specialized for every src/dst color space
template <typename C1, typename C2>
struct default_color_converter_impl {};

/// \ingroup ColorConvert
/// \brief When the color space is the same, color convertion performs channel depth conversion
template <typename C>
struct default_color_converter_impl<C,C> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        static_for_each(src,dst,default_channel_converter());
    }
};

namespace detail {

/// red * .3 + green * .59 + blue * .11 + .5

// The default implementation of to_luminance uses float0..1 as the intermediate channel type
template <typename RedChannel, typename GreenChannel, typename BlueChannel, typename GrayChannelValue>
struct rgb_to_luminance_fn {
    GrayChannelValue operator()(const RedChannel& red, const GreenChannel& green, const BlueChannel& blue) const {
        return channel_convert<GrayChannelValue>( bits32f(
            channel_convert<bits32f>(red  )*0.30f + 
            channel_convert<bits32f>(green)*0.59f + 
            channel_convert<bits32f>(blue )*0.11f) );
    }
};

// performance specialization for unsigned char
template <typename GrayChannelValue>
struct rgb_to_luminance_fn<uint8_t,uint8_t,uint8_t, GrayChannelValue> {
    GrayChannelValue operator()(uint8_t red, uint8_t green, uint8_t blue) const {
        return channel_convert<GrayChannelValue>(uint8_t(
            ((uint32_t(red  )*4915 + uint32_t(green)*9667 + uint32_t(blue )*1802) + 8192) >> 14));
    }
};

template <typename GrayChannel, typename RedChannel, typename GreenChannel, typename BlueChannel>
typename channel_traits<GrayChannel>::value_type rgb_to_luminance(const RedChannel& red, const GreenChannel& green, const BlueChannel& blue) {
    return rgb_to_luminance_fn<RedChannel,GreenChannel,BlueChannel,
                               typename channel_traits<GrayChannel>::value_type>()(red,green,blue);
}

}   // namespace detail

/// \ingroup ColorConvert
/// \brief Gray to RGB
template <>
struct default_color_converter_impl<gray_t,rgb_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        get_color(dst,red_t())  =
            channel_convert<typename color_element_type<P2, red_t  >::type>(get_color(src,gray_color_t()));
        get_color(dst,green_t())=
            channel_convert<typename color_element_type<P2, green_t>::type>(get_color(src,gray_color_t()));
        get_color(dst,blue_t()) =
            channel_convert<typename color_element_type<P2, blue_t >::type>(get_color(src,gray_color_t()));
    }
};

/// \ingroup ColorConvert
/// \brief Gray to CMYK
template <>
struct default_color_converter_impl<gray_t,cmyk_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        get_color(dst,cyan_t())=
            channel_traits<typename color_element_type<P2, cyan_t   >::type>::min_value();
        get_color(dst,magenta_t())=
            channel_traits<typename color_element_type<P2, magenta_t>::type>::min_value();
        get_color(dst,yellow_t())=
            channel_traits<typename color_element_type<P2, yellow_t >::type>::min_value();
        get_color(dst,black_t())=
            channel_convert<typename color_element_type<P2, black_t >::type>(get_color(src,gray_color_t()));
    }
};

/// \ingroup ColorConvert
/// \brief RGB to Gray
template <>
struct default_color_converter_impl<rgb_t,gray_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        get_color(dst,gray_color_t()) = 
            detail::rgb_to_luminance<typename color_element_type<P2,gray_color_t>::type>(
                get_color(src,red_t()), get_color(src,green_t()), get_color(src,blue_t())
            );
    }
};


/// \ingroup ColorConvert
/// \brief RGB to CMYK (not the fastest code in the world)
///
/// k = min(1 - r, 1 - g, 1 - b)
/// c = (1 - r - k) / (1 - k)
/// m = (1 - g - k) / (1 - k)
/// y = (1 - b - k) / (1 - k)
template <>
struct default_color_converter_impl<rgb_t,cmyk_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        typedef typename channel_type<P2>::type T2;
        get_color(dst,cyan_t())    = channel_invert(channel_convert<T2>(get_color(src,red_t())));          // c = 1 - r
        get_color(dst,magenta_t()) = channel_invert(channel_convert<T2>(get_color(src,green_t())));        // m = 1 - g
        get_color(dst,yellow_t())  = channel_invert(channel_convert<T2>(get_color(src,blue_t())));         // y = 1 - b
        get_color(dst,black_t())   = (std::min)(get_color(dst,cyan_t()),
                                                (std::min)(get_color(dst,magenta_t()),
                                                           get_color(dst,yellow_t())));   // k = minimum(c, m, y)
        T2 x = channel_traits<T2>::max_value()-get_color(dst,black_t());                  // x = 1 - k
        if (x>0.0001f) {
            float x1 = channel_traits<T2>::max_value()/float(x);
            get_color(dst,cyan_t())    = (T2)((get_color(dst,cyan_t())    - get_color(dst,black_t()))*x1);                // c = (c - k) / x
            get_color(dst,magenta_t()) = (T2)((get_color(dst,magenta_t()) - get_color(dst,black_t()))*x1);                // m = (m - k) / x
            get_color(dst,yellow_t())  = (T2)((get_color(dst,yellow_t())  - get_color(dst,black_t()))*x1);                // y = (y - k) / x
        } else {
            get_color(dst,cyan_t())=get_color(dst,magenta_t())=get_color(dst,yellow_t())=0;
        }
    }
};

/// \ingroup ColorConvert
/// \brief CMYK to RGB (not the fastest code in the world)
///
/// r = 1 - min(1, c*(1-k)+k)
/// g = 1 - min(1, m*(1-k)+k)
/// b = 1 - min(1, y*(1-k)+k)
template <>
struct default_color_converter_impl<cmyk_t,rgb_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        typedef typename channel_type<P1>::type T1;
        get_color(dst,red_t())  =
            channel_convert<typename color_element_type<P2,red_t>::type>(
                channel_invert<T1>(
                    (std::min)(channel_traits<T1>::max_value(), 
                             T1(get_color(src,cyan_t())*channel_invert(get_color(src,black_t()))+get_color(src,black_t())))));
        get_color(dst,green_t())=
            channel_convert<typename color_element_type<P2,green_t>::type>(
                channel_invert<T1>(
                    (std::min)(channel_traits<T1>::max_value(), 
                             T1(get_color(src,magenta_t())*channel_invert(get_color(src,black_t()))+get_color(src,black_t())))));
        get_color(dst,blue_t()) =
            channel_convert<typename color_element_type<P2,blue_t>::type>(
                channel_invert<T1>(
                    (std::min)(channel_traits<T1>::max_value(), 
                             T1(get_color(src,yellow_t())*channel_invert(get_color(src,black_t()))+get_color(src,black_t())))));
    }
};


/// \ingroup ColorConvert
/// \brief CMYK to Gray
///
/// gray = (1 - 0.212c - 0.715m - 0.0722y) * (1 - k)
template <>
struct default_color_converter_impl<cmyk_t,gray_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const  {
        get_color(dst,gray_color_t())=
            channel_convert<typename color_element_type<P2,gray_t>::type>(
                channel_multiply(
                    channel_invert(
                       detail::rgb_to_luminance<typename color_element_type<P1,black_t>::type>(
                            get_color(src,cyan_t()), 
                            get_color(src,magenta_t()), 
                            get_color(src,yellow_t())
                       )
                    ), 
                    channel_invert(get_color(src,black_t()))));
    }
};

namespace detail {
template <typename Pixel> 
typename channel_type<Pixel>::type alpha_or_max_impl(const Pixel& p, mpl::true_) {
    return get_color(p,alpha_t());
}
template <typename Pixel> 
typename channel_type<Pixel>::type alpha_or_max_impl(const Pixel&  , mpl::false_) {
    return channel_traits<typename channel_type<Pixel>::type>::max_value();
}
} // namespace detail

// Returns max_value if the pixel has no alpha channel. Otherwise returns the alpha.
template <typename Pixel> 
typename channel_type<Pixel>::type alpha_or_max(const Pixel& p) {
    return detail::alpha_or_max_impl(p, mpl::contains<typename color_space_type<Pixel>::type,alpha_t>());
}


/// \ingroup ColorConvert
/// \brief Converting any pixel type to RGBA. Note: Supports homogeneous pixels only.
template <typename C1>
struct default_color_converter_impl<C1,rgba_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        typedef typename channel_type<P2>::type T2;
        pixel<T2,rgb_layout_t> tmp;
        default_color_converter_impl<C1,rgb_t>()(src,tmp);
        get_color(dst,red_t())  =get_color(tmp,red_t());
        get_color(dst,green_t())=get_color(tmp,green_t());
        get_color(dst,blue_t()) =get_color(tmp,blue_t());
        get_color(dst,alpha_t())=channel_convert<T2>(alpha_or_max(src));
    }
};

/// \ingroup ColorConvert
///  \brief Converting RGBA to any pixel type. Note: Supports homogeneous pixels only.
///
/// Done by multiplying the alpha to get to RGB, then converting the RGB to the target pixel type
/// Note: This may be slower if the compiler doesn't optimize out constructing/destructing a temporary RGB pixel. 
///       Consider rewriting if performance is an issue
template <typename C2>
struct default_color_converter_impl<rgba_t,C2> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        typedef typename channel_type<P1>::type T1;
        default_color_converter_impl<rgb_t,C2>()(
            pixel<T1,rgb_layout_t>(channel_multiply(get_color(src,red_t()),  get_color(src,alpha_t())), 
                                   channel_multiply(get_color(src,green_t()),get_color(src,alpha_t())), 
                                   channel_multiply(get_color(src,blue_t()), get_color(src,alpha_t())))
            ,dst);
    }
};

/// \ingroup ColorConvert
/// \brief Unfortunately RGBA to RGBA must be explicitly provided - otherwise we get ambiguous specialization error.
template <>
struct default_color_converter_impl<rgba_t,rgba_t> {
    template <typename P1, typename P2>
    void operator()(const P1& src, P2& dst) const {
        static_for_each(src,dst,default_channel_converter());
    }
};

/// @defgroup ColorConvert Color Space Converion
/// \ingroup ColorSpaces
/// \brief Support for conversion between pixels of different color spaces and channel depths

/// \ingroup PixelAlgorithm ColorConvert
/// \brief class for color-converting one pixel to another
struct default_color_converter {
    template <typename SrcP, typename DstP>
    void operator()(const SrcP& src,DstP& dst) const { 
        typedef typename color_space_type<SrcP>::type SrcColorSpace;
        typedef typename color_space_type<DstP>::type DstColorSpace;
        default_color_converter_impl<SrcColorSpace,DstColorSpace>()(src,dst);
    }
};

/// \ingroup PixelAlgorithm
/// \brief helper function for converting one pixel to another using GIL default color-converters
///     where ScrP models HomogeneousPixelConcept
///           DstP models HomogeneousPixelValueConcept
template <typename SrcP, typename DstP>
inline void color_convert(const SrcP& src, DstP& dst) {
    default_color_converter()(src,dst);
}

} }  // namespace boost::gil

#endif
