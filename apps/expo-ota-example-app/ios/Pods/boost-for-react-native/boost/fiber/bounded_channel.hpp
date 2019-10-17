
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_FIBERS_BOUNDED_CHANNEL_H
#define BOOST_FIBERS_BOUNDED_CHANNEL_H

#warn "template bounded_channel is deprecated"

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cstddef>
#include <memory>
#include <mutex>
#include <system_error>
#include <utility>

#include <boost/config.hpp>
#include <boost/intrusive_ptr.hpp>

#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/exceptions.hpp>
#include <boost/fiber/exceptions.hpp>
#include <boost/fiber/condition_variable.hpp>
#include <boost/fiber/mutex.hpp>
#include <boost/fiber/channel_op_status.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {

template< typename T,
          typename Allocator = std::allocator< T >
>
class bounded_channel {
public:
    typedef T   value_type;

private:
    struct node {
        typedef intrusive_ptr< node >                   ptr_t;
        typedef typename std::allocator_traits< Allocator >::template rebind_alloc<
            node
        >                                               allocator_t;
        typedef std::allocator_traits< allocator_t >    allocator_traits_t;

#if ! defined(BOOST_FIBERS_NO_ATOMICS)
        std::atomic< std::size_t >  use_count{ 0 };
#else
        std::size_t                 use_count{ 0 };
#endif
        allocator_t                 alloc;
        T                           va;
        ptr_t                       nxt{};

        node( T const& t, allocator_t const& alloc_) noexcept :
            alloc{ alloc_ },
            va{ t } {
        }

        node( T && t, allocator_t & alloc_) noexcept :
            alloc{ alloc_ },
            va{ std::move( t) } {
        }

        friend
        void intrusive_ptr_add_ref( node * p) noexcept {
            ++p->use_count;
        }

        friend
        void intrusive_ptr_release( node * p) noexcept {
            if ( 0 == --p->use_count) {
                allocator_t alloc( p->alloc);
                allocator_traits_t::destroy( alloc, p);
                allocator_traits_t::deallocate( alloc, p, 1);
            }
        }
    };

    using ptr_t = typename node::ptr_t;
    using allocator_t = typename node::allocator_t;
    using allocator_traits_t = typename node::allocator_traits_t;

    enum class queue_status {
        open = 0,
        closed
    };

    allocator_t         alloc_;
    queue_status        state_{ queue_status::open };
    std::size_t         count_{ 0 };
    ptr_t               head_{};
    ptr_t           *   tail_;
    mutable mutex       mtx_{};
    condition_variable  not_empty_cond_{};
    condition_variable  not_full_cond_{};
    std::size_t         hwm_;
    std::size_t         lwm_;

    bool is_closed_() const noexcept {
        return queue_status::closed == state_;
    }

    void close_( std::unique_lock< boost::fibers::mutex > & lk) noexcept {
        state_ = queue_status::closed;
        lk.unlock();
        not_empty_cond_.notify_all();
        not_full_cond_.notify_all();
    }

    std::size_t size_() const noexcept {
        return count_;
    }

    bool is_empty_() const noexcept {
        return ! head_;
    }

    bool is_full_() const noexcept {
        return count_ >= hwm_;
    }

    channel_op_status push_( ptr_t new_node,
                             std::unique_lock< boost::fibers::mutex > & lk) {
        if ( is_closed_() ) {
            return channel_op_status::closed;
        }
        not_full_cond_.wait( lk,
                             [this](){
                                return ! is_full_();
                             });
        return push_and_notify_( new_node, lk);
    }

    channel_op_status try_push_( ptr_t new_node,
                                 std::unique_lock< boost::fibers::mutex > & lk) noexcept {
        if ( is_closed_() ) {
            return channel_op_status::closed;
        }
        if ( is_full_() ) {
            return channel_op_status::full;
        }
        return push_and_notify_( new_node, lk);
    }

    template< typename Clock, typename Duration >
    channel_op_status push_wait_until_( ptr_t new_node,
                                        std::chrono::time_point< Clock, Duration > const& timeout_time,
                                        std::unique_lock< boost::fibers::mutex > & lk) {
        if ( is_closed_() ) {
            return channel_op_status::closed;
        }
        if ( ! not_full_cond_.wait_until( lk, timeout_time,
                                          [this](){
                                               return ! is_full_();
                                          })) {
            return channel_op_status::timeout;
        }
        return push_and_notify_( new_node, lk);
    }

