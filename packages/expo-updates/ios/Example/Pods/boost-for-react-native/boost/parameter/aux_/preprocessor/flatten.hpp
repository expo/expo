// Copyright Daniel Wallin 2005. Use, modification and distribution is
// subject to the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_PARAMETER_FLATTEN_051217_HPP
# define BOOST_PARAMETER_FLATTEN_051217_HPP

# include <boost/preprocessor/tuple/elem.hpp>
# include <boost/preprocessor/tuple/rem.hpp>
# include <boost/preprocessor/cat.hpp>
# include <boost/preprocessor/seq/for_each.hpp>
# include <boost/preprocessor/seq/for_each_i.hpp>
# include <boost/preprocessor/identity.hpp>
# include <boost/preprocessor/selection/max.hpp>
# include <boost/preprocessor/arithmetic/sub.hpp>
# include <boost/preprocessor/repetition/enum_trailing.hpp>
# include <boost/parameter/aux_/preprocessor/for_each.hpp>

# define BOOST_PARAMETER_FLATTEN_SPLIT_required required,
# define BOOST_PARAMETER_FLATTEN_SPLIT_optional optional,
# define BOOST_PARAMETER_FLATTEN_SPLIT_deduced deduced,

# define BOOST_PARAMETER_FLATTEN_SPLIT(sub) \
    BOOST_PP_CAT(BOOST_PARAMETER_FLATTEN_SPLIT_, sub)

# define BOOST_PARAMETER_FLATTEN_QUALIFIER(sub) \
    BOOST_PP_SPLIT(0, BOOST_PARAMETER_FLATTEN_SPLIT(sub))

# define BOOST_PARAMETER_FLATTEN_ARGS(sub) \
    BOOST_PP_SPLIT(1, BOOST_PARAMETER_FLATTEN_SPLIT(sub))

# define BOOST_PARAMETER_FLATTEN_ARITY_optional(arities) \
    BOOST_PP_TUPLE_ELEM(3,0,arities)

# define BOOST_PARAMETER_FLATTEN_ARITY_required(arities) \
    BOOST_PP_TUPLE_ELEM(3,1,arities)

# define BOOST_PARAMETER_FLATTEN_SPEC0_DUMMY_ELEM(z, n, data) ~
# define BOOST_PARAMETER_FLATTEN_SPEC0(r, n, elem, data) \
    (( \
        BOOST_PP_TUPLE_ELEM(3,2,data) \
      , BOOST_PP_TUPLE_REM(BOOST_PP_TUPLE_ELEM(3,0,data)) elem \
        BOOST_PP_ENUM_TRAILING( \
            BOOST_PP_SUB( \
                BOOST_PP_TUPLE_ELEM(3,1,data) \
              , BOOST_PP_TUPLE_ELEM(3,0,data) \
            ) \
          , BOOST_PARAMETER_FLATTEN_SPEC0_DUMMY_ELEM \
          , ~ \
        ) \
    ))

# define BOOST_PARAMETER_FLATTEN_SPEC_AUX(r, arity, max_arity, spec, transform) \
    BOOST_PARAMETER_FOR_EACH_R( \
        r \
      , arity \
      , BOOST_PARAMETER_FLATTEN_ARGS(spec) \
      , (arity, max_arity, transform(BOOST_PARAMETER_FLATTEN_QUALIFIER(spec))) \
      , BOOST_PARAMETER_FLATTEN_SPEC0 \
    )

# define BOOST_PARAMETER_FLATTEN_IDENTITY(x) x

# define BOOST_PARAMETER_FLATTEN_SPEC_optional(r, arities, spec) \
    BOOST_PARAMETER_FLATTEN_SPEC_AUX( \
        r \
      , BOOST_PP_CAT( \
            BOOST_PARAMETER_FLATTEN_ARITY_, BOOST_PARAMETER_FLATTEN_QUALIFIER(spec) \
        )(arities) \
      , BOOST_PP_TUPLE_ELEM(3,2,arities) \
      , spec \
      , BOOST_PARAMETER_FLATTEN_IDENTITY \
    )

# define BOOST_PARAMETER_FLATTEN_SPEC_required(r, arities, spec) \
    BOOST_PARAMETER_FLATTEN_SPEC_optional(r, arities, spec)

# define BOOST_PARAMETER_FLATTEN_SPEC_AS_DEDUCED(x) BOOST_PP_CAT(deduced_,x)

# define BOOST_PARAMETER_FLATTEN_SPEC_deduced_M(r, arities, n, spec) \
    BOOST_PARAMETER_FLATTEN_SPEC_AUX( \
        r \
      , BOOST_PP_CAT( \
            BOOST_PARAMETER_FLATTEN_ARITY_, BOOST_PARAMETER_FLATTEN_QUALIFIER(spec) \
        )(arities) \
      , BOOST_PP_TUPLE_ELEM(3,2,arities) \
      , spec \
      , BOOST_PARAMETER_FLATTEN_SPEC_AS_DEDUCED \
    )

# define BOOST_PARAMETER_FLATTEN_SPEC_deduced(r, arities, spec) \
    BOOST_PP_SEQ_FOR_EACH_I_R( \
        r \
      , BOOST_PARAMETER_FLATTEN_SPEC_deduced_M \
      , arities \
      , BOOST_PARAMETER_FLATTEN_ARGS(spec) \
    )

# define BOOST_PARAMETER_FLATTEN_SPEC(r, arities, spec) \
    BOOST_PP_CAT( \
        BOOST_PARAMETER_FLATTEN_SPEC_, BOOST_PARAMETER_FLATTEN_QUALIFIER(spec) \
    )(r, arities, spec)

# define BOOST_PARAMETER_FLATTEN(optional_arity, required_arity, wanted_arity, specs) \
    BOOST_PP_SEQ_FOR_EACH( \
        BOOST_PARAMETER_FLATTEN_SPEC \
      , ( \
            optional_arity, required_arity \
          , wanted_arity \
        ) \
      , specs \
    )

#endif // BOOST_PARAMETER_FLATTEN_051217_HPP

