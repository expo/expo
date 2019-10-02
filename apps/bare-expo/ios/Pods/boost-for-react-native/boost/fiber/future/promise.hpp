
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_PROMISE_HPP
#define BOOST_FIBERS_PROMISE_HPP

#include <algorithm>
#include <memory>
#include <utility>

#include <boost/config.hpp>

#include <boost/fiber/detail/convert.hpp>
#include <boost/fiber/exceptions.hpp>
#include <boost/fiber/future/detail/shared_state.hpp>
#include <boost/fiber/future/detail/shared_state_object.hpp>
#include <boost/fiber/future/future.hpp>

namespace boost {
namespace fibers {
namespace detail {

template< typename R >
struct promise_base {
    typedef typename shared_state< R >::ptr_t   ptr_t;

    bool            obtained_{ false };
    ptr_t           future_{};

    promise_base() :
        promise_base{ std::allocator_arg, std::allocator< promise_base >{} } {
    }

    template< typename Allocator >
    promise_base( std::allocator_arg_t, Allocator alloc) {
        typedef detail::shared_state_object< R, Allocator >  object_t;
        typedef std::allocator_traits< typename object_t::allocator_t > traits_t;
        typename object_t::allocator_t a{ alloc };
        typename traits_t::pointer ptr{ traits_t::allocate( a, 1) };

        try {
            traits_t::construct( a, ptr, a);
        } catch (...) {
            traits_t::deallocate( a, ptr, 1);
            throw;
        }
        future_.reset( convert( ptr) );
    }

    ~promise_base() {
        if ( future_) {
            future_->owner_destroyed();
        }
    }

    promise_base( promise_base const&) = delete;
    promise_base & operator=( promise_base const&) = delete;

    promise_base( promise_base && other) noexcept :
        obtained_{ other.obtained_ },
        future_{ std::move( other.future_) } {
        other.obtained_ = false;
    }

    promise_base & operator=( promise_base && other) noexcept {
        if ( this == & other) return * this;
        promise_base tmp{ std::move( other) };
        swap( tmp);
        return * this;
    }

    future< R > get_future() {
        if ( obtained_) {
            throw future_already_retrieved{};
        }
        if ( ! future_) {
            throw promise_uninitialized{};
        }
        obtained_ = true;
        return future< R >{ future_ };
    }

    void swap( promise_base & other) noexcept {
        std::swap( obtained_, other.obtained_);
        future_.swap( other.future_);
    }

    void set_exception( std::exception_ptr p) {
        if ( ! future_) {
            throw promise_uninitialized{};
        }
        future_->set_exception( p);
    }
};

}

template< typename R >
class promise : private detail::promise_base< R > {
private:
    typedef detail::promise_base< R >  base_t;

public:
    promise() = default;

    template< typename Allocator >
    promise( std::allocator_arg_t, Allocator alloc) :
        base_t{ std::allocator_arg, alloc } {
    }

    promise( promise const&) = delete;
    promise & operator=( promise const&) = delete;

    promise( promise && other) noexcept = default;
    promise & operator=( promise && other) = default;

    void set_value( R const& value) {
        if ( ! base_t::future_) {
            throw promise_uninitialized{};
        }
        base_t::future_->set_value( value);
    }

    void set_value( R && value) {
        if ( ! base_t::future_) {
            throw promise_uninitialized{};
        }
        base_t::future_->set_value( std::move( value) );
    }

    void swap( promise & other) noexcept {
        base_t::swap( other);
    }

    using base_t::get_future;
    using base_t::set_exception;
};

template< typename R >
class promise< R & > : private detail::promise_base< R & > {
private:
    typedef detail::promise_base< R & >  base_t;

public:
    promise() = default;

    template< typename Allocator >
    promise( std::allocator_arg_t, Allocator alloc) :
        base_t{ std::allocator_arg, alloc } {
    }

    promise( promise const&) = delete;
    promise & operator=( promise const&) = delete;

    promise( promise && other) noexcept = default;
    promise & operator=( promise && other) noexcept = default;

    void set_value( R & value) {
        if ( ! base_t::future_) {
            throw promise_uninitialized{};
        }
        base_t::future_->set_value( value);
    }

    void swap( promise & other) noexcept {
        base_t::swap( other);
    }

    using base_t::get_future;
    using base_t::set_exception;
};

template<>
class promise< void > : private detail::promise_base< void > {
private:
    typedef detail::promise_base< void >  base_t;

public:
    promise() = default;

    template< typename Allocator >
    promise( std::allocator_arg_t, Allocator alloc) :
        base_t{ std::allocator_arg, alloc } {
    }

    promise( promise const&) = delete;
    promise & operator=( promise const&) = delete;

    promise( promise && other) noexcept = default;
    promise & operator=( promise && other) noexcept = default;

    inline
    void set_value() {
        if ( ! base_t::future_) {
            throw promise_uninitialized{};
        }
        base_t::future_->set_value();
    }

    inline
    void swap( promise & other) noexcept {
        base_t::swap( other);
    }

    using base_t::get_future;
    using base_t::set_exception;
};

template< typename R >
void swap( promise< R > & l, promise< R > & r) noexcept {
    l.swap( r);
}

}}

#endif // BOOST_FIBERS_PROMISE_HPP
