
//          Copyright Oliver Kowalke 2016.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)
//
// based on Dmitry Vyukov's MPMC queue
// (http://www.1024cores.net/home/lock-free-algorithms/queues/bounded-mpmc-queue)

#ifndef BOOST_FIBERS_BUFFERED_CHANNEL_H
#define BOOST_FIBERS_BUFFERED_CHANNEL_H

#include <atomic>
#include <chrono>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <type_traits>

#include <boost/config.hpp>

#include <boost/fiber/channel_op_status.hpp>
#include <boost/fiber/context.hpp>
#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/detail/convert.hpp>
#include <boost/fiber/detail/spinlock.hpp>
#include <boost/fiber/exceptions.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {

template< typename T >
class buffered_channel {
public:
    typedef T   value_type;

private:
    typedef typename std::aligned_storage< sizeof( T), alignof( T) >::type  storage_type;
    typedef context::wait_queue_t                                           wait_queue_type;

    struct alignas(cache_alignment) slot {
        std::atomic< std::size_t >  cycle{ 0 };
        storage_type                storage{};

        slot() = default;
    };

    // procuder cacheline
    alignas(cache_alignment) std::atomic< std::size_t >     producer_idx_{ 0 };
    // consumer cacheline
    alignas(cache_alignment) std::atomic< std::size_t >     consumer_idx_{ 0 };
    // shared write cacheline
    alignas(cache_alignment) std::atomic_bool               closed_{ false };
    mutable detail::spinlock                                splk_{};
    wait_queue_type                                         waiting_producers_{};
    wait_queue_type                                         waiting_consumers_{};
    // shared read cacheline
    alignas(cache_alignment) slot                        *  slots_{ nullptr };
    std::size_t                                             capacity_;
    char                                                    pad_[cacheline_length];

    bool is_full_() {
        std::size_t idx{ producer_idx_.load( std::memory_order_relaxed) };
        return 0 > static_cast< std::intptr_t >( slots_[idx & (capacity_ - 1)].cycle.load( std::memory_order_acquire) ) - static_cast< std::intptr_t >( idx);
    }

    bool is_empty_() {
        std::size_t idx{ consumer_idx_.load( std::memory_order_relaxed) };
        return 0 > static_cast< std::intptr_t >( slots_[idx & (capacity_ - 1)].cycle.load( std::memory_order_acquire) ) - static_cast< std::intptr_t >( idx + 1);
    }

    template< typename ValueType >
    channel_op_status try_push_( ValueType && value) {
        slot * s{ nullptr };
        std::size_t idx{ producer_idx_.load( std::memory_order_relaxed) };
        for (;;) {
            s = & slots_[idx & (capacity_ - 1)];
            std::size_t cycle{ s->cycle.load( std::memory_order_acquire) };
            std::intptr_t diff{ static_cast< std::intptr_t >( cycle) - static_cast< std::intptr_t >( idx) };
            if ( 0 == diff) {
                if ( producer_idx_.compare_exchange_weak( idx, idx + 1, std::memory_order_relaxed) ) {
                    break;
                }
            } else if ( 0 > diff) {
                return channel_op_status::full;
            } else {
                idx = producer_idx_.load( std::memory_order_relaxed);
            }
        }
        ::new ( static_cast< void * >( std::addressof( s->storage) ) ) value_type( std::forward< ValueType >( value) );
        s->cycle.store( idx + 1, std::memory_order_release);
        return channel_op_status::success;
    }

    channel_op_status try_value_pop_( slot *& s, std::size_t & idx) {
        idx = consumer_idx_.load( std::memory_order_relaxed);
        for (;;) {
            s = & slots_[idx & (capacity_ - 1)];
            std::size_t cycle = s->cycle.load( std::memory_order_acquire);
            std::intptr_t diff{ static_cast< std::intptr_t >( cycle) - static_cast< std::intptr_t >( idx + 1) };
            if ( 0 == diff) {
                if ( consumer_idx_.compare_exchange_weak( idx, idx + 1, std::memory_order_relaxed) ) {
                    break;
                }
            } else if ( 0 > diff) {
                return channel_op_status::empty;
            } else {
                idx = consumer_idx_.load( std::memory_order_relaxed);
            }
        }
        // incrementing the slot cycle must be deferred till the value has been consumed
        // slot cycle tells procuders that the cell can be re-used (store new value)
        return channel_op_status::success;
    }

