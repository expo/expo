/*
(c) 2014 Glen Joseph Fernandes
<glenjofe -at- gmail.com>

Distributed under the Boost Software
License, Version 1.0.
http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_DETAIL_IS_ALIGNED_HPP
#define BOOST_ALIGN_DETAIL_IS_ALIGNED_HPP

#include <boost/align/detail/is_alignment.hpp>
#include <boost/align/is_aligned_forward.hpp>
#include <boost/assert.hpp>

namespace boost {
namespace alignment {

inline bool is_aligned(const void* ptr, std::size_t alignment)
    BOOST_NOEXCEPT
{
    BOOST_ASSERT(detail::is_alignment(alignment));
    return is_aligned((std::size_t)ptr, alignment);
}

inline bool is_aligned(std::size_t alignment, const void* ptr)
    BOOST_NOEXCEPT
{
    BOOST_ASSERT(detail::is_alignment(alignment));
    return is_aligned((std::size_t)ptr, alignment);
}

} /* .alignment */
} /* .boost */

#endif
