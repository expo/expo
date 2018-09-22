
//          Copyright Oliver Kowalke 2016.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_UNBUFFERED_CHANNEL_H
#define BOOST_FIBERS_UNBUFFERED_CHANNEL_H

#include <atomic>
#include <chrono>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <vector>

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
class unbuffered_channel {
public:
    typedef T   value_type;

private:
    typedef context::wait_queue_t   wait_queue_type;

    struct alignas(cache_alignment) slot {
        value_type  value;
        context *   ctx;

        slot( value_type const& value_, context * ctx_) :
            value{ value_ },
            ctx{ ctx_ } {
        }

        slot( value_type && value_, context * ctx_) :
            value{ std::move( value_) },
            ctx{ ctx_ } {
        }
    };

    // shared cacheline
    alignas(cache_alignment) std::atomic< slot * >  slot_{ nullptr };
    // shared cacheline
    alignas(cache_alignment) std::atomic_bool       closed_{ false };
    mutable detail::spinlock                        splk_{};
    wait_queue_type                                 waiting_producers_{};
    wait_queue_type                                 waiting_consumers_{};
    char                                            pad_[cacheline_length];

    bool is_empty_() {
        return nullptr == slot_.load( std::memory_order_acquire);
    }

    bool try_push_( slot * own_slot) {
        for (;;) {
            slot * s{ slot_.load( std::memory_order_acquire) };
            if ( nullptr == s) {
                if ( ! slot_.compare_exchange_strong( s, own_slot, std::memory_order_acq_rel) ) {
                    continue;
                }
                return true;
            } else {
                return false;
            }
        }
    }

    slot * try_pop_() {
        slot * nil_slot{ nullptr };
        for (;;) {
            slot * s{ slot_.load( std::memory_order_acquire) };
            if ( nullptr != s) {
                if ( ! slot_.compare_exchange_strong( s, nil_slot, std::memory_order_acq_rel) ) {
                    continue;}
            }
            return s;
        }
    }

public:
    unbuffered_channel() = default;

    ~unbuffered_channel() {
        close();
        slot * s{ nullptr };
        if ( nullptr != ( s = try_pop_() ) ) {
            BOOST_ASSERT( nullptr != s);
            BOOST_ASSERT( nullptr != s->ctx);
            // value will be destructed in the context of the waiting fiber
            context::active()->set_ready( s->ctx);
        }
    }

    unbuffered_channel( unbuffered_channel const&) = delete;
    unbuffered_channel & operator=( unbuffered_channel const&) = delete;

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

