
//          Copyright Oliver Kowalke 2014.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

namespace detail {

template< typename Ctx, typename Fn >
transfer_t context_ontop_void( transfer_t);

template< typename Ctx, typename StackAlloc, typename Fn, typename ... Params >
fcontext_t context_create_void( StackAlloc, Fn &&, Params && ...);

template< typename Ctx, typename StackAlloc, typename Fn, typename ... Params >
fcontext_t context_create_void( preallocated, StackAlloc, Fn &&, Params && ...);

template< typename Ctx, typename StackAlloc, typename Fn, typename ... Params >
class record_void {
private:
    StackAlloc                                          salloc_;
    stack_context                                       sctx_;
    typename std::decay< Fn >::type                     fn_;
    std::tuple< typename std::decay< Params >::type ... > params_;

    static void destroy( record_void * p) noexcept {
        StackAlloc salloc = p->salloc_;
        stack_context sctx = p->sctx_;
        // deallocate record
        p->~record_void();
        // destroy stack with stack allocator
        salloc.deallocate( sctx);
    }

public:
    record_void( stack_context sctx, StackAlloc const& salloc,
            Fn && fn, Params && ... params) noexcept :
        salloc_( salloc),
        sctx_( sctx),
        fn_( std::forward< Fn >( fn) ),
        params_( std::forward< Params >( params) ... ) {
    }

    record_void( record_void const&) = delete;
    record_void & operator=( record_void const&) = delete;

    void deallocate() noexcept {
        destroy( this);
    }

    transfer_t run( transfer_t t) {
        Ctx from{ t.fctx };
        // invoke context-function
#if defined(BOOST_NO_CXX17_STD_APPLY)
        Ctx cc = apply( fn_, std::tuple_cat( params_, std::forward_as_tuple( std::move( from) ) ) );
#else
        Ctx cc = std::apply( fn_, std::tuple_cat( params_, std::forward_as_tuple( std::move( from) ) ) );
#endif
        return { exchange( cc.fctx_, nullptr), nullptr };
    }
};

}

template<>
class execution_context< void > {
private:
    friend class ontop_error;

    template< typename Ctx, typename StackAlloc, typename Fn, typename ... Params >
    friend class detail::record_void;

    template< typename Ctx, typename Fn >
    friend detail::transfer_t detail::context_ontop_void( detail::transfer_t);

    detail::fcontext_t  fctx_{ nullptr };

    execution_context( detail::fcontext_t fctx) noexcept :
        fctx_( fctx) {
    }

public:
    constexpr execution_context() noexcept = default;

#if defined(BOOST_USE_SEGMENTED_STACKS)
    // segmented-stack requires to preserve the segments of the `current` context
    // which is not possible (no global pointer to current context)
    template< typename Fn, typename ... Params >
    execution_context( std::allocator_arg_t, segmented_stack, Fn &&, Params && ...) = delete;

    template< typename Fn, typename ... Params >
    execution_context( std::allocator_arg_t, preallocated, segmented_stack, Fn &&, Params && ...) = delete;
#else
    template< typename Fn,
              typename ... Params,
              typename = detail::disable_overload< execution_context, Fn >
    >
    execution_context( Fn && fn, Params && ... params) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        fctx_( detail::context_create_void< execution_context >(
                    fixedsize_stack(),
                    std::forward< Fn >( fn),
                    std::forward< Params >( params) ... ) ) {
    }

    template< typename StackAlloc,
              typename Fn,
              typename ... Params
    >
    execution_context( std::allocator_arg_t, StackAlloc salloc, Fn && fn, Params && ... params) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        fctx_( detail::context_create_void< execution_context >(
                    salloc,
                    std::forward< Fn >( fn),
                    std::forward< Params >( params) ... ) ) {
    }

    template< typename StackAlloc,
              typename Fn,
              typename ... Params
    >
    execution_context( std::allocator_arg_t, preallocated palloc, StackAlloc salloc, Fn && fn, Params && ... params) :
        // deferred execution of fn and its arguments
        // arguments are stored in std::tuple<>
        // non-type template parameter pack via std::index_sequence_for<>
        // preserves the number of arguments
        // used to extract the function arguments from std::tuple<>
        fctx_( detail::context_create_void< execution_context >(
                    palloc, salloc,
                    std::forward< Fn >( fn),
                    std::forward< Params >( params) ... ) ) {
    }
#endif

    ~execution_context() {
        if ( nullptr != fctx_) {
            detail::ontop_fcontext( detail::exchange( fctx_, nullptr), nullptr, detail::context_unwind);
        }
    }

    execution_context( execution_context && other) noexcept :
        fctx_( other.fctx_) {
        other.fctx_ = nullptr;
    }

    execution_context & operator=( execution_context && other) noexcept {
        if ( this != & other) {
            execution_context tmp = std::move( other);
            swap( tmp);
        }
        return * this;
    }

    execution_context( execution_context const& other) noexcept = delete;
    execution_context & operator=( execution_context const& other) noexcept = delete;

