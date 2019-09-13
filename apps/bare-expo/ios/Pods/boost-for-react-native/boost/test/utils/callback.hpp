//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Use, modification, and distribution are subject to the 
//  Boost Software License, Version 1.0. (See accompanying file 
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : 
// ***************************************************************************

#ifndef BOOST_TEST_CALLBACK_020505GER
#define BOOST_TEST_CALLBACK_020505GER

// Boost
#include <boost/config.hpp>
#include <boost/detail/workaround.hpp>
#include <boost/shared_ptr.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

#if BOOST_WORKAROUND(BOOST_MSVC, < 1300) || BOOST_WORKAROUND(BOOST_INTEL, <= 700)
#  define BOOST_CALLBACK_EXPLICIT_COPY_CONSTRUCTOR
#endif

//____________________________________________________________________________//

namespace boost {

namespace unit_test {

namespace ut_detail {

struct unused {};

template<typename R>
struct invoker {
    template<typename Functor>
    R       invoke( Functor& f )                        { return f(); }
    template<typename Functor, typename T1>
    R       invoke( Functor& f, T1 t1 )                 { return f( t1 ); }
    template<typename Functor, typename T1, typename T2>
    R       invoke( Functor& f, T1 t1, T2 t2 )          { return f( t1, t2 ); }
    template<typename Functor, typename T1, typename T2, typename T3>
    R       invoke( Functor& f, T1 t1, T2 t2, T3 t3 )   { return f( t1, t2, t3 ); }
};

//____________________________________________________________________________//

template<>
struct invoker<unused> {
    template<typename Functor>
    unused  invoke( Functor& f )                        { f(); return unused(); }
    template<typename Functor, typename T1>
    unused  invoke( Functor& f, T1 t1 )                 { f( t1 ); return unused(); }
    template<typename Functor, typename T1, typename T2>
    unused  invoke( Functor& f, T1 t1, T2 t2 )          { f( t1, t2 ); return unused(); }
    template<typename Functor, typename T1, typename T2, typename T3>
    unused  invoke( Functor& f, T1 t1, T2 t2, T3 t3 )   { f( t1, t2, t3 ); return unused(); }
};

//____________________________________________________________________________//

} // namespace ut_detail

// ************************************************************************** //
// **************             unit_test::callback0             ************** //
// ************************************************************************** //

namespace ut_detail {

template<typename R>
struct callback0_impl {
    virtual ~callback0_impl() {}

    virtual R invoke() = 0;
};

//____________________________________________________________________________//

template<typename R, typename Functor>
struct callback0_impl_t : callback0_impl<R> {
    // Constructor
    explicit callback0_impl_t( Functor f ) : m_f( f ) {}

    virtual R invoke() { return invoker<R>().invoke( m_f ); }

private:
    // Data members
    Functor m_f;
};

//____________________________________________________________________________//

} // namespace ut_detail

template<typename R = ut_detail::unused>
class callback0 {
public:
    // Constructors
    callback0() {}
#ifdef BOOST_CALLBACK_EXPLICIT_COPY_CONSTRUCTOR
    callback0( callback0 const& rhs ) : m_impl( rhs.m_impl ) {}
#endif

    template<typename Functor>
    callback0( Functor f )
    : m_impl( new ut_detail::callback0_impl_t<R,Functor>( f ) ) {}
    
    void        operator=( callback0 const& rhs ) { m_impl = rhs.m_impl; }

    template<typename Functor>
    void        operator=( Functor f ) { m_impl.reset( new ut_detail::callback0_impl_t<R,Functor>( f ) );  }

    R           operator()() const { return m_impl->invoke(); }

    bool        operator!() const { return !m_impl; }

private:
    // Data members
    boost::shared_ptr<ut_detail::callback0_impl<R> > m_impl;
};

// ************************************************************************** //
// **************             unit_test::callback1             ************** //
// ************************************************************************** //

namespace ut_detail {

template<typename R, typename T1>
struct callback1_impl {
    virtual ~callback1_impl() {}

    virtual R invoke( T1 t1 ) = 0;
};

//____________________________________________________________________________//

template<typename R, typename T1,typename Functor>
struct callback1_impl_t : callback1_impl<R,T1> {
    // Constructor
    explicit callback1_impl_t( Functor f ) : m_f( f ) {}

    virtual R invoke( T1 t1 ) { return invoker<R>().invoke( m_f, t1 ); }

private:
    // Data members
    Functor m_f;
};

//____________________________________________________________________________//

} // namespace ut_detail

template<typename T1,typename R = ut_detail::unused>
class callback1 {
public:
    // Constructors
    callback1() {}
#ifdef BOOST_CALLBACK_EXPLICIT_COPY_CONSTRUCTOR
    callback1( callback1 const& rhs ) : m_impl( rhs.m_impl ) {}
#endif

