/*
(c) 2015 Glen Joseph Fernandes
<glenjofe -at- gmail.com>

Distributed under the Boost Software
License, Version 1.0.
http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_DETAIL_ALIGN_UP_HPP
#define BOOST_ALIGN_DETAIL_ALIGN_UP_HPP

#include <boost/align/detail/is_alignment.hpp>
#include <boost/align/align_up_forward.hpp>
#include <boost/assert.hpp>

namespace boost {
namespace alignment {

inline void* align_up(void* ptr, std::size_t alignment) BOOST_NOEXCEPT
{
    BOOST_ASSERT(detail::is_alignment(alignment));
    return (void*)(align_up((std::size_t)ptr, alignment));
}

} /* .alignment */
} /* .boost */

#endif
