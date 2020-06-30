//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2015-2016.
// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/move for documentation.
//
//////////////////////////////////////////////////////////////////////////////
#ifndef BOOST_MOVE_MERGE_HPP
#define BOOST_MOVE_MERGE_HPP

#include <boost/move/algo/move.hpp>
#include <boost/move/adl_move_swap.hpp>
#include <boost/move/algo/detail/basic_op.hpp>
#include <boost/move/detail/iterator_traits.hpp>
#include <boost/move/detail/destruct_n.hpp>
#include <boost/assert.hpp>

namespace boost {
namespace movelib {

// @cond

/*
template<typename Unsigned>
inline Unsigned gcd(Unsigned x, Unsigned y)
{
   if(0 == ((x &(x-1)) | (y & (y-1)))){
      return x < y ? x : y;
   }
   else{
      do
      {
         Unsigned t = x % y;
         x = y;
         y = t;
      } while (y);
      return x;
   }
}
*/

//Modified version from "An Optimal In-Place Array Rotation Algorithm", Ching-Kuang Shene
template<typename Unsigned>
Unsigned gcd(Unsigned x, Unsigned y)
{
   if(0 == ((x &(x-1)) | (y & (y-1)))){
      return x < y ? x : y;
   }
   else{
      Unsigned z = 1;
      while((!(x&1)) & (!(y&1))){
         z <<=1, x>>=1, y>>=1;
      }
      while(x && y){
         if(!(x&1))
            x >>=1;
         else if(!(y&1))
            y >>=1;
         else if(x >=y)
            x = (x-y) >> 1;
         else
            y = (y-x) >> 1;
      }
      return z*(x+y);
   }
}

template<typename RandIt>
RandIt rotate_gcd(RandIt first, RandIt middle, RandIt last)
{
   typedef typename iterator_traits<RandIt>::size_type size_type;
   typedef typename iterator_traits<RandIt>::value_type value_type;

   if(first == middle)
      return last;
   if(middle == last)
      return first;
   const size_type middle_pos = size_type(middle - first);
   RandIt ret = last - middle_pos;
   if (middle == ret){
      boost::adl_move_swap_ranges(first, middle, middle);
   }
   else{
      const size_type length = size_type(last - first);
      for( RandIt it_i(first), it_gcd(it_i + gcd(length, middle_pos))
         ; it_i != it_gcd
         ; ++it_i){
         value_type temp(boost::move(*it_i));
         RandIt it_j = it_i;
         RandIt it_k = it_j+middle_pos;
         do{
            *it_j = boost::move(*it_k);
            it_j = it_k;
            size_type const left = size_type(last - it_j);
            it_k = left > middle_pos ? it_j + middle_pos : first + (middle_pos - left);
         } while(it_k != it_i);
         *it_j = boost::move(temp);
      }
   }
   return ret;
}

template <class RandIt, class T, class Compare>
RandIt lower_bound
   (RandIt first, const RandIt last, const T& key, Compare comp)
{
   typedef typename iterator_traits
      <RandIt>::size_type size_type;
   size_type len = size_type(last - first);
   RandIt middle;

   while (len) {
      size_type step = len >> 1;
      middle = first;
      middle += step;

      if (comp(*middle, key)) {
         first = ++middle;
         len -= step + 1;
      }
      else{
         len = step;
      }
   }
   return first;
}

template <class RandIt, class T, class Compare>
RandIt upper_bound
   (RandIt first, const RandIt last, const T& key, Compare comp)
{
   typedef typename iterator_traits
      <RandIt>::size_type size_type;
   size_type len = size_type(last - first);
   RandIt middle;

   while (len) {
      size_type step = len >> 1;
      middle = first;
      middle += step;

      if (!comp(key, *middle)) {
         first = ++middle;
         len -= step + 1;
      }
      else{
         len = step;
      }
   }
   return first;
}


template<class RandIt, class Compare, class Op>
void op_merge_left( RandIt buf_first
                    , RandIt first1
                    , RandIt const last1
                    , RandIt const last2
                    , Compare comp
                    , Op op)
{
   for(RandIt first2=last1; first2 != last2; ++buf_first){
      if(first1 == last1){
         op(forward_t(), first2, last2, buf_first);
         return;
      }
      else if(comp(*first2, *first1)){
         op(first2, buf_first);
         ++first2;
      }
      else{
         op(first1, buf_first);
         ++first1;
      }
   }
   if(buf_first != first1){//In case all remaining elements are in the same place
                           //(e.g. buffer is exactly the size of the second half
                           //and all elements from the second half are less)
      op(forward_t(), first1, last1, buf_first);
   }
   else{
      buf_first = buf_first;
   }
}

// [buf_first, first1) -> buffer
// [first1, last1) merge [last1,last2) -> [buf_first,buf_first+(last2-first1))
// Elements from buffer are moved to [last2 - (first1-buf_first), last2)
// Note: distance(buf_first, first1) >= distance(last1, last2), so no overlapping occurs
template<class RandIt, class Compare>
void merge_left
   (RandIt buf_first, RandIt first1, RandIt const last1, RandIt const last2, Compare comp)
{
   op_merge_left(buf_first, first1, last1, last2, comp, move_op());
}

// [buf_first, first1) -> buffer
// [first1, last1) merge [last1,last2) -> [buf_first,buf_first+(last2-first1))
// Elements from buffer are swapped to [last2 - (first1-buf_first), last2)
// Note: distance(buf_first, first1) >= distance(last1, last2), so no overlapping occurs
template<class RandIt, class Compare>
void swap_merge_left
   (RandIt buf_first, RandIt first1, RandIt const last1, RandIt const last2, Compare comp)
{
   op_merge_left(buf_first, first1, last1, last2, comp, swap_op());
}

template<class RandIt, class Compare, class Op>
void op_merge_right
   (RandIt const first1, RandIt last1, RandIt last2, RandIt buf_last, Compare comp, Op op)
{
   RandIt const first2 = last1;
   while(first1 != last1){
      if(last2 == first2){
         op(backward_t(), first1, last1, buf_last);
         return;
      }
      --last2;
      --last1;
      --buf_last;
      if(comp(*last2, *last1)){
         op(last1, buf_last);
         ++last2;
      }
      else{
         op(last2, buf_last);
         ++last1;
      }
   }
   if(last2 != buf_last){  //In case all remaining elements are in the same place
                           //(e.g. buffer is exactly the size of the first half
                           //and all elements from the second half are less)
      op(backward_t(), first2, last2, buf_last);
   }
}

// [last2, buf_last) - buffer
// [first1, last1) merge [last1,last2) -> [first1+(buf_last-last2), buf_last)
// Note: distance[last2, buf_last) >= distance[first1, last1), so no overlapping occurs
template<class RandIt, class Compare>
void merge_right
   (RandIt first1, RandIt last1, RandIt last2, RandIt buf_last, Compare comp)
{
   op_merge_right(first1, last1, last2, buf_last, comp, move_op());
}

// [last2, buf_last) - buffer
// [first1, last1) merge [last1,last2) -> [first1+(buf_last-last2), buf_last)
// Note: distance[last2, buf_last) >= distance[first1, last1), so no overlapping occurs
template<class RandIt, class Compare>
void swap_merge_right
   (RandIt first1, RandIt last1, RandIt last2, RandIt buf_last, Compare comp)
{
   op_merge_right(first1, last1, last2, buf_last, comp, swap_op());
}

template <class BidirIt, class Distance, class Compare>
void merge_bufferless_ONlogN_recursive
   (BidirIt first, BidirIt middle, BidirIt last, Distance len1, Distance len2, Compare comp)
{
   typedef typename iterator_traits<BidirIt>::size_type size_type;
   while(1) {
      //#define MERGE_BUFFERLESS_RECURSIVE_OPT
      #ifndef MERGE_BUFFERLESS_RECURSIVE_OPT
      if (len2  == 0) {
         return;
      }

      if (!len1) {
         return;
      }

      if ((len1 | len2) == 1) {
         if (comp(*middle, *first))
            adl_move_swap(*first, *middle);  
         return;
      }
      #else
      if (len2  == 0) {
         return;
      }

      if (!len1) {
         return;
      }
      BidirIt middle_prev = middle; --middle_prev;
      if(!comp(*middle, *middle_prev))
         return;

      while(true) {
         if (comp(*middle, *first))
            break;
         ++first;
         if(--len1 == 1)
            break;
      }

      if (len1 == 1 && len2 == 1) {
         //comp(*middle, *first) == true already tested in the loop
         adl_move_swap(*first, *middle);  
         return;
      }
      #endif

      BidirIt first_cut = first;
      BidirIt second_cut = middle;
      Distance len11 = 0;
      Distance len22 = 0;
      if (len1 > len2) {
         len11 = len1 / 2;
         first_cut +=  len11;
         second_cut = lower_bound(middle, last, *first_cut, comp);
         len22 = size_type(second_cut - middle);
      }
      else {
         len22 = len2 / 2;
         second_cut += len22;
         first_cut = upper_bound(first, middle, *second_cut, comp);
         len11 = size_type(first_cut - first);
      }
      BidirIt new_middle = rotate_gcd(first_cut, middle, second_cut);

      //Avoid one recursive call doing a manual tail call elimination on the biggest range
      const Distance len_internal = len11+len22;
      if( len_internal < (len1 + len2 - len_internal) ) {
         merge_bufferless_ONlogN_recursive(first,      first_cut,  new_middle, len11,        len22,        comp);
         //merge_bufferless_recursive(new_middle, second_cut, last,       len1 - len11, len2 - len22, comp);
         first = new_middle;
         middle = second_cut;
         len1 -= len11;
         len2 -= len22;
      }
      else {
         //merge_bufferless_recursive(first,      first_cut,  new_middle, len11,        len22,        comp);
         merge_bufferless_ONlogN_recursive(new_middle, second_cut, last,       len1 - len11, len2 - len22, comp);
         middle = first_cut;
         last = new_middle;
         len1 = len11;
         len2 = len22;
      }
   }
}

//Complexity: NlogN
template<class BidirIt, class Compare>
void merge_bufferless_ONlogN(BidirIt first, BidirIt middle, BidirIt last, Compare comp)
{
   merge_bufferless_ONlogN_recursive
      (first, middle, last, middle - first, last - middle, comp); 
}

//Complexity: min(len1,len2)^2 + max(len1,len2)
template<class RandIt, class Compare>
void merge_bufferless_ON2(RandIt first, RandIt middle, RandIt last, Compare comp)
{
   if((middle - first) < (last - middle)){
      while(first != middle){
         RandIt const old_last1 = middle;
         middle = lower_bound(middle, last, *first, comp);
         first = rotate_gcd(first, old_last1, middle);
         if(middle == last){
            break;
         }
         do{
            ++first;
         } while(first != middle && !comp(*middle, *first));
      }
   }
   else{
      while(middle != last){
         RandIt p = upper_bound(first, middle, last[-1], comp);
         last = rotate_gcd(p, middle, last);
         middle = p;
         if(middle == first){
            break;
         }
         --p;
         do{
            --last;
         } while(middle != last && !comp(last[-1], *p));
      }
   }
}

template<class RandIt, class Compare>
void merge_bufferless(RandIt first, RandIt middle, RandIt last, Compare comp)
{
   //#define BOOST_ADAPTIVE_MERGE_NLOGN_MERGE
   #ifdef BOOST_ADAPTIVE_MERGE_NLOGN_MERGE
   merge_bufferless_ONlogN(first, middle, last, comp);
   #else
   merge_bufferless_ON2(first, middle, last, comp);
   #endif   //BOOST_ADAPTIVE_MERGE_NLOGN_MERGE
}

template<class Comp>
struct antistable
{
   explicit antistable(Comp &comp)
      : m_comp(comp)
   {}

