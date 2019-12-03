// boost/endian/detail/lightweight_test.hpp --------------------------------------------//

#ifndef BOOST_ENDIAN_LIGHTWEIGHT_TEST_HPP
#define BOOST_ENDIAN_LIGHTWEIGHT_TEST_HPP

// MS compatible compilers support #pragma once

#if defined(_MSC_VER)
# pragma once
#endif

//
//  Copyright (c) 2002, 2009, 2014 Peter Dimov
//  Copyright (2) Beman Dawes 2010, 2011, 2015
//  Copyright (3) Ion Gaztanaga 2013
//
//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt
//

#include <boost/assert.hpp>
#include <boost/current_function.hpp>
#include <boost/core/no_exceptions_support.hpp>
#include <cstring>    // for memcmp
#include <iostream>

//  IDE's like Visual Studio perform better if output goes to std::cout or
//  some other stream, so allow user to configure output stream:
#ifndef BOOST_LIGHTWEIGHT_TEST_OSTREAM
# define BOOST_LIGHTWEIGHT_TEST_OSTREAM std::cerr
#endif

namespace boost
{
namespace endian
{
namespace detail
{

struct report_errors_reminder
{
    bool called_report_errors_function;

    report_errors_reminder() : called_report_errors_function(false) {}

    ~report_errors_reminder()
    {
        BOOST_ASSERT(called_report_errors_function);  // verify report_errors() was called  
    }
};

inline report_errors_reminder& report_errors_remind()
{
    static report_errors_reminder r;
    return r;
}

inline int & test_errors()
{
    static int x = 0;
    report_errors_remind();
    return x;
}

inline void test_failed_impl(char const * expr, char const * file, int line, char const * function)
{
    BOOST_LIGHTWEIGHT_TEST_OSTREAM
      << file << "(" << line << "): test '" << expr << "' failed in function '"
      << function << "'" << std::endl;
    ++test_errors();
}

inline void error_impl(char const * msg, char const * file, int line, char const * function)
{
    BOOST_LIGHTWEIGHT_TEST_OSTREAM
      << file << "(" << line << "): " << msg << " in function '"
      << function << "'" << std::endl;
    ++test_errors();
}

inline void throw_failed_impl(char const * excep, char const * file, int line, char const * function)
{
   BOOST_LIGHTWEIGHT_TEST_OSTREAM
    << file << "(" << line << "): Exception '" << excep << "' not thrown in function '"
    << function << "'" << std::endl;
   ++test_errors();
}

template<class T, class U> inline void test_eq_impl( char const * expr1, char const * expr2,
  char const * file, int line, char const * function, T const & t, U const & u )
{
    if( t == u )
    {
        report_errors_remind();
    }
    else
    {
        BOOST_LIGHTWEIGHT_TEST_OSTREAM
            << file << "(" << line << "): test '" << expr1 << " == " << expr2
            << "' failed in function '" << function << "': "
            << "'" << t << "' != '" << u << "'" << std::endl;
        ++test_errors();
    }
}

template<class T, class U> inline void test_ne_impl( char const * expr1, char const * expr2,
  char const * file, int line, char const * function, T const & t, U const & u )
{
    if( t != u )
    {
        report_errors_remind();
    }
    else
    {
        BOOST_LIGHTWEIGHT_TEST_OSTREAM
            << file << "(" << line << "): test '" << expr1 << " != " << expr2
            << "' failed in function '" << function << "': "
            << "'" << t << "' == '" << u << "'" << std::endl;
        ++test_errors();
    }
}

template <class T>
std::string to_hex(const T& x)
{
  const char hex[] = { '0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f' };
  std::string tmp;
  const unsigned char* p = reinterpret_cast<const unsigned char*>(&x);
  const unsigned char* e = p + sizeof(T);

  for (; p < e; ++p)
  {
    tmp += hex[*p >> 4];    // high-order nibble
    tmp += hex[*p & 0x0f];  // low-order nibble
  }
  return tmp;
}

template<class T, class U> inline bool test_memcmp_eq_impl(char const * expr1,
  char const * expr2, char const * file, int line, char const * function, T const & t,
  U const & u)
{
  BOOST_ASSERT(sizeof(T) == sizeof(U));
  if (sizeof(T) == sizeof(U)
    && std::memcmp(&t, &u, sizeof(T)) == 0)
  {
    report_errors_remind();
    return true;
  }
  else
  {
    BOOST_LIGHTWEIGHT_TEST_OSTREAM
      << file << "(" << line << "): test 'std::memcmp(" << expr1 << ", " << expr2
      << ") == 0' fails in function '" << function << "': "
      << " with values '" << to_hex(t) << "' and '" << to_hex(u) << "'" << std::endl;
    ++test_errors();
    return false;
  }
}

} // namespace detail

inline int report_errors()
{
    boost::endian::detail::report_errors_remind().called_report_errors_function = true;

    int errors = boost::endian::detail::test_errors();

    if( errors == 0 )
    {
        BOOST_LIGHTWEIGHT_TEST_OSTREAM
          << "No errors detected." << std::endl;
        return 0;
    }
    else
    {
        BOOST_LIGHTWEIGHT_TEST_OSTREAM
          << errors << " error" << (errors == 1? "": "s") << " detected." << std::endl;
        return 1;
    }
}

} // namespace endian
} // namespace boost

//////////////////////////////////////////////////////////////////////////////////////////
//  TODO: Should all test macros return bool?  See BOOST_TEST_MEM_EQ usage in fp_exaustive_test,cpp
//////////////////////////////////////////////////////////////////////////////////////////


#define BOOST_TEST(expr) \
  ((expr)? (void)0: ::boost::endian::detail::test_failed_impl(#expr, __FILE__, __LINE__, BOOST_CURRENT_FUNCTION))

#define BOOST_ERROR(msg) \
  ( ::boost::endian::detail::error_impl(msg, __FILE__, __LINE__, BOOST_CURRENT_FUNCTION) )

#define BOOST_TEST_EQ(expr1,expr2) \
  ( ::boost::endian::detail::test_eq_impl(#expr1, #expr2, __FILE__, __LINE__, BOOST_CURRENT_FUNCTION, expr1, expr2) )
#define BOOST_TEST_NE(expr1,expr2) \
  ( ::boost::endian::detail::test_ne_impl(#expr1, #expr2, __FILE__, __LINE__, BOOST_CURRENT_FUNCTION, expr1, expr2) )

#define BOOST_TEST_MEM_EQ(expr1,expr2) \
  (::boost::endian::detail::test_memcmp_eq_impl(#expr1, #expr2, __FILE__, __LINE__, BOOST_CURRENT_FUNCTION, expr1, expr2))

#ifndef BOOST_NO_EXCEPTIONS
   #define BOOST_TEST_THROWS( EXPR, EXCEP )                    \
      try {                                                    \
         EXPR;                                                 \
         ::boost::detail::throw_failed_impl                    \
         (#EXCEP, __FILE__, __LINE__, BOOST_CURRENT_FUNCTION); \
      }                                                        \
      catch(EXCEP const&) {                                    \
      }                                                        \
      catch(...) {                                             \
         ::boost::detail::throw_failed_impl                    \
         (#EXCEP, __FILE__, __LINE__, BOOST_CURRENT_FUNCTION); \
      }                                                        \
   //
#else
   #define BOOST_TEST_THROWS( EXPR, EXCEP )
#endif

#endif // #ifndef BOOST_ENDIAN_LIGHTWEIGHT_TEST_HPP
