
//          Copyright Oliver Kowalke 2016.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_spinlock_ttas_futex_FUTEX_H
#define BOOST_FIBERS_spinlock_ttas_futex_FUTEX_H

#include <atomic>
#include <random>
#include <thread>

#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/detail/cpu_relax.hpp>
#include <boost/fiber/detail/futex.hpp>

// based on informations from:
// https://software.intel.com/en-us/articles/benefitting-power-and-performance-sleep-loops
// https://software.intel.com/en-us/articles/long-duration-spin-wait-loops-on-hyper-threading-technology-enabled-intel-processors

namespace boost {
namespace fibers {
namespace detail {

class spinlock_ttas_futex {
private:
    // align shared variable 'value_' at cache line to prevent false sharing
    alignas(cache_alignment) std::atomic< std::int32_t >    value_{ 0 };
    // padding to avoid other data one the cacheline of shared variable 'value_'
    char                                                    pad_[cacheline_length];

public:
    spinlock_ttas_futex() noexcept = default;

    spinlock_ttas_futex( spinlock_ttas_futex const&) = delete;
    spinlock_ttas_futex & operator=( spinlock_ttas_futex const&) = delete;

    void lock() noexcept {
        std::int32_t collisions = 0, tests = 0, expected = 0;
        // after max. spins or collisions suspend via futex
        while ( BOOST_FIBERS_SPIN_MAX_TESTS > tests && BOOST_FIBERS_SPIN_MAX_COLLISIONS > collisions) {
            // avoid using multiple pause instructions for a delay of a specific cycle count
            // the delay of cpu_relax() (pause on Intel) depends on the processor family
            // the cycle count can not guaranteed from one system to the next
            // -> check the shared variable 'value_' in between each cpu_relax() to prevent
            //    unnecessarily long delays on some systems
            // test shared variable 'status_'
            // first access to 'value_' -> chache miss
            // sucessive acccess to 'value_' -> cache hit
            // if 'value_' was released by other fiber
            // cached 'value_' is invalidated -> cache miss
            if ( 0 != ( expected = value_.load( std::memory_order_relaxed) ) ) {
                ++tests;
#if !defined(BOOST_FIBERS_SPIN_SINGLE_CORE)
                // give CPU a hint that this thread is in a "spin-wait" loop
                // delays the next instruction's execution for a finite period of time (depends on processor family)
                // the CPU is not under demand, parts of the pipeline are no longer being used
                // -> reduces the power consumed by the CPU
                cpu_relax();
#else
                // std::this_thread::yield() allows this_thread to give up the remaining part of its time slice,
                // but only to another thread on the same processor
                // instead of constant checking, a thread only checks if no other useful work is pending
                std::this_thread::yield();
#endif
            } else if ( ! value_.compare_exchange_strong( expected, 1, std::memory_order_acquire, std::memory_order_release) ) {
                // spinlock now contended
                // utilize 'Binary Exponential Backoff' algorithm
                // linear_congruential_engine is a random number engine based on Linear congruential generator (LCG)
                static thread_local std::minstd_rand generator;
                const std::int32_t z = std::uniform_int_distribution< std::int32_t >{
                    0, static_cast< std::int32_t >( 1) << collisions }( generator);
                ++collisions;
                for ( std::int32_t i = 0; i < z; ++i) {
                    cpu_relax();
                }
            } else {
                // success, lock acquired
                return;
            }
        }
        // failure, lock not acquired
        // pause via futex
        if ( 2 != expected) {
            expected = value_.exchange( 2, std::memory_order_acquire);
        }
        while ( 0 != expected) {
            futex_wait( & value_, 2);
            expected = value_.exchange( 2, std::memory_order_acquire);
        }
    }

    void unlock() noexcept {
        if ( 1 != value_.fetch_sub( 1, std::memory_order_acquire) ) {
            value_.store( 0, std::memory_order_release);
            futex_wake( & value_);
        }
    }
};

}}}

#endif // BOOST_FIBERS_spinlock_ttas_futex_FUTEX_H
