/*
    Copyright 2005-2007 Adobe Systems Incorporated
   
    Use, modification and distribution are subject to the Boost Software License,
    Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
    http://www.boost.org/LICENSE_1_0.txt).

    See http://opensource.adobe.com/gil for most recent version including documentation.
*/
/*************************************************************************************************/

#ifndef GIL_DYNAMIC_IO_H
#define GIL_DYNAMIC_IO_H

/// \file
/// \brief  Generic io functions for dealing with dynamic images
//
/// \author Hailin Jin and Lubomir Bourdev \n
///         Adobe Systems Incorporated
/// \date   2005-2007 \n Last updated May 30, 2006

#include <boost/mpl/at.hpp>
#include <boost/mpl/size.hpp>
#include "../../gil_config.hpp"
#include "io_error.hpp"
#include "../dynamic_image/any_image.hpp"

namespace boost { namespace gil {

namespace detail {

template <long N>
struct construct_matched_t {
    template <typename Images,typename Pred>
    static bool apply(any_image<Images>& im,Pred pred) {
        if (pred.template apply<typename mpl::at_c<Images,N-1>::type>()) {
            typename mpl::at_c<Images,N-1>::type x;
            im.move_in(x);
            return true;
        } else return construct_matched_t<N-1>::apply(im,pred);
    }
};
template <>
struct construct_matched_t<0> {
    template <typename Images,typename Pred>
    static bool apply(any_image<Images>&,Pred) {return false;}
};

// A function object that can be passed to apply_operation.
// Given a predicate IsSupported taking a view type and returning an MPL boolean,
// calls the apply method of OpClass with the view if the given view IsSupported, or throws an exception otherwise
template <typename IsSupported, typename OpClass>
class dynamic_io_fnobj {
    OpClass* _op;

    template <typename View>
    void apply(const View& view,mpl::true_ ) {_op->apply(view);}
    template <typename View>
    void apply(const View& view,mpl::false_) {io_error("dynamic_io: unsupported view type for the given file format");}
public:
    dynamic_io_fnobj(OpClass* op) : _op(op) {}

    typedef void result_type;

    template <typename View>
    void operator()(const View& view) {apply(view,typename IsSupported::template apply<View>::type());}
};

} // namespace detail

/// \brief Within the any_image, constructs an image with the given dimensions
///        and a type that satisfies the given predicate
template <typename Images,typename Pred>
inline bool construct_matched(any_image<Images>& im,Pred pred) {
    return detail::construct_matched_t<mpl::size<Images>::value>::apply(im,pred);
}

} }  // namespace boost::gil

#endif
