// Copyright Daniel Wallin, David Abrahams 2005. Use, modification and
// distribution is subject to the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

#ifndef YESNO_050328_HPP
#define YESNO_050328_HPP

#include <boost/mpl/bool.hpp>

namespace boost { namespace parameter { namespace aux {

// types used with the "sizeof trick" to capture the results of
// overload resolution at compile-time.
typedef char yes_tag;
typedef char (&no_tag)[2];

// mpl::true_ and mpl::false_ are not distinguishable by sizeof(),
// so we pass them through these functions to get a type that is.
yes_tag to_yesno(mpl::true_);
no_tag to_yesno(mpl::false_);

}}} // namespace boost::parameter::aux

#endif // YESNO_050328_HPP

