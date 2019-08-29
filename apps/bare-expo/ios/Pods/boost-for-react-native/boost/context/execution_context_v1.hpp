
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_CONTEXT_EXECUTION_CONTEXT_H
#define BOOST_CONTEXT_EXECUTION_CONTEXT_H

#include <boost/context/detail/config.hpp>

#include <algorithm>
#include <atomic>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <functional>
#include <memory>
#include <ostream>
#include <tuple>
#include <utility>

#include <boost/assert.hpp>
#include <boost/config.hpp>
#include <boost/intrusive_ptr.hpp>

#if defined(BOOST_NO_CXX17_STD_APPLY)
#include <boost/context/detail/apply.hpp>
#endif
#include <boost/context/detail/disable_overload.hpp>
#include <boost/context/detail/fcontext.hpp>
#include <boost/context/fixedsize_stack.hpp>
#include <boost/context/flags.hpp>
#include <boost/context/preallocated.hpp>
#include <boost/context/segmented_stack.hpp>
#include <boost/context/stack_context.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_PREFIX
#endif

#if defined(BOOST_USE_SEGMENTED_STACKS)
extern "C" {
void __splitstack_getcontext( void * [BOOST_CONTEXT_SEGMENTS]);
void __splitstack_setcontext( void * [BOOST_CONTEXT_SEGMENTS]);
}
#endif

namespace boost {
namespace context {
namespace detail {

template< typename Fn >
transfer_t context_ontop( transfer_t);

struct activation_record;

struct data_t {
    activation_record   *   from;
    void                *   data;
};

struct activation_record {
    typedef boost::intrusive_ptr< activation_record >    ptr_t;

    thread_local static ptr_t   current_rec;

    std::atomic< std::size_t >  use_count{ 0 };
    fcontext_t                  fctx{ nullptr };
    stack_context               sctx{};
    bool                        main_ctx{ true };

    // used for toplevel-context
    // (e.g. main context, thread-entry context)
    constexpr activation_record() = default;

    activation_record( fcontext_t fctx_, stack_context sctx_) noexcept :
        fctx{ fctx_ },
        sctx( sctx_ ), // sctx{ sctx_ } - clang-3.6: no viable conversion from 'boost::context::stack_context' to 'std::size_t'
        main_ctx{ false } {
    } 

    virtual ~activation_record() = default;

    bool is_main_context() const noexcept {
        return main_ctx;
    }

    void * resume( void * vp) {
        // store current activation record in local variable
        auto from = current_rec.get();
        // store `this` in static, thread local pointer
        // `this` will become the active (running) context
        // returned by execution_context::current()
        current_rec = this;
#if defined(BOOST_USE_SEGMENTED_STACKS)
        // adjust segmented stack properties
        __splitstack_getcontext( from->sctx.segments_ctx);
        __splitstack_setcontext( sctx.segments_ctx);
#endif
        data_t d = { from, vp };
        // context switch from parent context to `this`-context
        transfer_t t = jump_fcontext( fctx, & d);
        data_t * dp = reinterpret_cast< data_t * >( t.data);
        dp->from->fctx = t.fctx;
        // parent context resumed
        return dp->data;
    }

    template< typename Fn >
    void * resume_ontop( void *  data, Fn && fn) {
        // store current activation record in local variable
        activation_record * from = current_rec.get();
        // store `this` in static, thread local pointer
        // `this` will become the active (running) context
        // returned by execution_context::current()
        current_rec = this;
#if defined(BOOST_USE_SEGMENTED_STACKS)
        // adjust segmented stack properties
        __splitstack_getcontext( from->sctx.segments_ctx);
        __splitstack_setcontext( sctx.segments_ctx);
#endif
        std::tuple< void *, Fn > p = std::forward_as_tuple( data, fn);
        data_t d = { from, & p };
        // context switch from parent context to `this`-context
        // execute Fn( Tpl) on top of `this`
        transfer_t t = ontop_fcontext( fctx, & d, context_ontop< Fn >);
        data_t * dp = reinterpret_cast< data_t * >( t.data);
        dp->from->fctx = t.fctx;
        // parent context resumed
        return dp->data;
    }