    channel_op_status try_pop_( value_type & value) {
        slot * s{ nullptr };
        std::size_t idx{ 0 };
        channel_op_status status{ try_value_pop_( s, idx) };
        if ( channel_op_status::success == status) {
            value = std::move( * reinterpret_cast< value_type * >( std::addressof( s->storage) ) );
            s->cycle.store( idx + capacity_, std::memory_order_release);
        }
        return status;
    }

public:
    explicit buffered_channel( std::size_t capacity) :
        capacity_{ capacity } {
        if ( 0 == capacity_ || 0 != ( capacity_ & (capacity_ - 1) ) ) { 
            throw fiber_error( std::make_error_code( std::errc::invalid_argument),
                               "boost fiber: buffer capacity is invalid");
        }
        slots_ = new slot[capacity_]();
        for ( std::size_t i = 0; i < capacity_; ++i) {
            slots_[i].cycle.store( i, std::memory_order_relaxed);
        }
    }

    ~buffered_channel() {
        close();
        for (;;) {
            slot * s{ nullptr };
            std::size_t idx{ 0 };
            if ( channel_op_status::success == try_value_pop_( s, idx) ) {
                reinterpret_cast< value_type * >( std::addressof( s->storage) )->~value_type();
                s->cycle.store( idx + capacity_, std::memory_order_release);
            } else {
                break;
            }
        }
        delete [] slots_;
    }

    buffered_channel( buffered_channel const&) = delete;
    buffered_channel & operator=( buffered_channel const&) = delete;

    bool is_closed() const noexcept {
        return closed_.load( std::memory_order_acquire);
    }

    void close() noexcept {
        context * ctx{ context::active() };
        detail::spinlock_lock lk{ splk_ };
        closed_.store( true, std::memory_order_release);
        // notify all waiting producers
        while ( ! waiting_producers_.empty() ) {
            context * producer_ctx{ & waiting_producers_.front() };
            waiting_producers_.pop_front();
            ctx->set_ready( producer_ctx);
        }
        // notify all waiting consumers
        while ( ! waiting_consumers_.empty() ) {
            context * consumer_ctx{ & waiting_consumers_.front() };
            waiting_consumers_.pop_front();
            ctx->set_ready( consumer_ctx);
        }
    }

    channel_op_status try_push( value_type const& value) {
        if ( is_closed() ) {
            return channel_op_status::closed;
        }
        return try_push_( value);
    }

    channel_op_status try_push( value_type && value) {
        if ( is_closed() ) {
            return channel_op_status::closed;
        }
        return try_push_( std::move( value) );
    }

