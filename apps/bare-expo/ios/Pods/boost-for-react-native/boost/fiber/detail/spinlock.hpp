
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_SPINLOCK_H
#define BOOST_FIBERS_SPINLOCK_H

#include <boost/config.hpp>

#include <boost/fiber/detail/config.hpp>

#if !defined(BOOST_FIBERS_NO_ATOMICS) 
# include <mutex>
# include <boost/fiber/detail/spinlock_ttas.hpp>
# include <boost/fiber/detail/spinlock_ttas_adaptive.hpp>
# if defined(BOOST_FIBERS_HAS_FUTEX)
#  include <boost/fiber/detail/spinlock_ttas_futex.hpp>
#  include <boost/fiber/detail/spinlock_ttas_adaptive_futex.hpp>
# endif
#endif

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {
namespace detail {

#if defined(BOOST_FIBERS_NO_ATOMICS) 
struct spinlock {
    constexpr spinlock() noexcept {}
    void lock() noexcept {}
    void unlock() noexcept {}
};

struct spinlock_lock {
    constexpr spinlock_lock( spinlock &) noexcept {}
    void lock() noexcept {}
    void unlock() noexcept {}
};
#else
# if defined(BOOST_FIBERS_SPINLOCK_STD_MUTEX) 
using spinlock = std::mutex;
# elif defined(BOOST_FIBERS_SPINLOCK_TTAS_FUTEX)
using spinlock = spinlock_ttas_futex;
# elif defined(BOOST_FIBERS_SPINLOCK_TTAS_ADAPTIVE_FUTEX)
using spinlock = spinlock_ttas_adaptive_futex;
# elif defined(BOOST_FIBERS_SPINLOCK_TTAS_ADAPTIVE) 
using spinlock = spinlock_ttas_adaptive;
# else
using spinlock = spinlock_ttas;
# endif
using spinlock_lock = std::unique_lock< spinlock >;
#endif

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_SPINLOCK_H
