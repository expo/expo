/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/

/*************************************************************************************************/

#ifndef GIL_DYNAMICIMAGE_IMAGE_VIEWS_HPP
#define GIL_DYNAMICIMAGE_IMAGE_VIEWS_HPP

/*!
/// \file               
/// \brief Methods for constructing any image views from other any image views
/// \author Lubomir Bourdev and Hailin Jin \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated on January 31, 2007
/// Extends image view factory to runtime type-specified views (any_image_view)
*/

#include "any_image_view.hpp"
#include "../../image_view_factory.hpp"

namespace boost { namespace gil {

namespace detail {
template <typename Result> struct flipped_up_down_view_fn {
    typedef Result result_type;
    template <typename View> result_type operator()(const View& src) const { return result_type(flipped_up_down_view(src)); }
};
template <typename Result> struct flipped_left_right_view_fn {
    typedef Result result_type;
    template <typename View> result_type operator()(const View& src) const { return result_type(flipped_left_right_view(src)); }
};
template <typename Result> struct rotated90cw_view_fn {
    typedef Result result_type;
    template <typename View> result_type operator()(const View& src) const { return result_type(rotated90cw_view(src)); }
};
template <typename Result> struct rotated90ccw_view_fn {
    typedef Result result_type;
    template <typename View> result_type operator()(const View& src) const { return result_type(rotated90ccw_view(src)); }
};
template <typename Result> struct tranposed_view_fn {
    typedef Result result_type;
    template <typename View> result_type operator()(const View& src) const { return result_type(tranposed_view(src)); }
};
template <typename Result> struct rotated180_view_fn {
    typedef Result result_type;
    template <typename View> result_type operator()(const View& src) const { return result_type(rotated180_view(src)); }
};
template <typename Result> struct subimage_view_fn {
    typedef Result result_type;
    subimage_view_fn(const point2<std::ptrdiff_t>& topleft, const point2<std::ptrdiff_t>& dimensions) : _topleft(topleft), _size2(dimensions) {}
    point2<std::ptrdiff_t> _topleft,_size2;
    template <typename View> result_type operator()(const View& src) const { return result_type(subimage_view(src,_topleft,_size2)); }
};
template <typename Result> struct subsampled_view_fn {
    typedef Result result_type;
    subsampled_view_fn(const point2<std::ptrdiff_t>& step) : _step(step) {}
    point2<std::ptrdiff_t> _step;
    template <typename View> result_type operator()(const View& src) const { return result_type(subsampled_view(src,_step)); }
};
template <typename Result> struct nth_channel_view_fn {
    typedef Result result_type;
    nth_channel_view_fn(int n) : _n(n) {}
    int _n;
    template <typename View> result_type operator()(const View& src) const { return result_type(nth_channel_view(src,_n)); }
};
template <typename DstP, typename Result, typename CC = default_color_converter> struct color_converted_view_fn {
    typedef Result result_type;
    color_converted_view_fn(CC cc = CC()): _cc(cc) {}

    template <typename View> result_type operator()(const View& src) const { return result_type(color_converted_view<DstP>(src, _cc)); }

    private:
        CC _cc;
};
} // namespace detail


/// \ingroup ImageViewTransformationsFlipUD
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_y_step_type<any_image_view<ViewTypes> >::type flipped_up_down_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::flipped_up_down_view_fn<typename dynamic_y_step_type<any_image_view<ViewTypes> >::type>()); 
}

/// \ingroup ImageViewTransformationsFlipLR
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_x_step_type<any_image_view<ViewTypes> >::type flipped_left_right_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::flipped_left_right_view_fn<typename dynamic_x_step_type<any_image_view<ViewTypes> >::type>()); 
}

/// \ingroup ImageViewTransformationsTransposed
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_xy_step_transposed_type<any_image_view<ViewTypes> >::type transposed_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::tranposed_view_fn<typename dynamic_xy_step_transposed_type<any_image_view<ViewTypes> >::type>()); 
}

/// \ingroup ImageViewTransformations90CW
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_xy_step_transposed_type<any_image_view<ViewTypes> >::type rotated90cw_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::rotated90cw_view_fn<typename dynamic_xy_step_transposed_type<any_image_view<ViewTypes> >::type>()); 
}

/// \ingroup ImageViewTransformations90CCW
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_xy_step_transposed_type<any_image_view<ViewTypes> >::type rotated90ccw_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::rotated90ccw_view_fn<typename dynamic_xy_step_transposed_type<any_image_view<ViewTypes> >::type>()); 
}

/// \ingroup ImageViewTransformations180
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_xy_step_type<any_image_view<ViewTypes> >::type rotated180_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::rotated180_view_fn<typename dynamic_xy_step_type<any_image_view<ViewTypes> >::type>()); 
}

/// \ingroup ImageViewTransformationsSubimage
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
any_image_view<ViewTypes> subimage_view(const any_image_view<ViewTypes>& src, const point2<std::ptrdiff_t>& topleft, const point2<std::ptrdiff_t>& dimensions) { 
    return apply_operation(src,detail::subimage_view_fn<any_image_view<ViewTypes> >(topleft,dimensions)); 
}

/// \ingroup ImageViewTransformationsSubimage
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
any_image_view<ViewTypes> subimage_view(const any_image_view<ViewTypes>& src, int xMin, int yMin, int width, int height) { 
    return apply_operation(src,detail::subimage_view_fn<any_image_view<ViewTypes> >(point2<std::ptrdiff_t>(xMin,yMin),point2<std::ptrdiff_t>(width,height))); 
}