    virtual void deallocate() noexcept {
    }

    friend void intrusive_ptr_add_ref( activation_record * ar) noexcept {
        ++ar->use_count;
    }

    friend void intrusive_ptr_release( activation_record * ar) noexcept {
        BOOST_ASSERT( nullptr != ar);
        if ( 0 == --ar->use_count) {
            ar->deallocate();
        }
    }
};

struct activation_record_initializer {
    activation_record_initializer() noexcept;
    ~activation_record_initializer();
};

template< typename Fn >
transfer_t context_ontop( transfer_t t) {
    data_t * dp = reinterpret_cast< data_t * >( t.data);
    dp->from->fctx = t.fctx;
    auto tpl = reinterpret_cast< std::tuple< void *, Fn > * >( dp->data);
    BOOST_ASSERT( nullptr != tpl);
    auto data = std::get< 0 >( * tpl);
    typename std::decay< Fn >::type fn = std::forward< Fn >( std::get< 1 >( * tpl) );
#if defined(BOOST_NO_CXX17_STD_APPLY)
    dp->data = apply( fn, std::tie( data) );
#else
    dp->data = std::apply( fn, std::tie( data) );
#endif
    return { t.fctx, dp };
}

template< typename StackAlloc, typename Fn, typename ... Args >
class capture_record : public activation_record {
private:
    StackAlloc                                          salloc_;
    typename std::decay< Fn >::type                     fn_;
    std::tuple< typename std::decay< Args >::type ... > args_;
    activation_record                               *   caller_;

    static void destroy( capture_record * p) noexcept {
        StackAlloc salloc = p->salloc_;
        stack_context sctx = p->sctx;
        // deallocate activation record
        p->~capture_record();
        // destroy stack with stack allocator
        salloc.deallocate( sctx);
    }

public:
    capture_record( stack_context sctx, StackAlloc const& salloc,
                    fcontext_t fctx,
                    activation_record * caller,
                    Fn && fn, Args && ... args) noexcept :
        activation_record{ fctx, sctx },
        salloc_{ salloc },
        fn_( std::forward< Fn >( fn) ),
        args_( std::forward< Args >( args) ... ),
        caller_{ caller } {
    }

    void deallocate() noexcept override final {
        destroy( this);
    }

    void run() {
        auto data = caller_->resume( nullptr);
#if defined(BOOST_NO_CXX17_STD_APPLY)
        apply( fn_, std::tuple_cat( args_, std::tie( data) ) );
#else
        std::apply( fn_, std::tuple_cat( args_, std::tie( data) ) );
#endif
        BOOST_ASSERT_MSG( ! main_ctx, "main-context does not execute activation-record::run()");
    }
};

}

class BOOST_CONTEXT_DECL execution_context {
private:
    // tampoline function
    // entered if the execution context
    // is resumed for the first time
    template< typename AR >
    static void entry_func( detail::transfer_t t) noexcept {
        detail::data_t * dp = reinterpret_cast< detail::data_t * >( t.data);
        AR * ar = static_cast< AR * >( dp->data);
        BOOST_ASSERT( nullptr != ar);
        dp->from->fctx = t.fctx;
        // start execution of toplevel context-function
        ar->run();
    }

    typedef boost::intrusive_ptr< detail::activation_record >    ptr_t;

    ptr_t   ptr_;