    template<typename Functor>
    callback1( Functor f )
    : m_impl( new ut_detail::callback1_impl_t<R,T1,Functor>( f ) ) {}

    void        operator=( callback1 const& rhs ) { m_impl = rhs.m_impl; }

    template<typename Functor>
    void        operator=( Functor f ) { m_impl.reset( new ut_detail::callback1_impl_t<R,T1,Functor>( f ) );  }

    R           operator()( T1 t1 ) const { return m_impl->invoke( t1 ); }

    bool        operator!() const { return !m_impl; }

private:
    // Data members
    boost::shared_ptr<ut_detail::callback1_impl<R,T1> > m_impl;
};

// ************************************************************************** //
// **************             unit_test::callback2             ************** //
// ************************************************************************** //

namespace ut_detail {

template<typename R, typename T1,typename T2>
struct callback2_impl {
    virtual ~callback2_impl() {}

    virtual R invoke( T1 t1, T2 t2 ) = 0;
};

//____________________________________________________________________________//

template<typename R, typename T1, typename T2, typename Functor>
struct callback2_impl_t : callback2_impl<R,T1,T2> {
    // Constructor
    explicit callback2_impl_t( Functor f ) : m_f( f ) {}

    virtual R invoke( T1 t1, T2 t2 ) { return invoker<R>().template invoke<Functor,T1,T2>( m_f, t1, t2 ); }

private:
    // Data members
    Functor m_f;
};

//____________________________________________________________________________//

} // namespace ut_detail

template<typename T1,typename T2, typename R = ut_detail::unused>
class callback2 {
public:
    // Constructors
    callback2() {}
#ifdef BOOST_CALLBACK_EXPLICIT_COPY_CONSTRUCTOR
    callback2( callback2 const& rhs ) : m_impl( rhs.m_impl ) {}
#endif

    template<typename Functor>
                callback2( Functor f ) : m_impl( new ut_detail::callback2_impl_t<R,T1,T2,Functor>( f ) ) {}

    void        operator=( callback2 const& rhs ) { m_impl = rhs.m_impl; }

    template<typename Functor>
    void        operator=( Functor f ) { m_impl.reset( new ut_detail::callback2_impl_t<R,T1,T2,Functor>( f ) );  }

    R           operator()( T1 t1, T2 t2 ) const { return m_impl->invoke( t1, t2 ); }

    bool        operator!() const { return !m_impl; }

private:
    // Data members
    boost::shared_ptr<ut_detail::callback2_impl<R,T1,T2> > m_impl;
};

// ************************************************************************** //
// **************             unit_test::callback3             ************** //
// ************************************************************************** //

namespace ut_detail {

template<typename R, typename T1, typename T2, typename T3>
struct callback3_impl {
    virtual ~callback3_impl() {}

    virtual R invoke( T1 t1, T2 t2, T3 t3 ) = 0;
};

//____________________________________________________________________________//

template<typename R, typename T1, typename T2, typename T3, typename Functor>
struct callback3_impl_t : callback3_impl<R,T1,T2,T3> {
    // Constructor
    explicit callback3_impl_t( Functor f ) : m_f( f ) {}

    virtual R invoke( T1 t1, T2 t2, T3 t3 ) { return invoker<R>().invoke( m_f, t1, t2, t3 ); }

private:
    // Data members
    Functor m_f;
};

//____________________________________________________________________________//

} // namespace ut_detail

template<typename T1,typename T2, typename T3, typename R = ut_detail::unused>
class callback3 {
public:
    // Constructors
    callback3() {}
#ifdef BOOST_CALLBACK_EXPLICIT_COPY_CONSTRUCTOR
    callback3( callback3 const& rhs ) : m_impl( rhs.m_impl ) {}
#endif

    template<typename Functor>
    callback3( Functor f )
    : m_impl( new ut_detail::callback3_impl_t<R,T1,T2,T3,Functor>( f ) ) {}

    void        operator=( callback3 const& rhs ) { m_impl = rhs.m_impl; }

    template<typename Functor>
    void        operator=( Functor f ) { m_impl.reset( new ut_detail::callback3_impl_t<R,T1,T2,T3,Functor>( f ) );  }

    R           operator()( T1 t1, T2 t2, T3 t3 ) const { return m_impl->invoke( t1, t2, t3 ); }

    bool        operator!() const { return !m_impl; }

private:
    // Data members
    boost::shared_ptr<ut_detail::callback3_impl<R,T1,T2,T3> > m_impl;
};

} // namespace unit_test

} // namespace boost

#undef BOOST_CALLBACK_EXPLICIT_COPY_CONSTRUCTOR

//____________________________________________________________________________//

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_CALLBACK_020505GER
