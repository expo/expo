//  Copyright Neil Groves 2009. Use, modification and
//  distribution is subject to the Boost Software License, Version
//  1.0. (See accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)
//
//
// For more information, see http://www.boost.org/libs/range/
//
#ifndef BOOST_RANGE_ALGORITHM_MAX_ELEMENT_HPP_INCLUDED
#define BOOST_RANGE_ALGORITHM_MAX_ELEMENT_HPP_INCLUDED

#include <boost/concept_check.hpp>
#include <boost/range/begin.hpp>
#include <boost/range/end.hpp>
#include <boost/range/concepts.hpp>
#include <boost/range/detail/range_return.hpp>
#include <algorithm>

namespace boost
{
    namespace range
    {

/// \brief template function max_element
///
/// range-based version of the max_element std algorithm
///
/// \pre ForwardRange is a model of the ForwardRangeConcept
/// \pre BinaryPredicate is a model of the BinaryPredicateConcept
template<class ForwardRange>
inline BOOST_DEDUCED_TYPENAME range_iterator<ForwardRange>::type
max_element(ForwardRange& rng)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<ForwardRange> ));
    return std::max_element(boost::begin(rng), boost::end(rng));
}

/// \overload
template<class ForwardRange>
inline BOOST_DEDUCED_TYPENAME range_iterator<const ForwardRange>::type
max_element(const ForwardRange& rng)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<const ForwardRange> ));
    return std::max_element(boost::begin(rng), boost::end(rng));
}

/// \overload
template<class ForwardRange, class BinaryPredicate>
inline BOOST_DEDUCED_TYPENAME range_iterator<ForwardRange>::type
max_element(ForwardRange& rng, BinaryPredicate pred)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<ForwardRange> ));
    return std::max_element(boost::begin(rng), boost::end(rng), pred);
}

/// \overload
template<class ForwardRange, class BinaryPredicate>
inline BOOST_DEDUCED_TYPENAME range_iterator<const ForwardRange>::type
max_element(const ForwardRange& rng, BinaryPredicate pred)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<const ForwardRange> ));
    return std::max_element(boost::begin(rng), boost::end(rng), pred);
}

// range_return overloads

/// \overload
template<range_return_value re, class ForwardRange>
inline BOOST_DEDUCED_TYPENAME range_return<ForwardRange,re>::type
max_element(ForwardRange& rng)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<ForwardRange> ));
    return range_return<ForwardRange,re>::pack(
        std::max_element(boost::begin(rng), boost::end(rng)),
        rng);
}

/// \overload
template<range_return_value re, class ForwardRange>
inline BOOST_DEDUCED_TYPENAME range_return<const ForwardRange,re>::type
max_element(const ForwardRange& rng)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<const ForwardRange> ));
    return range_return<const ForwardRange,re>::pack(
        std::max_element(boost::begin(rng), boost::end(rng)),
        rng);
}

/// \overload
template<range_return_value re, class ForwardRange, class BinaryPredicate>
inline BOOST_DEDUCED_TYPENAME range_return<ForwardRange,re>::type
max_element(ForwardRange& rng, BinaryPredicate pred)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<ForwardRange> ));
    return range_return<ForwardRange,re>::pack(
        std::max_element(boost::begin(rng), boost::end(rng), pred),
        rng);
}

/// \overload
template<range_return_value re, class ForwardRange, class BinaryPredicate>
inline BOOST_DEDUCED_TYPENAME range_return<const ForwardRange,re>::type
max_element(const ForwardRange& rng, BinaryPredicate pred)
{
    BOOST_RANGE_CONCEPT_ASSERT(( ForwardRangeConcept<const ForwardRange> ));
    return range_return<const ForwardRange,re>::pack(
        std::max_element(boost::begin(rng), boost::end(rng), pred),
        rng);
}

    } // namespace range
    using range::max_element;
} // namespace boost

#endif // include guard