/// \ingroup ImageViewTransformationsSubsampled
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_xy_step_type<any_image_view<ViewTypes> >::type subsampled_view(const any_image_view<ViewTypes>& src, const point2<std::ptrdiff_t>& step) { 
    return apply_operation(src,detail::subsampled_view_fn<typename dynamic_xy_step_type<any_image_view<ViewTypes> >::type>(step)); 
}

/// \ingroup ImageViewTransformationsSubsampled
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename dynamic_xy_step_type<any_image_view<ViewTypes> >::type subsampled_view(const any_image_view<ViewTypes>& src, int xStep, int yStep) { 
    return apply_operation(src,detail::subsampled_view_fn<typename dynamic_xy_step_type<any_image_view<ViewTypes> >::type>(point2<std::ptrdiff_t>(xStep,yStep))); 
}

namespace detail {
    template <typename View> struct get_nthchannel_type { typedef typename nth_channel_view_type<View>::type type; };
    template <typename Views> struct views_get_nthchannel_type : public mpl::transform<Views, get_nthchannel_type<mpl::_1> > {};
}

/// \ingroup ImageViewTransformationsNthChannel
/// \brief Given a runtime source image view, returns the type of a runtime image view over a single channel of the source view
template <typename ViewTypes>
struct nth_channel_view_type<any_image_view<ViewTypes> > {
    typedef any_image_view<typename detail::views_get_nthchannel_type<ViewTypes>::type> type;
};

/// \ingroup ImageViewTransformationsNthChannel
template <typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename nth_channel_view_type<any_image_view<ViewTypes> >::type nth_channel_view(const any_image_view<ViewTypes>& src, int n) { 
    return apply_operation(src,detail::nth_channel_view_fn<typename nth_channel_view_type<any_image_view<ViewTypes> >::type>(n)); 
}

namespace detail {
    template <typename View, typename DstP, typename CC> struct get_ccv_type : public color_converted_view_type<View, DstP, CC> {};
    template <typename Views, typename DstP, typename CC> struct views_get_ccv_type : public mpl::transform<Views, get_ccv_type<mpl::_1,DstP,CC> > {};
}

/// \ingroup ImageViewTransformationsColorConvert
/// \brief Returns the type of a runtime-specified view, color-converted to a given pixel type with user specified color converter
template <typename ViewTypes, typename DstP, typename CC>
struct color_converted_view_type<any_image_view<ViewTypes>,DstP,CC> {
    typedef any_image_view<typename detail::views_get_ccv_type<ViewTypes, DstP, CC>::type> type;
};

/// \ingroup ImageViewTransformationsColorConvert
/// \brief overload of generic color_converted_view with user defined color-converter
template <typename DstP, typename ViewTypes, typename CC> inline // Models MPL Random Access Container of models of ImageViewConcept
typename color_converted_view_type<any_image_view<ViewTypes>, DstP, CC>::type color_converted_view(const any_image_view<ViewTypes>& src,CC cc) { 
    return apply_operation(src,detail::color_converted_view_fn<DstP,typename color_converted_view_type<any_image_view<ViewTypes>, DstP, CC>::type >()); 
}

/// \ingroup ImageViewTransformationsColorConvert
/// \brief Returns the type of a runtime-specified view, color-converted to a given pixel type with the default coor converter
template <typename ViewTypes, typename DstP>
struct color_converted_view_type<any_image_view<ViewTypes>,DstP> {
    typedef any_image_view<typename detail::views_get_ccv_type<ViewTypes, DstP, default_color_converter>::type> type;
};

/// \ingroup ImageViewTransformationsColorConvert
/// \brief overload of generic color_converted_view with the default color-converter
template <typename DstP, typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename color_converted_view_type<any_image_view<ViewTypes>, DstP>::type color_converted_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::color_converted_view_fn<DstP,typename color_converted_view_type<any_image_view<ViewTypes>, DstP>::type >()); 
}


/// \ingroup ImageViewTransformationsColorConvert
/// \brief overload of generic color_converted_view with user defined color-converter
///        These are workarounds for GCC 3.4, which thinks color_converted_view is ambiguous with the same method for templated views (in gil/image_view_factory.hpp)
template <typename DstP, typename ViewTypes, typename CC> inline // Models MPL Random Access Container of models of ImageViewConcept
typename color_converted_view_type<any_image_view<ViewTypes>, DstP, CC>::type any_color_converted_view(const any_image_view<ViewTypes>& src,CC cc) { 
    return apply_operation(src,detail::color_converted_view_fn<DstP,typename color_converted_view_type<any_image_view<ViewTypes>, DstP, CC>::type >()); 
}

/// \ingroup ImageViewTransformationsColorConvert
/// \brief overload of generic color_converted_view with the default color-converter
///        These are workarounds for GCC 3.4, which thinks color_converted_view is ambiguous with the same method for templated views (in gil/image_view_factory.hpp)
template <typename DstP, typename ViewTypes> inline // Models MPL Random Access Container of models of ImageViewConcept
typename color_converted_view_type<any_image_view<ViewTypes>, DstP>::type any_color_converted_view(const any_image_view<ViewTypes>& src) { 
    return apply_operation(src,detail::color_converted_view_fn<DstP,typename color_converted_view_type<any_image_view<ViewTypes>, DstP>::type >()); 
}

/// \}

} }  // namespace boost::gil

#endif
