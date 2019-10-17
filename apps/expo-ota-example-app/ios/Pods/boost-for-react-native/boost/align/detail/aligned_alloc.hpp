/*
(c) 2014-2015 Glen Joseph Fernandes
<glenjofe -at- gmail.com>

Distributed under the Boost Software
License, Version 1.0.
http://boost.org/LICENSE_1_0.txt
*/
#ifndef BOOST_ALIGN_DETAIL_ALIGNED_ALLOC_HPP
#define BOOST_ALIGN_DETAIL_ALIGNED_ALLOC_HPP

#include <boost/align/detail/is_alignment.hpp>
#include <boost/align/align.hpp>
#include <boost/align/alignment_of.hpp>
#include <boost/assert.hpp>
#include <cstdlib>

namespace boost {
namespace alignment {

inline void* aligned_alloc(std::size_t alignment, std::size_t size)
    BOOST_NOEXCEPT
{
    BOOST_ASSERT(detail::is_alignment(alignment));
    enum {
        min_align = alignment_of<void*>::value
    };
    if (alignment < min_align) {
        alignment = min_align;
    }
    std::size_t n = size + alignment - min_align;
    void* r = 0;
    void* p = std::malloc(sizeof(void*) + n);
    if (p) {
        r = static_cast<char*>(p) + sizeof p;
        (void)align(alignment, size, r, n);
        *(static_cast<void**>(r) - 1) = p;
    }
    return r;
}

inline void aligned_free(void* ptr) BOOST_NOEXCEPT
{
    if (ptr) {
        std::free(*(static_cast<void**>(ptr) - 1));
    }
}

} /* .alignment */
} /* .boost */

#endif
