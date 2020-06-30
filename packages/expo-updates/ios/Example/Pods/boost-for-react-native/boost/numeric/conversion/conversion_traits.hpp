//  (c) Copyright Fernando Luis Cacciola Carballal 2000-2004
//  Use, modification, and distribution is subject to the Boost Software
//  License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See library home page at http://www.boost.org/libs/numeric/conversion
//
// Contact the author at: fernando_cacciola@hotmail.com
// 
#ifndef BOOST_NUMERIC_CONVERSION_CONVERSION_TRAITS_FLC_12NOV2002_HPP
#define BOOST_NUMERIC_CONVERSION_CONVERSION_TRAITS_FLC_12NOV2002_HPP

#include "boost/numeric/conversion/detail/conversion_traits.hpp"
#include "boost/detail/workaround.hpp"
#include "boost/config.hpp"

namespace boost { namespace numeric
{

template<class T, class S>
struct conversion_traits 
    : convdetail::get_conversion_traits<T,S>::type 
{
#if BOOST_WORKAROUND(BOOST_MSVC, <= 1300)
    typedef typename convdetail::get_conversion_traits<T,S>::type base_;
    typedef typename base_::target_type     target_type;
    typedef typename base_::source_type     source_type;
    typedef typename base_::result_type     result_type;
    typedef typename base_::argument_type   argument_type;
#endif
} ;

} } // namespace boost::numeric

#endif
//
///////////////////////////////////////////////////////////////////////////////////////////////