    template< typename StackAlloc, typename Fn, typename ... Args >
    static detail::activation_record * create_context( StackAlloc salloc,
                                                       Fn && fn, Args && ... args) {
        typedef detail::capture_record<
            StackAlloc, Fn, Args ...
        >                                           capture_t;

        auto sctx = salloc.allocate();
        // reserve space for control structure
#if defined(BOOST_NO_CXX11_CONSTEXPR) || defined(BOOST_NO_CXX11_STD_ALIGN)
        const std::size_t size = sctx.size - sizeof( capture_t);
        void * sp = static_cast< char * >( sctx.sp) - sizeof( capture_t);
#else
        constexpr std::size_t func_alignment = 64; // alignof( capture_t);
        constexpr std::size_t func_size = sizeof( capture_t);
        // reserve space on stack
        void * sp = static_cast< char * >( sctx.sp) - func_size - func_alignment;
        // align sp pointer
        std::size_t space = func_size + func_alignment;
        sp = std::align( func_alignment, func_size, sp, space);
        BOOST_ASSERT( nullptr != sp);
        // calculate remaining size
        const std::size_t size = sctx.size - ( static_cast< char * >( sctx.sp) - static_cast< char * >( sp) );
#endif
        // create fast-context
        const detail::fcontext_t fctx = detail::make_fcontext( sp, size, & execution_context::entry_func< capture_t >);
        BOOST_ASSERT( nullptr != fctx);
        // get current activation record
        auto curr = execution_context::current().ptr_;
        // placment new for control structure on fast-context stack
        return ::new ( sp) capture_t{
                sctx, salloc, fctx, curr.get(), std::forward< Fn >( fn), std::forward< Args >( args) ... };
    }

    template< typename StackAlloc, typename Fn, typename ... Args >
    static detail::activation_record * create_context( preallocated palloc, StackAlloc salloc,
                                                       Fn && fn, Args && ... args) {
        typedef detail::capture_record<
            StackAlloc, Fn, Args ...
        >                                           capture_t;

        // reserve space for control structure
#if defined(BOOST_NO_CXX11_CONSTEXPR) || defined(BOOST_NO_CXX11_STD_ALIGN)
        const std::size_t size = palloc.size - sizeof( capture_t);
        void * sp = static_cast< char * >( palloc.sp) - sizeof( capture_t);
#else
        constexpr std::size_t func_alignment = 64; // alignof( capture_t);
        constexpr std::size_t func_size = sizeof( capture_t);
        // reserve space on stack
        void * sp = static_cast< char * >( palloc.sp) - func_size - func_alignment;
        // align sp pointer
        std::size_t space = func_size + func_alignment;
        sp = std::align( func_alignment, func_size, sp, space);
        BOOST_ASSERT( nullptr != sp);
        // calculate remaining size
        const std::size_t size = palloc.size - ( static_cast< char * >( palloc.sp) - static_cast< char * >( sp) );
#endif
        // create fast-context
        const detail::fcontext_t fctx = detail::make_fcontext( sp, size, & execution_context::entry_func< capture_t >);
        BOOST_ASSERT( nullptr != fctx);
        // get current activation record
        auto curr = execution_context::current().ptr_;
        // placment new for control structure on fast-context stack
        return ::new ( sp) capture_t{
                palloc.sctx, salloc, fctx, curr.get(), std::forward< Fn >( fn), std::forward< Args >( args) ... };
    }

    execution_context() noexcept :
        // default constructed with current activation_record
        ptr_{ detail::activation_record::current_rec } {
    }

public:
    static execution_context current() noexcept;

#if defined(BOOST_USE_SEGMENTED_STACKS)
    template< typename Fn,
              typename ... Args,
              typename = detail::disable_overload< execution_context, Fn >
    >
    execution_context( Fn && fn, Args && ... args) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        ptr_{ create_context( segmented_stack(),
                              std::forward< Fn >( fn),
                              std::forward< Args >( args) ...) } {
        ptr_->resume( ptr_.get() );
    }

    template< typename Fn,
              typename ... Args
    >
    execution_context( std::allocator_arg_t, segmented_stack salloc, Fn && fn, Args && ... args) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        ptr_{ create_context( salloc,
                              std::forward< Fn >( fn),
                              std::forward< Args >( args) ...) } {
        ptr_->resume( ptr_.get() );
    }