    channel_op_status push( value_type const& value) {
        context * ctx{ context::active() };
        slot s{ value, ctx };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            if ( try_push_( & s) ) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    ctx->set_ready( consumer_ctx);
                }
                // suspend till value has been consumed
                ctx->suspend( lk);
                // resumed, value has been consumed
                return channel_op_status::success;
            } else {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( is_empty_() ) {
                    continue;
                }
                ctx->wait_link( waiting_producers_);
                // suspend this producer
                ctx->suspend( lk);
                // resumed, slot mabye free
            }
        }
    }

    channel_op_status push( value_type && value) {
        context * ctx{ context::active() };
        slot s{ std::move( value), ctx };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            if ( try_push_( & s) ) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    ctx->set_ready( consumer_ctx);
                }
                // suspend till value has been consumed
                ctx->suspend( lk);
                // resumed, value has been consumed
                return channel_op_status::success;
            } else {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( is_empty_() ) {
                    continue;
                }
                ctx->wait_link( waiting_producers_);
                // suspend this producer
                ctx->suspend( lk);
                // resumed, slot mabye free
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
        slot s{ value, ctx };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            if ( try_push_( & s) ) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    ctx->set_ready( consumer_ctx);
                }
                // suspend this producer
                if ( ! ctx->wait_until( timeout_time, lk) ) {
                    // clear slot
                    slot * nil_slot{ nullptr }, * own_slot{ & s };
                    slot_.compare_exchange_strong( own_slot, nil_slot, std::memory_order_acq_rel);
                    // relock local lk
                    lk.lock();
                    // remove from waiting-queue
                    ctx->wait_unlink();
                    // resumed, value has not been consumed
                    return channel_op_status::timeout;
                }
                // resumed, value has been consumed
                return channel_op_status::success;
            } else {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( is_empty_() ) {
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
                // resumed, slot maybe free
            }
        }
    }

    template< typename Clock, typename Duration >
    channel_op_status push_wait_until( value_type && value,
                                       std::chrono::time_point< Clock, Duration > const& timeout_time_) {
        std::chrono::steady_clock::time_point timeout_time( detail::convert( timeout_time_) );
        context * ctx{ context::active() };
        slot s{ std::move( value), ctx };
        for (;;) {
            if ( is_closed() ) {
                return channel_op_status::closed;
            }
            if ( try_push_( & s) ) {
                detail::spinlock_lock lk{ splk_ };
                // notify one waiting consumer
                if ( ! waiting_consumers_.empty() ) {
                    context * consumer_ctx{ & waiting_consumers_.front() };
                    waiting_consumers_.pop_front();
                    ctx->set_ready( consumer_ctx);
                }
                // suspend this producer
                if ( ! ctx->wait_until( timeout_time, lk) ) {
                    // clear slot
                    slot * nil_slot{ nullptr }, * own_slot{ & s };
                    slot_.compare_exchange_strong( own_slot, nil_slot, std::memory_order_acq_rel);
                    // relock local lk
                    lk.lock();
                    // remove from waiting-queue
                    ctx->wait_unlink();
                    // resumed, value has not been consumed
                    return channel_op_status::timeout;
                }
                // resumed, value has been consumed
                return channel_op_status::success;
            } else {
                BOOST_ASSERT( ! ctx->wait_is_linked() );
                detail::spinlock_lock lk{ splk_ };
                if ( is_closed() ) {
                    return channel_op_status::closed;
                }
                if ( is_empty_() ) {
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
                // resumed, slot maybe free
            }
        }
    }

    channel_op_status pop( value_type & value) {
        context * ctx{ context::active() };
        slot * s{ nullptr };
        for (;;) {
            if ( nullptr != ( s = try_pop_() ) ) {
                {
                    detail::spinlock_lock lk{ splk_ };
                    // notify one waiting producer
                    if ( ! waiting_producers_.empty() ) {
                        context * producer_ctx{ & waiting_producers_.front() };
                        waiting_producers_.pop_front();
                        lk.unlock();
                        ctx->set_ready( producer_ctx);
                    }
                }
                // consume value
                value = std::move( s->value);
                // resume suspended producer
                ctx->set_ready( s->ctx);
                return channel_op_status::success;
            } else {
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
                // resumed, slot mabye set
            }
        }
    }

    value_type value_pop() {
        context * ctx{ context::active() };
        slot * s{ nullptr };
        for (;;) {
            if ( nullptr != ( s = try_pop_() ) ) {
                {
                    detail::spinlock_lock lk{ splk_ };
                    // notify one waiting producer
                    if ( ! waiting_producers_.empty() ) {
                        context * producer_ctx{ & waiting_producers_.front() };
                        waiting_producers_.pop_front();
                        lk.unlock();
                        ctx->set_ready( producer_ctx);
                    }
                }
                // consume value
                value_type value{ std::move( s->value) };
                // resume suspended producer
                ctx->set_ready( s->ctx);
                return std::move( value);
            } else {
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
                // resumed, slot mabye set
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
        slot * s{ nullptr };
        for (;;) {
            if ( nullptr != ( s = try_pop_() ) ) {
                {
                    detail::spinlock_lock lk{ splk_ };
                    // notify one waiting producer
                    if ( ! waiting_producers_.empty() ) {
                        context * producer_ctx{ & waiting_producers_.front() };
                        waiting_producers_.pop_front();
                        lk.unlock();
                        ctx->set_ready( producer_ctx);
                    }
                }
                // consume value
                value = std::move( s->value);
                // resume suspended producer
                ctx->set_ready( s->ctx);
                return channel_op_status::success;
            } else {
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
            }
        }
    }

    class iterator : public std::iterator< std::input_iterator_tag, typename std::remove_reference< value_type >::type > {
    private:
        typedef typename std::aligned_storage< sizeof( value_type), alignof( value_type) >::type  storage_type;

        unbuffered_channel *   chan_{ nullptr };
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

        explicit iterator( unbuffered_channel< T > * chan) noexcept :
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
typename unbuffered_channel< T >::iterator
begin( unbuffered_channel< T > & chan) {
    return typename unbuffered_channel< T >::iterator( & chan);
}

template< typename T >
typename unbuffered_channel< T >::iterator
end( unbuffered_channel< T > &) {
    return typename unbuffered_channel< T >::iterator();
}

}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_UNBUFFERED_CHANNEL_H