    channel_op_status push_and_notify_( ptr_t new_node,
                                        std::unique_lock< boost::fibers::mutex > & lk) noexcept {
        push_tail_( new_node);
        lk.unlock();
        not_empty_cond_.notify_one();
        return channel_op_status::success;
    }

    void push_tail_( ptr_t new_node) noexcept {
        * tail_ = new_node;
        tail_ = & new_node->nxt;
        ++count_;
    }

    value_type value_pop_( std::unique_lock< boost::fibers::mutex > & lk) {
        BOOST_ASSERT( ! is_empty_() );
        auto old_head = pop_head_();
        if ( size_() <= lwm_) {
            if ( lwm_ == hwm_) {
                lk.unlock();
                not_full_cond_.notify_one();
            } else {
                lk.unlock();
                // more than one producer could be waiting
                // to push a value
                not_full_cond_.notify_all();
            }
        }
        return std::move( old_head->va);
    }

    ptr_t pop_head_() noexcept {
        auto old_head = head_;
        head_ = old_head->nxt;
        if ( ! head_) {
            tail_ = & head_;
        }
        old_head->nxt.reset();
        --count_;
        return old_head;
    }

public:
    bounded_channel( std::size_t hwm, std::size_t lwm,
                     Allocator const& alloc = Allocator() ) :
        alloc_{ alloc },
        tail_{ & head_ },
        hwm_{ hwm },
        lwm_{ lwm } {
        if ( hwm_ <= lwm_) {
            throw fiber_error( std::make_error_code( std::errc::invalid_argument),
                               "boost fiber: high-watermark is less than or equal to low-watermark for bounded_channel");
        }
        if ( 0 == hwm) {
            throw fiber_error( std::make_error_code( std::errc::invalid_argument),
                               "boost fiber: high-watermark is zero");
        }
    }

    bounded_channel( std::size_t wm,
                     Allocator const& alloc = Allocator() ) :
        alloc_{ alloc },
        tail_{ & head_ },
        hwm_{ wm },
        lwm_{ wm - 1 } {
        if ( 0 == wm) {
            throw fiber_error( std::make_error_code( std::errc::invalid_argument),
                               "boost fiber: watermark is zero");
        }
    }

    bounded_channel( bounded_channel const&) = delete;
    bounded_channel & operator=( bounded_channel const&) = delete;

    std::size_t upper_bound() const noexcept {
        return hwm_;
    }

    std::size_t lower_bound() const noexcept {
        return lwm_;
    }

    void close() noexcept {
        std::unique_lock< mutex > lk( mtx_);
        close_( lk);
    }

    channel_op_status push( value_type const& va) {
        typename allocator_traits_t::pointer ptr{
            allocator_traits_t::allocate( alloc_, 1) };
        try {
            allocator_traits_t::construct( alloc_, ptr, va, alloc_);
        } catch (...) {
            allocator_traits_t::deallocate( alloc_, ptr, 1);
            throw;
        }
        std::unique_lock< mutex > lk( mtx_);
        return push_( { detail::convert( ptr) }, lk);
    }

    channel_op_status push( value_type && va) {
        typename allocator_traits_t::pointer ptr{
            allocator_traits_t::allocate( alloc_, 1) };
        try {
            allocator_traits_t::construct(
                    alloc_, ptr, std::move( va), alloc_);
        } catch (...) {
            allocator_traits_t::deallocate( alloc_, ptr, 1);
            throw;
        }
        std::unique_lock< mutex > lk( mtx_);
        return push_( { detail::convert( ptr) }, lk);
    }

    template< typename Rep, typename Period >
    channel_op_status push_wait_for( value_type const& va,
                                     std::chrono::duration< Rep, Period > const& timeout_duration) {
        return push_wait_until( va,
                                std::chrono::steady_clock::now() + timeout_duration);
    }

    template< typename Rep, typename Period >
    channel_op_status push_wait_for( value_type && va,
                                     std::chrono::duration< Rep, Period > const& timeout_duration) {
        return push_wait_until( std::forward< value_type >( va),
                                std::chrono::steady_clock::now() + timeout_duration);
    }

