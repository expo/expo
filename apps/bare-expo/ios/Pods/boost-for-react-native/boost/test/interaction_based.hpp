//  (C) Copyright Gennadiy Rozental 2005-2008.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at 
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : Facilities to perform interaction-based testing
// ***************************************************************************

#ifndef BOOST_TEST_INTERACTION_BASED_HPP_112105GER
#define BOOST_TEST_INTERACTION_BASED_HPP_112105GER

// Boost.Test
#include <boost/test/detail/config.hpp>
#include <boost/test/detail/global_typedef.hpp>

#include <boost/test/utils/wrap_stringstream.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

// Boost
#include <boost/lexical_cast.hpp>

//____________________________________________________________________________//

// ************************************************************************** //
// **************               BOOST_ITEST_EPOINT             ************** //
// ************************************************************************** //

#define BOOST_ITEST_EPOINT( description ) \
    ::boost::itest::manager::instance().exception_point( BOOST_TEST_L(__FILE__), __LINE__, description )
/**/

// ************************************************************************** //
// **************               BOOST_ITEST_DPOINT             ************** //
// ************************************************************************** //

#define BOOST_ITEST_DPOINT() \
    ::boost::itest::manager::instance().decision_point( BOOST_TEST_L(__FILE__), __LINE__ )
/**/

// ************************************************************************** //
// **************                BOOST_ITEST_SCOPE             ************** //
// ************************************************************************** //

#define BOOST_ITEST_SCOPE( scope_name ) \
    ::boost::itest::scope_guard itest_scope_guard ## __LINE__( BOOST_TEST_L(__FILE__), __LINE__, BOOST_STRINGIZE(scope_name) )
/**/

// ************************************************************************** //
// **************                 BOOST_ITEST_NEW              ************** //
// ************************************************************************** //

#define BOOST_ITEST_NEW( type_name ) \
    new ( ::boost::itest::location( BOOST_TEST_L(__FILE__), __LINE__ ) ) type_name
/**/

// ************************************************************************** //
// **************              BOOST_ITEST_DATA_FLOW           ************** //
// ************************************************************************** //

#define BOOST_ITEST_DATA_FLOW( v ) \
    ::boost::itest::manager::instance().generic_data_flow( v )
/**/

// ************************************************************************** //
// **************               BOOST_ITEST_RETURN             ************** //
// ************************************************************************** //

#define BOOST_ITEST_RETURN( type, default_value ) \
    ::boost::itest::manager::instance().generic_return<type>( default_value )
/**/

// ************************************************************************** //
// **************              BOOST_ITEST_MOCK_FUNC           ************** //
// ************************************************************************** //

#define BOOST_ITEST_MOCK_FUNC( function_name )          \
    BOOST_ITEST_SCOPE( function_name );                 \
    BOOST_ITEST_EPOINT( 0 );                            \
    return ::boost::itest::mock_object<>::prototype();  \
/**/

namespace boost {

namespace itest { // interaction-based testing

using unit_test::const_string;

// ************************************************************************** //
// **************                    manager                   ************** //
// ************************************************************************** //

class BOOST_TEST_DECL manager {
public:
    // instance access
    static manager&     instance() { return *instance_ptr(); }

    // Mock objects interface hooks
    virtual void        exception_point( const_string /*file*/, 
                                         std::size_t /*line_num*/, 
                                         const_string /*descr*/ ){}
    virtual bool        decision_point( const_string /*file*/, 
                                        std::size_t /*line_num*/ )          { return true; }
    virtual unsigned    enter_scope( const_string /*file*/, 
                                     std::size_t /*line_num*/,
                                     const_string /*scope_name*/){ return 0; }
    virtual void        leave_scope( unsigned )                             {}
    virtual void        allocated( const_string /*file*/, 
                                   std::size_t /*line_num*/, 
                                   void* /*p*/, std::size_t /*s*/ )         {}
    virtual void        freed( void* /*p*/ )                                {}
    virtual void        data_flow( const_string /*d*/ )                     {}
    virtual std::string return_value( const_string /*default_value */ )     { return ""; }

    template<typename T>
    void                generic_data_flow( T const& t )
    {
        wrap_stringstream ws;

        data_flow( (ws << t).str() );
    }
    template<typename T, typename DefaultValueType>
    T                   generic_return( DefaultValueType const& dv )
    {
        wrap_stringstream ws;

        std::string const& res = return_value( (ws << dv).str() );

        if( res.empty() )
            return dv;

        return lexical_cast<T>( res );
    }

protected:
    manager();
#if BOOST_WORKAROUND(__BORLANDC__, BOOST_TESTED_AT(0x564)) 
public:
#endif
    BOOST_TEST_PROTECTED_VIRTUAL ~manager();

private:
    struct dummy_constr{};
    explicit manager( dummy_constr* ) {}

    static manager*     instance_ptr( bool reset = false, manager* ptr = 0 );
}; // manager

// ************************************************************************** //
// **************                  scope_guard                 ************** //
// ************************************************************************** //

class scope_guard {
public:
    // Constructor
    scope_guard( const_string file, std::size_t line_num, const_string scope_name )
    {
        m_scope_index = manager::instance().enter_scope( file, line_num, scope_name );
    }
    ~scope_guard()
    {
        manager::instance().leave_scope( m_scope_index );
    }

    unsigned m_scope_index;
};

// ************************************************************************** //
// **************                    location                  ************** //
// ************************************************************************** //

struct location {
    location( const_string file, std::size_t line ) 
    : m_file_name( file )
    , m_line_num( line )
    {}

    const_string    m_file_name;
    std::size_t     m_line_num;
};

}  // namespace itest

} // namespace boost

// ************************************************************************** //
// **************              operator new overload           ************** //
// ************************************************************************** //

#if !defined(BOOST_ITEST_NO_NEW_OVERLOADS)

// STL
#include <cstdlib>

# ifdef BOOST_NO_STDC_NAMESPACE
namespace std { using ::malloc; using ::free; }
# endif
# ifdef _CRTDBG_MAP_ALLOC
namespace std { using ::_malloc_dbg; using ::_free_dbg; }
# endif

inline void*
operator new( std::size_t s, ::boost::itest::location const& l )
{
    void* res = std::malloc(s ? s : 1);

    if( res )
        ::boost::itest::manager::instance().allocated( l.m_file_name, l.m_line_num, res, s );
    else
        throw std::bad_alloc();
        
    return res;
}

//____________________________________________________________________________//

inline void*
operator new[]( std::size_t s, ::boost::itest::location const& l )
{
    void* res = std::malloc(s ? s : 1);

    if( res )
        ::boost::itest::manager::instance().allocated( l.m_file_name, l.m_line_num, res, s );
    else
        throw std::bad_alloc();
        
    return res;
}

//____________________________________________________________________________//

inline void
operator delete( void* p, ::boost::itest::location const& )
{
    ::boost::itest::manager::instance().freed( p );

    std::free( p );
}

//____________________________________________________________________________//

inline void
operator delete[]( void* p, ::boost::itest::location const& )
{
    ::boost::itest::manager::instance().freed( p );

    std::free( p );
}

//____________________________________________________________________________//

#endif

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_INTERACTION_BASED_HPP_112105GER
