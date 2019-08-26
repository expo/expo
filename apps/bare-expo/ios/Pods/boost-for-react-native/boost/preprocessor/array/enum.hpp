# /* **************************************************************************
#  *                                                                          *
#  *     (C) Copyright Edward Diener 2011.                                    *
#  *     (C) Copyright Paul Mensonides 2011.                                  *
#  *     Distributed under the Boost Software License, Version 1.0. (See      *
#  *     accompanying file LICENSE_1_0.txt or copy at                         *
#  *     http://www.boost.org/LICENSE_1_0.txt)                                *
#  *                                                                          *
#  ************************************************************************** */
#
# /* See http://www.boost.org for most recent version. */
#
# ifndef BOOST_PREPROCESSOR_ARRAY_ENUM_HPP
# define BOOST_PREPROCESSOR_ARRAY_ENUM_HPP
#
# include <boost/preprocessor/cat.hpp>
# include <boost/preprocessor/config/config.hpp>
# include <boost/preprocessor/tuple/rem.hpp>
#
# /* BOOST_PP_ARRAY_ENUM */
#
# if BOOST_PP_CONFIG_FLAGS() & BOOST_PP_CONFIG_MSVC()
#    define BOOST_PP_ARRAY_ENUM(array) BOOST_PP_ARRAY_ENUM_I(BOOST_PP_TUPLE_REM_CTOR, array)
#    define BOOST_PP_ARRAY_ENUM_I(m, args) BOOST_PP_ARRAY_ENUM_II(m, args)
#    define BOOST_PP_ARRAY_ENUM_II(m, args) BOOST_PP_CAT(m ## args,)
# elif BOOST_PP_CONFIG_FLAGS() & BOOST_PP_CONFIG_MWCC()
#    define BOOST_PP_ARRAY_ENUM(array) BOOST_PP_ARRAY_ENUM_I(array)
#    define BOOST_PP_ARRAY_ENUM_I(array) BOOST_PP_TUPLE_REM_CTOR ## array
# else
#    define BOOST_PP_ARRAY_ENUM(array) BOOST_PP_TUPLE_REM_CTOR array
# endif
#
# endif