    template< typename Clock, typename Duration >
    channel_op_status push_wait_until( value_type const& va,
                                       std::chrono::time_point< Clock, Duration > const& timeout_time) {
        typename allocator_traits_t::pointer ptr{
            allocator_traits_t::allocate( alloc_, 1) };
        try {
            allocator_traits_t::construct( alloc_, ptr, va, alloc_);
        } catch (...) {
            allocator_traits_t::deallocate( alloc_, ptr, 1);
            throw;
        }
        std::unique_lock< mutex > lk( mtx_);
        return push_wait_until_( { detail::convert( ptr) }, timeout_time, lk);
    }

    template< typename Clock, typename Duration >
    channel_op_status push_wait_until( value_type && va,
                                       std::chrono::time_point< Clock, Duration > const& timeout_time) {
        typename allocator_traits_t::pointer ptr{
            allocator_traits_t::allocate( alloc_, 1) };
        try {
            allocator_traits_t::construct(
                    alloc_, ptr, std::move( va), alloc_);
        } catch (...) {
            allocator_traits_t::deallocate( alloc_, ptr, 1);
            throw;
        }
        std::unique_lock< mutex > lk( mtx_);
        return push_wait_until_( { detail::convert( ptr) }, timeout_time, lk);
    }

    channel_op_status try_push( value_type const& va) {
        typename allocator_traits_t::pointer ptr{
            allocator_traits_t::allocate( alloc_, 1) };
        try {
            allocator_traits_t::construct( alloc_, ptr, va, alloc_);
        } catch (...) {
            allocator_traits_t::deallocate( alloc_, ptr, 1);
            throw;
        }
        std::unique_lock< mutex > lk( mtx_);
        return try_push_( { detail::convert( ptr) }, lk);
    }

    channel_op_status try_push( value_type && va) {
        typename allocator_traits_t::pointer ptr{
            allocator_traits_t::allocate( alloc_, 1) };
        try {
            allocator_traits_t::construct(
                    alloc_, ptr, std::move( va), alloc_);
        } catch (...) {
            allocator_traits_t::deallocate( alloc_, ptr, 1);
            throw;
        }
        std::unique_lock< mutex > lk( mtx_);
        return try_push_( { detail::convert( ptr) }, lk);
    }

    channel_op_status pop( value_type & va) {
        std::unique_lock< mutex > lk( mtx_);
        not_empty_cond_.wait( lk,
                              [this](){
                                return is_closed_() || ! is_empty_();
                              });
        if ( is_closed_() && is_empty_() ) {
            return channel_op_status::closed;
        }
        va = value_pop_( lk);
        return channel_op_status::success;
    }

    value_type value_pop() {
        std::unique_lock< mutex > lk( mtx_);
        not_empty_cond_.wait( lk,
                              [this](){
                                return is_closed_() || ! is_empty_();
                              });
        if ( is_closed_() && is_empty_() ) {
            throw fiber_error(
                    std::make_error_code( std::errc::operation_not_permitted),
                    "boost fiber: queue is closed");
        }
        return value_pop_( lk);
    }

    channel_op_status try_pop( value_type & va) {
        std::unique_lock< mutex > lk( mtx_);
        if ( is_closed_() && is_empty_() ) {
            // let other fibers run
            lk.unlock();
            this_fiber::yield();
            return channel_op_status::closed;
        }
        if ( is_empty_() ) {
            // let other fibers run
            lk.unlock();
            this_fiber::yield();
            return channel_op_status::empty;
        }
        va = value_pop_( lk);
        return channel_op_status::success;
    }

    template< typename Rep, typename Period >
    channel_op_status pop_wait_for( value_type & va,
                                    std::chrono::duration< Rep, Period > const& timeout_duration) {
        return pop_wait_until( va,
                               std::chrono::steady_clock::now() + timeout_duration);
    }

    template< typename Clock, typename Duration >
    channel_op_status pop_wait_until( value_type & va,
                                      std::chrono::time_point< Clock, Duration > const& timeout_time) {
        std::unique_lock< mutex > lk( mtx_);
        if ( ! not_empty_cond_.wait_until( lk,
                                           timeout_time,
                                           [this](){
                                                return is_closed_() || ! is_empty_();
                                           })) {
            return channel_op_status::timeout;
        }
        if ( is_closed_() && is_empty_() ) {
            return channel_op_status::closed;
        }
        va = value_pop_( lk);
        return channel_op_status::success;
    }
};

}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_BOUNDED_CHANNEL_H