    template< typename Fn,
              typename ... Args
    >
    execution_context( std::allocator_arg_t, preallocated palloc, segmented_stack salloc, Fn && fn, Args && ... args) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        ptr_{ create_context( palloc, salloc,
                              std::forward< Fn >( fn),
                              std::forward< Args >( args) ...) } {
        ptr_->resume( ptr_.get() );
    }
#else
    template< typename Fn,
              typename ... Args,
              typename = detail::disable_overload< execution_context, Fn >
    >
    execution_context( Fn && fn, Args && ... args) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        ptr_{ create_context( fixedsize_stack(),
                              std::forward< Fn >( fn),
                              std::forward< Args >( args) ...) } {
        ptr_->resume( ptr_.get() );
    }

    template< typename StackAlloc,
              typename Fn,
              typename ... Args
    >
    execution_context( std::allocator_arg_t, StackAlloc salloc, Fn && fn, Args && ... args) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        ptr_{ create_context( salloc,
                              std::forward< Fn >( fn),
                              std::forward< Args >( args) ...) } {
        ptr_->resume( ptr_.get() );
    }

    template< typename StackAlloc,
              typename Fn,
              typename ... Args
    >
    execution_context( std::allocator_arg_t, preallocated palloc, StackAlloc salloc, Fn && fn, Args && ... args) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        ptr_{ create_context( palloc, salloc,
                              std::forward< Fn >( fn),
                              std::forward< Args >( args) ...) } {
        ptr_->resume( ptr_.get() );
    }
#endif

    execution_context( execution_context const& other) noexcept :
        ptr_{ other.ptr_ } {
    }

    execution_context( execution_context && other) noexcept :
        ptr_{ other.ptr_ } {
        other.ptr_.reset();
    }

    execution_context & operator=( execution_context const& other) noexcept {
        // intrusive_ptr<> does not test for self-assignment
        if ( this == & other) return * this;
        ptr_ = other.ptr_;
        return * this;
    }

    execution_context & operator=( execution_context && other) noexcept {
        if ( this == & other) return * this;
        execution_context tmp{ std::move( other) };
        swap( tmp);
        return * this;
    }

    void * operator()( void * vp = nullptr) {
        return ptr_->resume( vp);
    }

    template< typename Fn >
    void * operator()( exec_ontop_arg_t, Fn && fn, void * vp = nullptr) {
        return ptr_->resume_ontop( vp,
                                   std::forward< Fn >( fn) );
    }

    explicit operator bool() const noexcept {
        return nullptr != ptr_.get();
    }

    bool operator!() const noexcept {
        return nullptr == ptr_.get();
    }

    bool operator==( execution_context const& other) const noexcept {
        return ptr_ == other.ptr_;
    }

    bool operator!=( execution_context const& other) const noexcept {
        return ptr_ != other.ptr_;
    }

    bool operator<( execution_context const& other) const noexcept {
        return ptr_ < other.ptr_;
    }

    bool operator>( execution_context const& other) const noexcept {
        return other.ptr_ < ptr_;
    }

    bool operator<=( execution_context const& other) const noexcept {
        return ! ( * this > other);
    }

    bool operator>=( execution_context const& other) const noexcept {
        return ! ( * this < other);
    }

    template< typename charT, class traitsT >
    friend std::basic_ostream< charT, traitsT > &
    operator<<( std::basic_ostream< charT, traitsT > & os, execution_context const& other) {
        if ( nullptr != other.ptr_) {
            return os << other.ptr_;
        } else {
            return os << "{not-a-context}";
        }
    }

    void swap( execution_context & other) noexcept {
        ptr_.swap( other.ptr_);
    }
};

inline
void swap( execution_context & l, execution_context & r) noexcept {
    l.swap( r);
}

}}

#ifdef BOOST_HAS_ABI_HEADERS
# include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_CONTEXT_EXECUTION_CONTEXT_H