    execution_context operator()() {
        BOOST_ASSERT( nullptr != fctx_);
        detail::transfer_t t = detail::jump_fcontext( detail::exchange( fctx_, nullptr), nullptr);
        if ( nullptr != t.data) {
            std::exception_ptr * eptr = static_cast< std::exception_ptr * >( t.data);
            try {
                std::rethrow_exception( * eptr);
            } catch (...) {
                std::throw_with_nested( ontop_error{ t.fctx } );
            }
        }
        return execution_context( t.fctx);
    }

    template< typename Fn >
    execution_context operator()( exec_ontop_arg_t, Fn && fn) {
        BOOST_ASSERT( nullptr != fctx_);
        auto p = std::make_tuple( fn, std::exception_ptr{} );
        detail::transfer_t t = detail::ontop_fcontext(
                detail::exchange( fctx_, nullptr),
                & p,
                detail::context_ontop_void< execution_context, Fn >);
        if ( nullptr != t.data) {
            std::exception_ptr * eptr = static_cast< std::exception_ptr * >( t.data);
            try {
                std::rethrow_exception( * eptr);
            } catch (...) {
                std::throw_with_nested( ontop_error{ t.fctx } );
            }
        }
        return execution_context( t.fctx);
    }

    explicit operator bool() const noexcept {
        return nullptr != fctx_;
    }

    bool operator!() const noexcept {
        return nullptr == fctx_;
    }

    bool operator==( execution_context const& other) const noexcept {
        return fctx_ == other.fctx_;
    }

    bool operator!=( execution_context const& other) const noexcept {
        return fctx_ != other.fctx_;
    }

    bool operator<( execution_context const& other) const noexcept {
        return fctx_ < other.fctx_;
    }

    bool operator>( execution_context const& other) const noexcept {
        return other.fctx_ < fctx_;
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
        if ( nullptr != other.fctx_) {
            return os << other.fctx_;
        } else {
            return os << "{not-a-context}";
        }
    }

    void swap( execution_context & other) noexcept {
        std::swap( fctx_, other.fctx_);
    }
};

namespace detail {

template< typename Ctx, typename Fn >
transfer_t context_ontop_void( transfer_t t) {
    auto p = static_cast< std::tuple< Fn, std::exception_ptr > * >( t.data);
    BOOST_ASSERT( nullptr != p);
    typename std::decay< Fn >::type fn = std::forward< Fn >( std::get< 0 >( * p) );
    try {
        // execute function
        fn();
    } catch (...) {
        std::get< 1 >( * p) = std::current_exception();
        return { t.fctx, & std::get< 1 >( * p ) };
    }
    return { exchange( t.fctx, nullptr), nullptr };
}

template< typename Ctx, typename StackAlloc, typename Fn, typename ... Params >
fcontext_t context_create_void( StackAlloc salloc, Fn && fn, Params && ... params) {
    typedef record_void< Ctx, StackAlloc, Fn, Params ... >  record_t;

    auto sctx = salloc.allocate();
    // reserve space for control structure
#if defined(BOOST_NO_CXX11_CONSTEXPR) || defined(BOOST_NO_CXX11_STD_ALIGN)
    const std::size_t size = sctx.size - sizeof( record_t);
    void * sp = static_cast< char * >( sctx.sp) - sizeof( record_t);
#else
    constexpr std::size_t func_alignment = 64; // alignof( record_t);
    constexpr std::size_t func_size = sizeof( record_t);
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
    const fcontext_t fctx = make_fcontext( sp, size, & context_entry< record_t >);
    BOOST_ASSERT( nullptr != fctx);
    // placment new for control structure on context-stack
    auto rec = ::new ( sp) record_t{
            sctx, salloc, std::forward< Fn >( fn), std::forward< Params >( params) ... };
    // transfer control structure to context-stack
    return jump_fcontext( fctx, rec).fctx;
}

template< typename Ctx, typename StackAlloc, typename Fn, typename ... Params >
fcontext_t context_create_void( preallocated palloc, StackAlloc salloc, Fn && fn, Params && ... params) {
    typedef record_void< Ctx, StackAlloc, Fn, Params ... >  record_t;

    // reserve space for control structure
#if defined(BOOST_NO_CXX11_CONSTEXPR) || defined(BOOST_NO_CXX11_STD_ALIGN)
    const std::size_t size = palloc.size - sizeof( record_t);
    void * sp = static_cast< char * >( palloc.sp) - sizeof( record_t);
#else
    constexpr std::size_t func_alignment = 64; // alignof( record_t);
    constexpr std::size_t func_size = sizeof( record_t);
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
    const fcontext_t fctx = make_fcontext( sp, size, & context_entry< record_t >);
    BOOST_ASSERT( nullptr != fctx);
    // placment new for control structure on context-stack
    auto rec = ::new ( sp) record_t{
            palloc.sctx, salloc, std::forward< Fn >( fn), std::forward< Params >( params) ... };
    // transfer control structure to context-stack
    return jump_fcontext( fctx, rec).fctx;
}

}
