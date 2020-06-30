///////////////////////////////////////////////////////////////
//  Copyright 2015 John Maddock. Distributed under the Boost
//  Software License, Version 1.0. (See accompanying file
//  LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_

#ifndef BOOST_MP_CPP_INT_IMPORT_EXPORT_HPP
#define BOOST_MP_CPP_INT_IMPORT_EXPORT_HPP


namespace boost {
   namespace multiprecision {

      namespace detail {

         template <class Backend, class Unsigned>
         void assign_bits(Backend& val, Unsigned bits, unsigned bit_location, unsigned chunk_bits, const mpl::false_& tag)
         {
            unsigned limb = bit_location / (sizeof(limb_type) * CHAR_BIT);
            unsigned shift = bit_location % (sizeof(limb_type) * CHAR_BIT);

            limb_type mask = chunk_bits >= sizeof(limb_type) * CHAR_BIT ? ~static_cast<limb_type>(0u) : (static_cast<limb_type>(1u) << chunk_bits) - 1;

            limb_type value = static_cast<limb_type>(bits & mask) << shift;
            if(value)
            {
               if(val.size() == limb)
               {
                  val.resize(limb + 1, limb + 1);
                  if(val.size() > limb)
                     val.limbs()[limb] = value;
               }
               else if(val.size() > limb)
                  val.limbs()[limb] |= value;
            }
            if(chunk_bits > sizeof(limb_type) * CHAR_BIT - shift)
            {
               shift = sizeof(limb_type) * CHAR_BIT - shift;
               chunk_bits -= shift;
               bit_location += shift;
               bits >>= shift;
               if(bits)
                  assign_bits(val, bits, bit_location, chunk_bits, tag);
            }
         }
         template <class Backend, class Unsigned>
         void assign_bits(Backend& val, Unsigned bits, unsigned bit_location, unsigned chunk_bits, const mpl::true_&)
         {
            typedef typename Backend::local_limb_type local_limb_type;
            //
            // Check for possible overflow, this may trigger an exception, or have no effect
            // depending on whether this is a checked integer or not:
            //
            if((bit_location >= sizeof(local_limb_type) * CHAR_BIT) && bits)
               val.resize(2, 2);
            else
            {
               local_limb_type mask = chunk_bits >= sizeof(local_limb_type) * CHAR_BIT ? ~static_cast<local_limb_type>(0u) : (static_cast<local_limb_type>(1u) << chunk_bits) - 1;
               local_limb_type value = (static_cast<local_limb_type>(bits) & mask) << bit_location;
               *val.limbs() |= value;
               //
               // Check for overflow bits:
               //
               bit_location = sizeof(local_limb_type) * CHAR_BIT - bit_location;
               bits >>= bit_location;
               if(bits)
                  val.resize(2, 2); // May throw!
            }
         }

         template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
         inline void resize_to_bit_size(cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>& newval, unsigned bits, const mpl::false_&)
         {
            unsigned limb_count = static_cast<unsigned>(bits / (sizeof(limb_type) * CHAR_BIT));
            if(bits % (sizeof(limb_type) * CHAR_BIT))
               ++limb_count;
            static const unsigned max_limbs = MaxBits ? MaxBits / (CHAR_BIT * sizeof(limb_type)) + ((MaxBits % (CHAR_BIT * sizeof(limb_type))) ? 1 : 0) : (std::numeric_limits<unsigned>::max)();
            if(limb_count > max_limbs)
               limb_count = max_limbs;
            newval.resize(limb_count, limb_count);
            std::memset(newval.limbs(), 0, newval.size() * sizeof(limb_type));
         }
         template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator>
         inline void resize_to_bit_size(cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>& newval, unsigned, const mpl::true_&)
         {
            *newval.limbs() = 0;
         }

         template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, expression_template_option ExpressionTemplates, class Iterator>
         number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>&
            import_bits_generic(
               number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>& val, Iterator i, Iterator j, unsigned chunk_size = 0, bool msv_first = true)
         {
            typename number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>::backend_type newval;

            typedef typename std::iterator_traits<Iterator>::value_type       value_type;
            typedef typename boost::make_unsigned<value_type>::type           unsigned_value_type;
            typedef typename std::iterator_traits<Iterator>::difference_type  difference_type;
            typedef typename boost::make_unsigned<difference_type>::type      size_type;
            typedef typename cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>::trivial_tag tag_type;

            if(!chunk_size)
               chunk_size = std::numeric_limits<value_type>::digits;

            size_type limbs = std::distance(i, j);
            size_type bits = limbs * chunk_size;

            detail::resize_to_bit_size(newval, static_cast<unsigned>(bits), tag_type());

            difference_type bit_location = msv_first ? bits - chunk_size : 0;
            difference_type bit_location_change = msv_first ? -static_cast<difference_type>(chunk_size) : chunk_size;

            while(i != j)
            {
               detail::assign_bits(newval, static_cast<unsigned_value_type>(*i), static_cast<unsigned>(bit_location), chunk_size, tag_type());
               ++i;
               bit_location += bit_location_change;
            }

            newval.normalize();

            val.backend().swap(newval);
            return val;
         }

