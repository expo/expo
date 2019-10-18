
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_DETAIL_DATA_H
#define BOOST_FIBERS_DETAIL_DATA_H

#include <boost/config.hpp>

#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/detail/spinlock.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {

class context;

namespace detail {

#if (BOOST_EXECUTION_CONTEXT==1)
struct data_t {
    spinlock_lock   *   lk{ nullptr };
    context         *   ctx{ nullptr };

    data_t() noexcept = default;

    explicit data_t( spinlock_lock * lk_) noexcept :
        lk{ lk_ } {
    }

    explicit data_t( context * ctx_) noexcept :
        ctx{ ctx_ } {
    }
};
#else
struct data_t {
    spinlock_lock   *   lk{ nullptr };
    context         *   ctx{ nullptr };
    context         *   from;

    explicit data_t( context * from_) noexcept :
        from{ from_ } {
    }

    explicit data_t( spinlock_lock * lk_,
                     context * from_) noexcept :
        lk{ lk_ },
        from{ from_ } {
    }

    explicit data_t( context * ctx_,
                     context * from_) noexcept :
        ctx{ ctx_ },
        from{ from_ } {
    }
};
#endif

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_DETAIL_DATA_H