   template<class U, class V>
   bool operator()(const U &u, const V & v)
   {  return !m_comp(v, u);  }

   private:
   antistable & operator=(const antistable &);
   Comp &m_comp;
};

template <class Comp>
class negate
{
   public:
   negate()
   {}

   explicit negate(Comp comp)
      : m_comp(comp)
   {}

   template <class T1, class T2>
   bool operator()(const T1& l, const T2& r)
   {
      return !m_comp(l, r);
   }

   private:
   Comp m_comp;
};


template <class Comp>
class inverse
{
   public:
   inverse()
   {}

   explicit inverse(Comp comp)
      : m_comp(comp)
   {}

   template <class T1, class T2>
   bool operator()(const T1& l, const T2& r)
   {
      return m_comp(r, l);
   }

   private:
   Comp m_comp;
};

// [r_first, r_last) are already in the right part of the destination range.
template <class Compare, class InputIterator, class InputOutIterator, class Op>
void op_merge_with_right_placed
   ( InputIterator first, InputIterator last
   , InputOutIterator dest_first, InputOutIterator r_first, InputOutIterator r_last
   , Compare comp, Op op)
{
   BOOST_ASSERT((last - first) == (r_first - dest_first));
   while ( first != last ) {
      if (r_first == r_last) {
         InputOutIterator end = op(forward_t(), first, last, dest_first);
         BOOST_ASSERT(end == r_last);
         (void)end;
         return;
      }
      else if (comp(*r_first, *first)) {
         op(r_first, dest_first);
         ++r_first;
      }
      else {
         op(first, dest_first);
         ++first;
      }
      ++dest_first;
   }
   // Remaining [r_first, r_last) already in the correct place
}

template <class Compare, class InputIterator, class InputOutIterator>
void swap_merge_with_right_placed
   ( InputIterator first, InputIterator last
   , InputOutIterator dest_first, InputOutIterator r_first, InputOutIterator r_last
   , Compare comp)
{
   op_merge_with_right_placed(first, last, dest_first, r_first, r_last, comp, swap_op());
}

// [first, last) are already in the right part of the destination range.
template <class Compare, class Op, class BidirIterator, class BidirOutIterator>
void op_merge_with_left_placed
   ( BidirOutIterator const first, BidirOutIterator last, BidirOutIterator dest_last
   , BidirIterator const r_first, BidirIterator r_last
   , Compare comp, Op op)
{
   BOOST_ASSERT((dest_last - last) == (r_last - r_first));
   while( r_first != r_last ) {
      if(first == last) {
         BidirOutIterator res = op(backward_t(), r_first, r_last, dest_last);
         BOOST_ASSERT(last == res);
         (void)res;
         return;
      }
      --r_last;
      --last;
      if(comp(*r_last, *last)){
         ++r_last;
         --dest_last;
         op(last, dest_last);
      }
      else{
         ++last;
         --dest_last;
         op(r_last, dest_last);
      }
   }
   // Remaining [first, last) already in the correct place
}

// @endcond

// [irst, last) are already in the right part of the destination range.
template <class Compare, class BidirIterator, class BidirOutIterator>
void merge_with_left_placed
   ( BidirOutIterator const first, BidirOutIterator last, BidirOutIterator dest_last
   , BidirIterator const r_first, BidirIterator r_last
   , Compare comp)
{
   op_merge_with_left_placed(first, last, dest_last, r_first, r_last, comp, move_op());
}

// [r_first, r_last) are already in the right part of the destination range.
template <class Compare, class InputIterator, class InputOutIterator>
void merge_with_right_placed
   ( InputIterator first, InputIterator last
   , InputOutIterator dest_first, InputOutIterator r_first, InputOutIterator r_last
   , Compare comp)
{
   op_merge_with_right_placed(first, last, dest_first, r_first, r_last, comp, move_op());
}

// [r_first, r_last) are already in the right part of the destination range.
// [dest_first, r_first) is uninitialized memory
template <class Compare, class InputIterator, class InputOutIterator>
void uninitialized_merge_with_right_placed
   ( InputIterator first, InputIterator last
   , InputOutIterator dest_first, InputOutIterator r_first, InputOutIterator r_last
   , Compare comp)
{
   BOOST_ASSERT((last - first) == (r_first - dest_first));
   typedef typename iterator_traits<InputOutIterator>::value_type value_type;
   InputOutIterator const original_r_first = r_first;

   destruct_n<value_type> d(&*dest_first);

   while ( first != last && dest_first != original_r_first ) {
      if (r_first == r_last) {
         for(; dest_first != original_r_first; ++dest_first, ++first){
            ::new(&*dest_first) value_type(::boost::move(*first));
            d.incr();
         }
         d.release();
         InputOutIterator end = ::boost::move(first, last, original_r_first);
         BOOST_ASSERT(end == r_last);
         (void)end;
         return;
      }
      else if (comp(*r_first, *first)) {
         ::new(&*dest_first) value_type(::boost::move(*r_first));
         d.incr();
         ++r_first;
      }
      else {
         ::new(&*dest_first) value_type(::boost::move(*first));
         d.incr();
         ++first;
      }
      ++dest_first;
   }
   d.release();
   merge_with_right_placed(first, last, original_r_first, r_first, r_last, comp);
}

/*
// [r_first, r_last) are already in the right part of the destination range.
// [dest_first, r_first) is uninitialized memory
template <class Compare, class BidirOutIterator, class BidirIterator>
void uninitialized_merge_with_left_placed
   ( BidirOutIterator dest_first, BidirOutIterator r_first, BidirOutIterator r_last
   , BidirIterator first, BidirIterator last
   , Compare comp)
{
   BOOST_ASSERT((last - first) == (r_last - r_first));
   typedef typename iterator_traits<BidirOutIterator>::value_type value_type;
   BidirOutIterator const original_r_last = r_last;

   destruct_n<value_type> d(&*dest_last);

   while ( first != last && dest_first != original_r_first ) {
      if (r_first == r_last) {
         for(; dest_first != original_r_first; ++dest_first, ++first){
            ::new(&*dest_first) value_type(::boost::move(*first));
            d.incr();
         }
         d.release();
         BidirOutIterator end = ::boost::move(first, last, original_r_first);
         BOOST_ASSERT(end == r_last);
         (void)end;
         return;
      }
      else if (comp(*r_first, *first)) {
         ::new(&*dest_first) value_type(::boost::move(*r_first));
         d.incr();
         ++r_first;
      }
      else {
         ::new(&*dest_first) value_type(::boost::move(*first));
         d.incr();
         ++first;
      }
      ++dest_first;
   }
   d.release();
   merge_with_right_placed(first, last, original_r_first, r_first, r_last, comp);
}
*/

}  //namespace movelib {
}  //namespace boost {

#endif   //#define BOOST_MOVE_MERGE_HPP
