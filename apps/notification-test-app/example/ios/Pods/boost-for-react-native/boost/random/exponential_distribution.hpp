/* boost random/exponential_distribution.hpp header file
 *
 * Copyright Jens Maurer 2000-2001
 * Copyright Steven Watanabe 2011
 * Distributed under the Boost Software License, Version 1.0. (See
 * accompanying file LICENSE_1_0.txt or copy at
 * http://www.boost.org/LICENSE_1_0.txt)
 *
 * See http://www.boost.org for most recent version including documentation.
 *
 * $Id$
 *
 * Revision history
 *  2001-02-18  moved to individual header files
 */

#ifndef BOOST_RANDOM_EXPONENTIAL_DISTRIBUTION_HPP
#define BOOST_RANDOM_EXPONENTIAL_DISTRIBUTION_HPP

#include <boost/config/no_tr1/cmath.hpp>
#include <iosfwd>
#include <boost/assert.hpp>
#include <boost/limits.hpp>
#include <boost/random/detail/config.hpp>
#include <boost/random/detail/operators.hpp>
#include <boost/random/uniform_01.hpp>

namespace boost {
namespace random {

/**
 * The exponential distribution is a model of \random_distribution with
 * a single parameter lambda.
 *
 * It has \f$\displaystyle p(x) = \lambda e^{-\lambda x}\f$
 */
template<class RealType = double>
class exponential_distribution
{
public:
    typedef RealType input_type;
    typedef RealType result_type;

    class param_type
    {
    public:

        typedef exponential_distribution distribution_type;

        /**
         * Constructs parameters with a given lambda.
         *
         * Requires: lambda > 0
         */
        param_type(RealType lambda_arg = RealType(1.0))
          : _lambda(lambda_arg) { BOOST_ASSERT(_lambda > RealType(0)); }

        /** Returns the lambda parameter of the distribution. */
        RealType lambda() const { return _lambda; }

        /** Writes the parameters to a @c std::ostream. */
        BOOST_RANDOM_DETAIL_OSTREAM_OPERATOR(os, param_type, parm)
        {
            os << parm._lambda;
            return os;
        }
        
        /** Reads the parameters from a @c std::istream. */
        BOOST_RANDOM_DETAIL_ISTREAM_OPERATOR(is, param_type, parm)
        {
            is >> parm._lambda;
            return is;
        }

        /** Returns true if the two sets of parameters are equal. */
        BOOST_RANDOM_DETAIL_EQUALITY_OPERATOR(param_type, lhs, rhs)
        { return lhs._lambda == rhs._lambda; }

        /** Returns true if the two sets of parameters are different. */
        BOOST_RANDOM_DETAIL_INEQUALITY_OPERATOR(param_type)

    private:
        RealType _lambda;
    };

    /**
     * Constructs an exponential_distribution with a given lambda.
     *
     * Requires: lambda > 0
     */
    explicit exponential_distribution(RealType lambda_arg = RealType(1.0))
      : _lambda(lambda_arg) { BOOST_ASSERT(_lambda > RealType(0)); }

    /**
     * Constructs an exponential_distribution from its parameters
     */
    explicit exponential_distribution(const param_type& parm)
      : _lambda(parm.lambda()) {}

    // compiler-generated copy ctor and assignment operator are fine

    /** Returns the lambda parameter of the distribution. */
    RealType lambda() const { return _lambda; }

    /** Returns the smallest value that the distribution can produce. */
    RealType min BOOST_PREVENT_MACRO_SUBSTITUTION () const
    { return RealType(0); }
    /** Returns the largest value that the distribution can produce. */
    RealType max BOOST_PREVENT_MACRO_SUBSTITUTION () const
    { return (std::numeric_limits<RealType>::infinity)(); }

    /** Returns the parameters of the distribution. */
    param_type param() const { return param_type(_lambda); }
    /** Sets the parameters of the distribution. */
    void param(const param_type& parm) { _lambda = parm.lambda(); }

    /**
     * Effects: Subsequent uses of the distribution do not depend
     * on values produced by any engine prior to invoking reset.
     */
    void reset() { }

    /**
     * Returns a random variate distributed according to the
     * exponential distribution.
     */
    template<class Engine>
    result_type operator()(Engine& eng) const
    { 
        using std::log;
        return -result_type(1) /
            _lambda * log(result_type(1)-uniform_01<RealType>()(eng));
    }

    /**
     * Returns a random variate distributed according to the exponential
     * distribution with parameters specified by param.
     */
    template<class Engine>
    result_type operator()(Engine& eng, const param_type& parm) const
    { 
        return exponential_distribution(parm)(eng);
    }

    /** Writes the distribution to a std::ostream. */
    BOOST_RANDOM_DETAIL_OSTREAM_OPERATOR(os, exponential_distribution, ed)
    {
        os << ed._lambda;
        return os;
    }

    /** Reads the distribution from a std::istream. */
    BOOST_RANDOM_DETAIL_ISTREAM_OPERATOR(is, exponential_distribution, ed)
    {
        is >> ed._lambda;
        return is;
    }

    /**
     * Returns true iff the two distributions will produce identical
     * sequences of values given equal generators.
     */
    BOOST_RANDOM_DETAIL_EQUALITY_OPERATOR(exponential_distribution, lhs, rhs)
    { return lhs._lambda == rhs._lambda; }
    
    /**
     * Returns true iff the two distributions will produce different
     * sequences of values given equal generators.
     */
    BOOST_RANDOM_DETAIL_INEQUALITY_OPERATOR(exponential_distribution)

private:
    result_type _lambda;
};

} // namespace random

using random::exponential_distribution;

} // namespace boost

#endif // BOOST_RANDOM_EXPONENTIAL_DISTRIBUTION_HPP
