#ifndef BOOST_SMART_PTR_WEAK_PTR_HPP_INCLUDED
#define BOOST_SMART_PTR_WEAK_PTR_HPP_INCLUDED

//
//  weak_ptr.hpp
//
//  Copyright (c) 2001, 2002, 2003 Peter Dimov
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
//  See http://www.boost.org/libs/smart_ptr/weak_ptr.htm for documentation.
//

#include <memory> // boost.TR1 include order fix
#include <boost/smart_ptr/detail/shared_count.hpp>
#include <boost/smart_ptr/shared_ptr.hpp>

namespace boost
{

template<class T> class weak_ptr
{
private:

    // Borland 5.5.1 specific workarounds
    typedef weak_ptr<T> this_type;

public:

    typedef typename boost::detail::sp_element< T >::type element_type;

    weak_ptr() BOOST_NOEXCEPT : px(0), pn() // never throws in 1.30+
    {
    }

//  generated copy constructor, assignment, destructor are fine...

#if !defined( BOOST_NO_CXX11_RVALUE_REFERENCES )

// ... except in C++0x, move disables the implicit copy

    weak_ptr( weak_ptr const & r ) BOOST_NOEXCEPT : px( r.px ), pn( r.pn )
    {
    }

    weak_ptr & operator=( weak_ptr const & r ) BOOST_NOEXCEPT
    {
        px = r.px;
        pn = r.pn;
        return *this;
    }

#endif

//
//  The "obvious" converting constructor implementation:
//
//  template<class Y>
//  weak_ptr(weak_ptr<Y> const & r): px(r.px), pn(r.pn) // never throws
//  {
//  }
//
//  has a serious problem.
//
//  r.px may already have been invalidated. The px(r.px)
//  conversion may require access to *r.px (virtual inheritance).
//
//  It is not possible to avoid spurious access violations since
//  in multithreaded programs r.px may be invalidated at any point.
//

    template<class Y>
#if !defined( BOOST_SP_NO_SP_CONVERTIBLE )

    weak_ptr( weak_ptr<Y> const & r, typename boost::detail::sp_enable_if_convertible<Y,T>::type = boost::detail::sp_empty() )

#else

    weak_ptr( weak_ptr<Y> const & r )

#endif
    BOOST_NOEXCEPT : px(r.lock().get()), pn(r.pn)
    {
        boost::detail::sp_assert_convertible< Y, T >();
    }

#if !defined( BOOST_NO_CXX11_RVALUE_REFERENCES )

    template<class Y>
#if !defined( BOOST_SP_NO_SP_CONVERTIBLE )

    weak_ptr( weak_ptr<Y> && r, typename boost::detail::sp_enable_if_convertible<Y,T>::type = boost::detail::sp_empty() )

#else

    weak_ptr( weak_ptr<Y> && r )

#endif
    BOOST_NOEXCEPT : px( r.lock().get() ), pn( static_cast< boost::detail::weak_count && >( r.pn ) )
    {
        boost::detail::sp_assert_convertible< Y, T >();
        r.px = 0;
    }

    // for better efficiency in the T == Y case
    weak_ptr( weak_ptr && r )
    BOOST_NOEXCEPT : px( r.px ), pn( static_cast< boost::detail::weak_count && >( r.pn ) )
    {
        r.px = 0;
    }

    // for better efficiency in the T == Y case
    weak_ptr & operator=( weak_ptr && r ) BOOST_NOEXCEPT
    {
        this_type( static_cast< weak_ptr && >( r ) ).swap( *this );
        return *this;
    }


#endif

    template<class Y>
#if !defined( BOOST_SP_NO_SP_CONVERTIBLE )

    weak_ptr( shared_ptr<Y> const & r, typename boost::detail::sp_enable_if_convertible<Y,T>::type = boost::detail::sp_empty() )

#else

    weak_ptr( shared_ptr<Y> const & r )

#endif
    BOOST_NOEXCEPT : px( r.px ), pn( r.pn )
    {
        boost::detail::sp_assert_convertible< Y, T >();
    }

#if !defined(BOOST_MSVC) || (BOOST_MSVC >= 1300)

    template<class Y>
    weak_ptr & operator=( weak_ptr<Y> const & r ) BOOST_NOEXCEPT
    {
        boost::detail::sp_assert_convertible< Y, T >();

        px = r.lock().get();
        pn = r.pn;

        return *this;
    }

#if !defined( BOOST_NO_CXX11_RVALUE_REFERENCES )

    template<class Y>
    weak_ptr & operator=( weak_ptr<Y> && r ) BOOST_NOEXCEPT
    {
        this_type( static_cast< weak_ptr<Y> && >( r ) ).swap( *this );
        return *this;
    }

#endif

    template<class Y>
    weak_ptr & operator=( shared_ptr<Y> const & r ) BOOST_NOEXCEPT
    {
        boost::detail::sp_assert_convertible< Y, T >();

        px = r.px;
        pn = r.pn;

        return *this;
    }

#endif

    shared_ptr<T> lock() const BOOST_NOEXCEPT
    {
        return shared_ptr<T>( *this, boost::detail::sp_nothrow_tag() );
    }

    long use_count() const BOOST_NOEXCEPT
    {
        return pn.use_count();
    }

    bool expired() const BOOST_NOEXCEPT
    {
        return pn.use_count() == 0;
    }

    bool _empty() const // extension, not in std::weak_ptr
    {
        return pn.empty();
    }

    void reset() BOOST_NOEXCEPT // never throws in 1.30+
    {
        this_type().swap(*this);
    }

    void swap(this_type & other) BOOST_NOEXCEPT
    {
        std::swap(px, other.px);
        pn.swap(other.pn);
    }

    template<typename Y>
    void _internal_aliasing_assign(weak_ptr<Y> const & r, element_type * px2)
    {
        px = px2;
        pn = r.pn;
    }

    template<class Y> bool owner_before( weak_ptr<Y> const & rhs ) const BOOST_NOEXCEPT
    {
        return pn < rhs.pn;
    }

    template<class Y> bool owner_before( shared_ptr<Y> const & rhs ) const BOOST_NOEXCEPT
    {
        return pn < rhs.pn;
    }

// Tasteless as this may seem, making all members public allows member templates
// to work in the absence of member template friends. (Matthew Langston)

#ifndef BOOST_NO_MEMBER_TEMPLATE_FRIENDS

private:

    template<class Y> friend class weak_ptr;
    template<class Y> friend class shared_ptr;

#endif

    element_type * px;            // contained pointer
    boost::detail::weak_count pn; // reference counter

};  // weak_ptr

template<class T, class U> inline bool operator<(weak_ptr<T> const & a, weak_ptr<U> const & b) BOOST_NOEXCEPT
{
    return a.owner_before( b );
}

template<class T> void swap(weak_ptr<T> & a, weak_ptr<T> & b) BOOST_NOEXCEPT
{
    a.swap(b);
}

} // namespace boost

#endif  // #ifndef BOOST_SMART_PTR_WEAK_PTR_HPP_INCLUDED
