// Boost.Range library
//
//  Copyright Thorsten Ottosen 2006. Use, modification and
//  distribution is subject to the Boost Software License, Version
//  1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)
//
// For more information, see http://www.boost.org/libs/range/
//

#ifndef BOOST_RANGE_DETAIL_AS_LITERAL_HPP
#define BOOST_RANGE_DETAIL_AS_LITERAL_HPP

#if defined(_MSC_VER)
# pragma once
#endif

#include <boost/range/detail/detail_str.hpp>
#include <boost/range/iterator_range.hpp>

namespace boost
{
    template< class Range >
    inline iterator_range<BOOST_DEDUCED_TYPENAME range_iterator<Range>::type> 
    as_literal( Range& r )
    {
        return ::boost::make_iterator_range( ::boost::range_detail::str_begin(r),
                                             ::boost::range_detail::str_end(r) );
    }

}

#endif
