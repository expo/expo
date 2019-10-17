
//          Copyright Dmitry Vyukov 2010-2011.
//          Copyright Oliver Kowalke 2016.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)
//
// based on Dmitry Vyukov's intrusive MPSC queue
// http://www.1024cores.net/home/lock-free-algorithms/queues/intrusive-mpsc-node-based-queue
// https://groups.google.com/forum/#!topic/lock-free/aFHvZhu1G-0

#ifndef BOOST_FIBERS_DETAIL_CONTEXT_MPSC_QUEUE_H
#define BOOST_FIBERS_DETAIL_CONTEXT_MPSC_QUEUE_H

#include <atomic>
#include <memory>
#include <type_traits>

#include <boost/assert.hpp>
#include <boost/config.hpp>

#include <boost/fiber/context.hpp>
#include <boost/fiber/detail/config.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {
namespace detail {

// a MPSC queue
// multiple threads push ready fibers (belonging to local scheduler)
// (thread) local scheduler pops fibers
class context_mpsc_queue {
private:
    // not default constructor for context - use aligned_storage instead
    alignas(cache_alignment) std::aligned_storage< sizeof( context), alignof( context) >::type  storage_{};
    context                                         *   dummy_;
    alignas(cache_alignment) std::atomic< context * >   head_;
    alignas(cache_alignment) context                *   tail_;
    char                                                pad_[cacheline_length];

public:
    context_mpsc_queue() :
        dummy_{ reinterpret_cast< context * >( std::addressof( storage_) ) },
        head_{ dummy_ },
        tail_{ dummy_ } {
        dummy_->remote_nxt_.store( nullptr, std::memory_order_release);
    }

    context_mpsc_queue( context_mpsc_queue const&) = delete;
    context_mpsc_queue & operator=( context_mpsc_queue const&) = delete;

    void push( context * ctx) noexcept {
        BOOST_ASSERT( nullptr != ctx);
        ctx->remote_nxt_.store( nullptr, std::memory_order_release);
        context * prev = head_.exchange( ctx, std::memory_order_acq_rel);
        prev->remote_nxt_.store( ctx, std::memory_order_release);
    }

    context * pop() noexcept {
        context * tail = tail_;
        context * next = tail->remote_nxt_.load( std::memory_order_acquire);
        if ( dummy_ == tail) {
            if ( nullptr == next) {
                return nullptr;
            }
            tail_ = next;
            tail = next;
            next = next->remote_nxt_.load( std::memory_order_acquire);;
        }
        if ( nullptr != next) {
            tail_ = next;
            return tail;
        }
        context * head = head_.load( std::memory_order_acquire);
        if ( tail != head) {
            return nullptr;
        }
        push( dummy_);
        next = tail->remote_nxt_.load( std::memory_order_acquire);
        if ( nullptr != next) {
            tail_= next;
            return tail;
        }
        return nullptr;
    }
};

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_DETAIL_CONTEXT_MPSC_QUEUE_H