         template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, expression_template_option ExpressionTemplates, class T>
         inline typename boost::disable_if_c<boost::multiprecision::backends::is_trivial_cpp_int<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value, number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>&>::type
            import_bits_fast(
               number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>& val, T* i, T* j, unsigned chunk_size = 0)
         {
            std::size_t byte_len = (j - i) * (chunk_size ? chunk_size / CHAR_BIT : sizeof(*i));
            std::size_t limb_len = byte_len / sizeof(limb_type);
            if(byte_len % sizeof(limb_type))
               ++limb_len;
            cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>& result = val.backend();
            result.resize(static_cast<unsigned>(limb_len), static_cast<unsigned>(limb_len));  // checked types may throw here if they're not large enough to hold the data!
            result.limbs()[result.size() - 1] = 0u;
            std::memcpy(result.limbs(), i, std::min(byte_len, result.size() * sizeof(limb_type)));
            result.normalize(); // In case data has leading zeros.
            return val;
         }
         template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, expression_template_option ExpressionTemplates, class T>
         inline typename boost::enable_if_c<boost::multiprecision::backends::is_trivial_cpp_int<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator> >::value, number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>&>::type
            import_bits_fast(
               number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>& val, T* i, T* j, unsigned chunk_size = 0)
         {
            cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>& result = val.backend();
            std::size_t byte_len = (j - i) * (chunk_size ? chunk_size / CHAR_BIT : sizeof(*i));
            std::size_t limb_len = byte_len / sizeof(result.limbs()[0]);
            if(byte_len % sizeof(result.limbs()[0]))
               ++limb_len;
            result.limbs()[0] = 0u;
            result.resize(static_cast<unsigned>(limb_len), static_cast<unsigned>(limb_len));  // checked types may throw here if they're not large enough to hold the data!
            std::memcpy(result.limbs(), i, std::min(byte_len, result.size() * sizeof(result.limbs()[0])));
            result.normalize(); // In case data has leading zeros.
            return val;
         }
      }


      template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, expression_template_option ExpressionTemplates, class Iterator>
      inline number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>&
         import_bits(
            number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>& val, Iterator i, Iterator j, unsigned chunk_size = 0, bool msv_first = true)
      {
         return detail::import_bits_generic(val, i, j, chunk_size, msv_first);
      }

      template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, expression_template_option ExpressionTemplates, class T>
      inline number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>&
         import_bits(
            number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>& val, T* i, T* j, unsigned chunk_size = 0, bool msv_first = true)
      {
#ifdef BOOST_LITTLE_ENDIAN
         if(((chunk_size % CHAR_BIT) == 0) && !msv_first)
            return detail::import_bits_fast(val, i, j, chunk_size);
#endif
         return detail::import_bits_generic(val, i, j, chunk_size, msv_first);
      }

      namespace detail {

         template <class Backend>
         boost::uintmax_t extract_bits(const Backend& val, unsigned location, unsigned count, const mpl::false_& tag)
         {
            unsigned limb = location / (sizeof(limb_type) * CHAR_BIT);
            unsigned shift = location % (sizeof(limb_type) * CHAR_BIT);
            boost::uintmax_t result = 0;
            boost::uintmax_t mask = count == std::numeric_limits<boost::uintmax_t>::digits ? ~static_cast<boost::uintmax_t>(0) : (static_cast<boost::uintmax_t>(1u) << count) - 1;
            if(count > (sizeof(limb_type) * CHAR_BIT - shift))
            {
               result = extract_bits(val, location + sizeof(limb_type) * CHAR_BIT - shift, count - sizeof(limb_type) * CHAR_BIT + shift, tag);
               result <<= sizeof(limb_type) * CHAR_BIT - shift;
            }
            if(limb < val.size())
               result |= (val.limbs()[limb] >> shift) & mask;
            return result;
         }

         template <class Backend>
         inline boost::uintmax_t extract_bits(const Backend& val, unsigned location, unsigned count, const mpl::true_&)
         {
            boost::uintmax_t result = *val.limbs();
            boost::uintmax_t mask = count == std::numeric_limits<boost::uintmax_t>::digits ? ~static_cast<boost::uintmax_t>(0) : (static_cast<boost::uintmax_t>(1u) << count) - 1;
            return (result >> location) & mask;
         }

      }

      template <unsigned MinBits, unsigned MaxBits, cpp_integer_type SignType, cpp_int_check_type Checked, class Allocator, expression_template_option ExpressionTemplates, class OutputIterator>
      OutputIterator export_bits(
         const number<cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>, ExpressionTemplates>& val, OutputIterator out, unsigned chunk_size, bool msv_first = true)
      {
#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable:4244)
#endif
         typedef typename cpp_int_backend<MinBits, MaxBits, SignType, Checked, Allocator>::trivial_tag tag_type;
         if(!val)
         {
            *out = 0;
            ++out;
            return out;
         }
         unsigned bitcount = boost::multiprecision::backends::eval_msb_imp(val.backend()) + 1;
         unsigned chunks = bitcount / chunk_size;
         if(bitcount % chunk_size)
            ++chunks;

         int bit_location = msv_first ? bitcount - chunk_size : 0;
         int bit_step = msv_first ? -static_cast<int>(chunk_size) : chunk_size;
         while(bit_location % bit_step) ++bit_location;

         do
         {
            *out = detail::extract_bits(val.backend(), bit_location, chunk_size, tag_type());
            ++out;
            bit_location += bit_step;
         } while((bit_location >= 0) && (bit_location < (int)bitcount));

         return out;
#ifdef _MSC_VER
#pragma warning(pop)
#endif
      }

   }
}



#endif // BOOST_MP_CPP_INT_IMPORT_EXPORT_HPP

