# /* **************************************************************************
#  *                                                                          *
#  *     (C) Copyright Paul Mensonides 2002.
#  *     Distributed under the Boost Software License, Version 1.0. (See
#  *     accompanying file LICENSE_1_0.txt or copy at
#  *     http://www.boost.org/LICENSE_1_0.txt)
#  *                                                                          *
#  ************************************************************************** */
#
# /* See http://www.boost.org for most recent version. */
#
# ifndef BOOST_PREPROCESSOR_REPETITION_DEDUCE_R_HPP
# define BOOST_PREPROCESSOR_REPETITION_DEDUCE_R_HPP
#
# include <boost/preprocessor/detail/auto_rec.hpp>
# include <boost/preprocessor/repetition/for.hpp>
#
# /* BOOST_PP_DEDUCE_R */
#
# define BOOST_PP_DEDUCE_R() BOOST_PP_AUTO_REC(BOOST_PP_FOR_P, 256)
#
# endif