    channel_op_status push( value_type const& value) {
        context * ctx{ context::active() };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            channel_op_status status{ try_push_( value) };
            if ( channel_op_status::success == status) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    lk.unlock();
                    ctx->set_ready( consumer_ctx);
                }
                return status;
            } else if ( channel_op_status::full == status) {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( ! is_full_() ) {
                    continue;
                }
                ctx->wait_link( waiting_producers_);
                // suspend this producer
                ctx->suspend( lk);
            } else {
                BOOST_ASSERT( channel_op_status::closed == status);
                return status;
            }
        }
    }

    channel_op_status push( value_type && value) {
        context * ctx{ context::active() };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            channel_op_status status{ try_push_( std::move( value) ) };
            if ( channel_op_status::success == status) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    lk.unlock();
                    ctx->set_ready( consumer_ctx);
                }
                return status;
            } else if ( channel_op_status::full == status) {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( ! is_full_() ) {
                    continue;
                }
                ctx->wait_link( waiting_producers_);
                // suspend this producer
                ctx->suspend( lk);
            } else {
                BOOST_ASSERT( channel_op_status::closed == status);
                return status;
            }
        }
    }

    template< typename Rep, typename Period >
    channel_op_status push_wait_for( value_type const& value,
                                     std::chrono::duration< Rep, Period > const& timeout_duration) {
        return push_wait_until( value,
                                std::chrono::steady_clock::now() + timeout_duration);
    }

    template< typename Rep, typename Period >
    channel_op_status push_wait_for( value_type && value,
                                     std::chrono::duration< Rep, Period > const& timeout_duration) {
        return push_wait_until( std::forward< value_type >( value),
                                std::chrono::steady_clock::now() + timeout_duration);
    }

    template< typename Clock, typename Duration >
    channel_op_status push_wait_until( value_type const& value,
                                       std::chrono::time_point< Clock, Duration > const& timeout_time_) {
        std::chrono::steady_clock::time_point timeout_time( detail::convert( timeout_time_) );
        context * ctx{ context::active() };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            channel_op_status status{ try_push_( value) };
            if ( channel_op_status::success == status) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    lk.unlock();
                    ctx->set_ready( consumer_ctx);
                }
                return status;
            } else if ( channel_op_status::full == status) {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( ! is_full_() ) {
                    continue;
                }
                ctx->wait_link( waiting_producers_);
                // suspend this producer
                if ( ! ctx->wait_until( timeout_time, lk) ) {
                    // relock local lk
                    lk.lock();
                    // remove from waiting-queue
                    ctx->wait_unlink();
                    return channel_op_status::timeout;
                }
            } else {
                BOOST_ASSERT( channel_op_status::closed == status);
                return status;
            }
        }
    }

    template< typename Clock, typename Duration >
    channel_op_status push_wait_until( value_type && value,
                                       std::chrono::time_point< Clock, Duration > const& timeout_time_) {
        std::chrono::steady_clock::time_point timeout_time( detail::convert( timeout_time_) );
        context * ctx{ context::active() };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            channel_op_status status{ try_push_( std::move( value) ) };
            if ( channel_op_status::success == status) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    lk.unlock();
                    ctx->set_ready( consumer_ctx);
                }
                return status;
            } else if ( channel_op_status::full == status) {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( ! is_full_() ) {
                    continue;
                }
                ctx->wait_link( waiting_producers_);
                // suspend this producer
                if ( ! ctx->wait_until( timeout_time, lk) ) {
                    // relock local lk
                    lk.lock();
                    // remove from waiting-queue
                    ctx->wait_unlink();
                    return channel_op_status::timeout;
                }
            } else {
                BOOST_ASSERT( channel_op_status::closed == status);
                return status;
            }
        }
    }

    channel_op_status try_pop( value_type & value) {
        channel_op_status status{ try_pop_( value) };
        if ( channel_op_status::success != status) {
            if ( is_closed() ) {
                status = channel_op_status::closed;
            }
        }
        return status;
    }

    channel_op_status pop( value_type & value) {
        context * ctx{ context::active() };
        for (;;) {
            channel_op_status status{ try_pop_( value) };
            if ( channel_op_status::success == status) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting producer
                if ( ! waiting_producers_.empty() ) {
                    context * producer_ctx{ & waiting_producers_.front() };
                    waiting_producers_.pop_front();
                    lk.unlock();
                    ctx->set_ready( producer_ctx);
                }
                return status;
            } else if ( channel_op_status::empty == status) {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( ! is_empty_() ) {
                    continue;
                }
                ctx->wait_link( waiting_consumers_);
                // suspend this consumer
                ctx->suspend( lk);
            } else {
                BOOST_ASSERT( channel_op_status::closed == status);
                return status;
            }
        }
    }

    value_type value_pop() {
        context * ctx{ context::active() };
        for (;;) {
            slot * s{ nullptr };
            std::size_t idx{ 0 };
            channel_op_status status{ try_value_pop_( s, idx) };
            if ( channel_op_status::success == status) {
                value_type value{ std::move( * reinterpret_cast< value_type * >( std::addressof( s->storage) ) ) };
                s->cycle.store( idx + capacity_, std::memory_order_release);
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting producer
                if ( ! waiting_producers_.empty() ) {
                    context * producer_ctx{ & waiting_producers_.front() };
                    waiting_producers_.pop_front();
                    lk.unlock();
                    ctx->set_ready( producer_ctx);
                }
                return std::move( value);
            } else if ( channel_op_status::empty == status) {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    throw fiber_error{
                            std::make_error_code( std::errc::operation_not_permitted),
                            "boost fiber: channel is closed" };
                }
                if ( ! is_empty_() ) {
                    continue;
                }
                ctx->wait_link( waiting_consumers_);
                // suspend this consumer
                ctx->suspend( lk);
            } else {
                BOOST_ASSERT( channel_op_status::closed == status);
                throw fiber_error{
                        std::make_error_code( std::errc::operation_not_permitted),
                        "boost fiber: channel is closed" };
            }
        }
    }

    template< typename Rep, typename Period >
    channel_op_status pop_wait_for( value_type & value,
                                    std::chrono::duration< Rep, Period > const& timeout_duration) {
        return pop_wait_until( value,
                               std::chrono::steady_clock::now() + timeout_duration);
    }

    template< typename Clock, typename Duration >
    channel_op_status pop_wait_until( value_type & value,
                                      std::chrono::time_point< Clock, Duration > const& timeout_time_) {
        std::chrono::steady_clock::time_point timeout_time( detail::convert( timeout_time_) );
        context * ctx{ context::active() };
        for (;;) {
            channel_op_status status{ try_pop_( value) };
            if ( channel_op_status::success == status) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting producer
                if ( ! waiting_producers_.empty() ) {
                    context * producer_ctx{ & waiting_producers_.front() };
                    waiting_producers_.pop_front();
                    lk.unlock();
                    context::active()->set_ready( producer_ctx);
                }
                return status;
            } else if ( channel_op_status::empty == status) {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( ! is_empty_() ) {
                    continue;
                }
                ctx->wait_link( waiting_consumers_);
                // suspend this consumer
                if ( ! ctx->wait_until( timeout_time, lk) ) {
                    // relock local lk
                    lk.lock();
                    // remove from waiting-queue
                    ctx->wait_unlink();
                    return channel_op_status::timeout;
                }
            } else {
                BOOST_ASSERT( channel_op_status::closed == status);
                return status;
            }
        }
    }

    class iterator : public std::iterator< std::input_iterator_tag, typename std::remove_reference< value_type >::type > {
    private:
        typedef typename std::aligned_storage< sizeof( value_type), alignof( value_type) >::type  storage_type;

        buffered_channel *   chan_{ nullptr };
        storage_type        storage_;

        void increment_() {
            BOOST_ASSERT( nullptr != chan_);
            try {
                ::new ( static_cast< void * >( std::addressof( storage_) ) ) value_type{ chan_->value_pop() };
            } catch ( fiber_error const&) {
                chan_ = nullptr;
            }
        }

    public:
        typedef typename iterator::pointer pointer_t;
        typedef typename iterator::reference reference_t;

        iterator() noexcept = default;

        explicit iterator( buffered_channel< T > * chan) noexcept :
            chan_{ chan } {
            increment_();
        }

        iterator( iterator const& other) noexcept :
            chan_{ other.chan_ } {
        }

        iterator & operator=( iterator const& other) noexcept {
            if ( this == & other) return * this;
            chan_ = other.chan_;
            return * this;
        }

        bool operator==( iterator const& other) const noexcept {
            return other.chan_ == chan_;
        }

        bool operator!=( iterator const& other) const noexcept {
            return other.chan_ != chan_;
        }

        iterator & operator++() {
            increment_();
            return * this;
        }

        iterator operator++( int) = delete;

        reference_t operator*() noexcept {
            return * reinterpret_cast< value_type * >( std::addressof( storage_) );
        }

        pointer_t operator->() noexcept {
            return reinterpret_cast< value_type * >( std::addressof( storage_) );
        }
    };

    friend class iterator;
};

template< typename T >
typename buffered_channel< T >::iterator
begin( buffered_channel< T > & chan) {
    return typename buffered_channel< T >::iterator( & chan);
}

template< typename T >
typename buffered_channel< T >::iterator
end( buffered_channel< T > &) {
    return typename buffered_channel< T >::iterator();
}

}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_BUFFERED_CHANNEL_H
