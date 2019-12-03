/*
(c) 2015 Glen Joseph Fernandes
<glenjofe -at- gmail.com>

Distributed under the Boost Software
License, Version 1.0.
http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_ALIGN_DOWN_HPP
#define BOOST_ALIGN_ALIGN_DOWN_HPP

#include <boost/align/detail/align_down.hpp>
#include <boost/align/align_down_forward.hpp>

namespace boost {
namespace alignment {

BOOST_CONSTEXPR inline std::size_t align_down(std::size_t value,
    std::size_t alignment) BOOST_NOEXCEPT
{
    return value & ~(alignment - 1);
}

} /* .alignment */
} /* .boost */

#endif
