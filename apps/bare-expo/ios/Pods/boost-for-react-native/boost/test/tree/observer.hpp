//  (C) Copyright Gennadiy Rozental 2001.
//  Distributed under the Boost Software License, Version 1.0.
//  (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/test for the library home page.
//
//!@file
//!@brief defines abstract interface for test observer
// ***************************************************************************

#ifndef BOOST_TEST_TEST_OBSERVER_HPP_021005GER
#define BOOST_TEST_TEST_OBSERVER_HPP_021005GER

// Boost.Test
#include <boost/test/detail/fwd_decl.hpp>
#include <boost/test/detail/global_typedef.hpp>
#include <boost/test/detail/config.hpp>

#include <boost/test/detail/suppress_warnings.hpp>

//____________________________________________________________________________//

namespace boost {
namespace unit_test {

// ************************************************************************** //
// **************                 test_observer                ************** //
// ************************************************************************** //

/// @brief Generic test observer interface
///
/// This interface is used by observers in order to receive notifications from the
/// Boost.Test framework on the current execution state.
///
/// Several observers can be running at the same time, and it is not unusual to
/// have interactions among them. The test_observer#priority member function allows the specification
/// of a particular order among them (lowest priority executed first, except specified otherwise).
///
class BOOST_TEST_DECL test_observer {
public:

    //! Called before the framework starts executing the test cases
    //!
    //! @param[in] number_of_test_cases indicates the number of test cases. Only active
    //! test cases are taken into account.
    //!
    virtual void    test_start( counter_t /* number_of_test_cases */ ) {}


    //! Called after the framework ends executing the test cases
    //!
    //! @note The call is made with a reversed priority order.
    virtual void    test_finish() {}

    //! Called when a critical error is detected
    //!
    //! The critical errors are mainly the signals sent by the system and caught by the Boost.Test framework.
    //! Since the running binary may be in incoherent/instable state, the test execution is aborted and all remaining
    //! tests are discarded.
    //!
    //! @note may be called before test_observer::test_unit_finish()
    virtual void    test_aborted() {}

    //! Called before the framework starts executing a test unit
    //!
    //! @param[in] test_unit the test being executed
    virtual void    test_unit_start( test_unit const& /* test */) {}

    //! Called at each end of a test unit.
    //!
    //! @param elapsed duration of the test unit in microseconds.
    virtual void    test_unit_finish( test_unit const& /* test */, unsigned long /* elapsed */ ) {}
    virtual void    test_unit_skipped( test_unit const& tu, const_string ) { test_unit_skipped( tu ); }
    virtual void    test_unit_skipped( test_unit const& ) {} ///< backward compatibility

    //! Called when a test unit indicates a fatal error.
    //!
    //! A fatal error happens when
    //! - a strong assertion (with @c REQUIRE) fails, which indicates that the test case cannot continue
    //! - an unexpected exception is caught by the Boost.Test framework
    virtual void    test_unit_aborted( test_unit const& ) {}

    virtual void    assertion_result( unit_test::assertion_result ar )
    {
        switch( ar ) {
        case AR_PASSED: assertion_result( true ); break;
        case AR_FAILED: assertion_result( false ); break;
        case AR_TRIGGERED: break;
        default: break;
        }
    }

    //! Called when an exception is intercepted
    //!
    //! In case an exception is intercepted, this call happens before the call
    //! to @ref test_unit_aborted in order to log
    //! additional data about the exception.
    virtual void    exception_caught( execution_exception const& ) {}

    virtual int     priority() { return 0; }

protected:
    //! Deprecated
    virtual void    assertion_result( bool /* passed */ ) {}

    BOOST_TEST_PROTECTED_VIRTUAL ~test_observer() {}
};

} // namespace unit_test
} // namespace boost

#include <boost/test/detail/enable_warnings.hpp>

#endif // BOOST_TEST_TEST_OBSERVER_HPP_021005GER

