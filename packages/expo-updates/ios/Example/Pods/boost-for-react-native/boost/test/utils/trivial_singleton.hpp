//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//  File        : $RCSfile$
//
//  Version     : $Revision$
//
//  Description : simple helpers for creating cusom output manipulators
// ***************************************************************************

#ifndef BOOST_TEST_UTILS_TRIVIAL_SIGNLETON_HPP
#define BOOST_TEST_UTILS_TRIVIAL_SIGNLETON_HPP

// Boost.Test
#include <boost/config.hpp>
#include <boost/detail/workaround.hpp>

// Boost
#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {

// ************************************************************************** //
// **************                   singleton                  ************** //
// ************************************************************************** //

template<typename Derived>
class singleton {
public:
    static Derived& instance() { static Derived the_inst; return the_inst; }

    BOOST_DELETED_FUNCTION(singleton(singleton const&))
    BOOST_DELETED_FUNCTION(singleton& operator=(singleton const&))

protected:
    BOOST_DEFAULTED_FUNCTION(singleton(), {})
    BOOST_DEFAULTED_FUNCTION(~singleton(), {})
};

//____________________________________________________________________________//

#define BOOST_TEST_SINGLETON_CONS( type )       \
friend class boost::unit_test::singleton<type>; \
type() {}                                       \
/**/

#if BOOST_WORKAROUND(__DECCXX_VER, BOOST_TESTED_AT(60590042))

#define BOOST_TEST_SINGLETON_INST( inst ) \
template class unit_test::singleton< BOOST_JOIN( inst, _t ) > ; \
namespace { BOOST_JOIN( inst, _t)& inst = BOOST_JOIN( inst, _t)::instance(); }

#elif defined(__APPLE_CC__) && defined(__GNUC__) && __GNUC__ < 4
#define BOOST_TEST_SINGLETON_INST( inst ) \
static BOOST_JOIN( inst, _t)& inst = BOOST_JOIN (inst, _t)::instance();

#else

#define BOOST_TEST_SINGLETON_INST( inst ) \
namespace { BOOST_JOIN( inst, _t)& inst = BOOST_JOIN( inst, _t)::instance(); }

#endif

//____________________________________________________________________________//

} // namespace unit_test
} // namespace boost


#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_UTILS_TRIVIAL_SIGNLETON_HPP
