/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_DYNAMICIMAGE_ALGORITHM_HPP
#define GIL_DYNAMICIMAGE_ALGORITHM_HPP

#include "../../algorithm.hpp"
#include "any_image.hpp"
#include <boost/bind.hpp>

////////////////////////////////////////////////////////////////////////////////////////
/// \file               
/// \brief Some basic STL-style algorithms when applied to runtime type specified image views
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date 2005-2007 \n Last updated on September 24, 2006
///
////////////////////////////////////////////////////////////////////////////////////////

namespace boost { namespace gil {

namespace detail {
    struct equal_pixels_fn : public binary_operation_obj<equal_pixels_fn,bool> {
        template <typename V1, typename V2>
        GIL_FORCEINLINE bool apply_compatible(const V1& v1, const V2& v2) const {
            return equal_pixels(v1,v2);
        }
    };
} // namespace detail

/// \ingroup ImageViewSTLAlgorithmsEqualPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename View2>   // Model MutableImageViewConcept
bool equal_pixels(const any_image_view<Types1>& src, const View2& dst) {
    return apply_operation(src,boost::bind(detail::equal_pixels_fn(), _1, dst));
}

/// \ingroup ImageViewSTLAlgorithmsEqualPixels
template <typename View1,   // Model ImageViewConcept
          typename Types2>  // Model MPL Random Access Container of models of MutableImageViewConcept
bool equal_pixels(const View1& src, const any_image_view<Types2>& dst) {
    return apply_operation(dst,boost::bind(detail::equal_pixels_fn(), src, _1));
}

/// \ingroup ImageViewSTLAlgorithmsEqualPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename Types2>  // Model MPL Random Access Container of models of MutableImageViewConcept
bool equal_pixels(const any_image_view<Types1>& src, const any_image_view<Types2>& dst) {
    return apply_operation(src,dst,detail::equal_pixels_fn());
}

namespace detail {
    struct copy_pixels_fn : public binary_operation_obj<copy_pixels_fn> {
        template <typename View1, typename View2>
        GIL_FORCEINLINE void apply_compatible(const View1& src, const View2& dst) const {
            copy_pixels(src,dst);
        }
    };
}

/// \ingroup ImageViewSTLAlgorithmsCopyPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename View2>   // Model MutableImageViewConcept
void copy_pixels(const any_image_view<Types1>& src, const View2& dst) {
    apply_operation(src,boost::bind(detail::copy_pixels_fn(), _1, dst));
}

/// \ingroup ImageViewSTLAlgorithmsCopyPixels
template <typename View1,   // Model ImageViewConcept
          typename Types2>  // Model MPL Random Access Container of models of MutableImageViewConcept
void copy_pixels(const View1& src, const any_image_view<Types2>& dst) {
    apply_operation(dst,boost::bind(detail::copy_pixels_fn(), src, _1));
}

/// \ingroup ImageViewSTLAlgorithmsCopyPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename Types2>  // Model MPL Random Access Container of models of MutableImageViewConcept
void copy_pixels(const any_image_view<Types1>& src, const any_image_view<Types2>& dst) {
    apply_operation(src,dst,detail::copy_pixels_fn());
}



//forward declaration for default_color_converter (see full definition in color_convert.hpp)
struct default_color_converter;

/// \ingroup ImageViewSTLAlgorithmsCopyAndConvertPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename View2,   // Model MutableImageViewConcept
          typename CC>      // Model ColorConverterConcept
void copy_and_convert_pixels(const any_image_view<Types1>& src, const View2& dst, CC cc) {
    apply_operation(src,boost::bind(detail::copy_and_convert_pixels_fn<CC>(cc), _1, dst));
}

/// \ingroup ImageViewSTLAlgorithmsCopyAndConvertPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename View2>   // Model MutableImageViewConcept
void copy_and_convert_pixels(const any_image_view<Types1>& src, const View2& dst) {
    apply_operation(src,boost::bind(detail::copy_and_convert_pixels_fn<default_color_converter>(), _1, dst));
}

/// \ingroup ImageViewSTLAlgorithmsCopyAndConvertPixels
template <typename View1,   // Model ImageViewConcept
          typename Types2,  // Model MPL Random Access Container of models of MutableImageViewConcept
          typename CC>      // Model ColorConverterConcept
void copy_and_convert_pixels(const View1& src, const any_image_view<Types2>& dst, CC cc) {
    apply_operation(dst,boost::bind(detail::copy_and_convert_pixels_fn<CC>(cc), src, _1));
}

/// \ingroup ImageViewSTLAlgorithmsCopyAndConvertPixels
template <typename View1,   // Model ImageViewConcept
          typename Types2>  // Model MPL Random Access Container of models of MutableImageViewConcept
void copy_and_convert_pixels(const View1& src, const any_image_view<Types2>& dst) {
    apply_operation(dst,boost::bind(detail::copy_and_convert_pixels_fn<default_color_converter>(), src, _1));
}

/// \ingroup ImageViewSTLAlgorithmsCopyAndConvertPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename Types2,  // Model MPL Random Access Container of models of MutableImageViewConcept
          typename CC>      // Model ColorConverterConcept
void copy_and_convert_pixels(const any_image_view<Types1>& src, const any_image_view<Types2>& dst, CC cc) {
    apply_operation(src,dst,detail::copy_and_convert_pixels_fn<CC>(cc));
}

/// \ingroup ImageViewSTLAlgorithmsCopyAndConvertPixels
template <typename Types1,  // Model MPL Random Access Container of models of ImageViewConcept
          typename Types2>  // Model MPL Random Access Container of models of MutableImageViewConcept
void copy_and_convert_pixels(const any_image_view<Types1>& src, const any_image_view<Types2>& dst) {
    apply_operation(src,dst,detail::copy_and_convert_pixels_fn<default_color_converter>());
}

namespace detail {
template <bool COMPATIBLE> struct fill_pixels_fn1 {
    template <typename V, typename Value> static void apply(const V& src, const Value& val) { fill_pixels(src,val); }
};

// copy_pixels invoked on incompatible images
template <> struct fill_pixels_fn1<false> {
    template <typename V, typename Value> static void apply(const V& src, const Value& val) { throw std::bad_cast();}
};

template <typename Value>
struct fill_pixels_fn {
    fill_pixels_fn(const Value& val) : _val(val) {}

    typedef void result_type;
    template <typename V> result_type operator()(const V& img_view) const {
        fill_pixels_fn1<pixels_are_compatible<typename V::value_type, Value>::value>::apply(img_view,_val);
    }
    Value _val;
};
}

/// \ingroup ImageViewSTLAlgorithmsFillPixels
/// \brief fill_pixels for any image view. The pixel to fill with must be compatible with the current view
template <typename Types, // Model MPL Random Access Container of models of MutableImageViewConcept
          typename Value>
void fill_pixels(const any_image_view<Types>& img_view, const Value& val) {
    apply_operation(img_view,detail::fill_pixels_fn<Value>(val));
}


} }  // namespace boost::gil

#endif
