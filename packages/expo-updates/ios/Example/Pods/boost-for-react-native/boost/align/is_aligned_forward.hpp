/*
(c) 2015 Glen Joseph Fernandes
<glenjofe -at- gmail.com>

Distributed under the Boost Software
License, Version 1.0.
http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_IS_ALIGNED_FORWARD_HPP
#define BOOST_ALIGN_IS_ALIGNED_FORWARD_HPP

#include <boost/config.hpp>
#include <cstddef>

namespace boost {
namespace alignment {

BOOST_CONSTEXPR bool is_aligned(std::size_t value,
    std::size_t alignment) BOOST_NOEXCEPT;

} /* .alignment */
} /* .boost */

#endif
