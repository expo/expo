//---------------------------------------------------------------------------//
// Copyright (c) 2015 Muhammad Junaid Muzammil <mjunaidmuzammil@gmail.com>
//
// Distributed under the Boost Software License, Version 1.0
// See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt
//
// See http://boostorg.github.com/compute for more information.
//---------------------------------------------------------------------------//

#ifndef BOOST_COMPUTE_RANDOM_THREEFRY_HPP
#define BOOST_COMPUTE_RANDOM_THREEFRY_HPP

#include <algorithm>

#include <boost/compute/types.hpp>
#include <boost/compute/buffer.hpp>
#include <boost/compute/kernel.hpp>
#include <boost/compute/context.hpp>
#include <boost/compute/program.hpp>
#include <boost/compute/command_queue.hpp>
#include <boost/compute/algorithm/transform.hpp>
#include <boost/compute/detail/iterator_range_size.hpp>
#include <boost/compute/utility/program_cache.hpp>
#include <boost/compute/container/vector.hpp>
#include <boost/compute/iterator/discard_iterator.hpp>

namespace boost {
namespace compute {

/// \class threefry_engine
/// \brief Threefry pseudorandom number generator.
template<class T = uint_>
class threefry_engine
{
public:
    static const size_t threads = 1024;
    typedef T result_type;

    /// Creates a new threefry_engine and seeds it with \p value.
    explicit threefry_engine(command_queue &queue)
        : m_context(queue.get_context())
    {
        // setup program
        load_program();
    }

    /// Creates a new threefry_engine object as a copy of \p other.
    threefry_engine(const threefry_engine<T> &other)
        : m_context(other.m_context),
          m_program(other.m_program)
    {
    }

    /// Copies \p other to \c *this.
    threefry_engine<T>& operator=(const threefry_engine<T> &other)
    {
        if(this != &other){
            m_context = other.m_context;
            m_program = other.m_program;
        }

        return *this;
    }

    /// Destroys the threefry_engine object.
    ~threefry_engine()
    {
    }

private:
    /// \internal_
    void load_program()
    {
        boost::shared_ptr<program_cache> cache =
            program_cache::get_global_cache(m_context);
        std::string cache_key =
            std::string("threefry_engine_32x2");

        // Copyright 2010-2012, D. E. Shaw Research.
        // All rights reserved.

        // Redistribution and use in source and binary forms, with or without
        // modification, are permitted provided that the following conditions are
        // met:

        // * Redistributions of source code must retain the above copyright
        //   notice, this list of conditions, and the following disclaimer.

        // * Redistributions in binary form must reproduce the above copyright
        //   notice, this list of conditions, and the following disclaimer in the
        //   documentation and/or other materials provided with the distribution.

        // * Neither the name of D. E. Shaw Research nor the names of its
        //   contributors may be used to endorse or promote products derived from
        //   this software without specific prior written permission.

        // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
        // "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
        // LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
        // A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
        // OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
        // SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
        // LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
        // DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
        // THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
        // (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
        // OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        const char source[] =
            "#define THREEFRY2x32_DEFAULT_ROUNDS 20\n"
            "#define SKEIN_KS_PARITY_32 0x1BD11BDA\n"

            "enum r123_enum_threefry32x2 {\n"
            "    R_32x2_0_0=13,\n"
            "    R_32x2_1_0=15,\n"
            "    R_32x2_2_0=26,\n"
            "    R_32x2_3_0= 6,\n"
            "    R_32x2_4_0=17,\n"
            "    R_32x2_5_0=29,\n"
            "    R_32x2_6_0=16,\n"
            "    R_32x2_7_0=24\n"
            "};\n"

            "static uint RotL_32(uint x, uint N)\n"
            "{\n"
            "    return (x << (N & 31)) | (x >> ((32-N) & 31));\n"
            "}\n"
                
            "struct r123array2x32 {\n"
            "    uint v[2];\n"
            "};\n"
            "typedef struct r123array2x32 threefry2x32_ctr_t;\n"
            "typedef struct r123array2x32 threefry2x32_key_t;\n"

            "threefry2x32_ctr_t threefry2x32_R(unsigned int Nrounds, threefry2x32_ctr_t in, threefry2x32_key_t k)\n"
            "{\n"
            "    threefry2x32_ctr_t X;\n"
            "    uint ks[3];\n"
            "    uint  i; \n"
            "    ks[2] =  SKEIN_KS_PARITY_32;\n"
            "    for (i=0;i < 2; i++) {\n"
            "        ks[i] = k.v[i];\n"
            "        X.v[i]  = in.v[i];\n"
            "        ks[2] ^= k.v[i];\n"
            "    }\n"
            "    X.v[0] += ks[0]; X.v[1] += ks[1];\n"
            "    if(Nrounds>0){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_0_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>1){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_1_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>2){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_2_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>3){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_3_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>3){\n"
            "        X.v[0] += ks[1]; X.v[1] += ks[2];\n"
            "        X.v[1] += 1;\n"
            "    }\n"
            "    if(Nrounds>4){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_4_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>5){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_5_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>6){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_6_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>7){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_7_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>7){\n"
            "        X.v[0] += ks[2]; X.v[1] += ks[0];\n"
            "        X.v[1] += 2;\n"
            "    }\n"
            "    if(Nrounds>8){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_0_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>9){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_1_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>10){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_2_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>11){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_3_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>11){\n"
            "        X.v[0] += ks[0]; X.v[1] += ks[1];\n"
            "        X.v[1] += 3;\n"
            "    }\n"
            "    if(Nrounds>12){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_4_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>13){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_5_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>14){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_6_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>15){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_7_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>15){\n"
            "        X.v[0] += ks[1]; X.v[1] += ks[2];\n"
            "        X.v[1] += 4;\n"
            "    }\n"
            "    if(Nrounds>16){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_0_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>17){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_1_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>18){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_2_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>19){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_3_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>19){\n"
            "        X.v[0] += ks[2]; X.v[1] += ks[0];\n"
            "        X.v[1] += 5;\n"
            "    }\n"
            "    if(Nrounds>20){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_4_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>21){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_5_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>22){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_6_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>23){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_7_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>23){\n"
            "        X.v[0] += ks[0]; X.v[1] += ks[1];\n"
            "        X.v[1] += 6;\n"
            "    }\n"
            "    if(Nrounds>24){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_0_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>25){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_1_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>26){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_2_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>27){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_3_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>27){\n"
            "        X.v[0] += ks[1]; X.v[1] += ks[2];\n"
            "        X.v[1] += 7;\n"
            "    }\n"
            "    if(Nrounds>28){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_4_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>29){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_5_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>30){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_6_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>31){  X.v[0] += X.v[1]; X.v[1] = RotL_32(X.v[1],R_32x2_7_0); X.v[1] ^= X.v[0]; }\n"
            "    if(Nrounds>31){\n"
            "        X.v[0] += ks[2]; X.v[1] += ks[0];\n"
            "        X.v[1] += 8;\n"
            "    }\n"
            "    return X;\n"
            "}\n"

            "__kernel void generate_rng(__global uint *ctr, __global uint *key, const uint offset) {\n"
            "    threefry2x32_ctr_t in;\n"
            "    threefry2x32_key_t k;\n"
            "    const uint i = get_global_id(0);\n"
            "    in.v[0] = ctr[2 * (offset + i)];\n"
            "    in.v[1] = ctr[2 * (offset + i) + 1];\n"
            "    k.v[0] = key[2 * (offset + i)];\n"
            "    k.v[1] = key[2 * (offset + i) + 1];\n"
            "    in = threefry2x32_R(20, in, k);\n"
            "    ctr[2 * (offset + i)] = in.v[0];\n"
            "    ctr[2 * (offset + i) + 1] = in.v[1];\n"
            "}\n";

        m_program = cache->get_or_build(cache_key, std::string(), source, m_context);
    }

public:


    /// Generates Threefry random numbers using both the counter and key values, and then stores
    /// them to the range [\p first_ctr, \p last_ctr).
    template<class OutputIterator>
    void generate(OutputIterator first_ctr, OutputIterator last_ctr, OutputIterator first_key, OutputIterator last_key, command_queue &queue) {
        const size_t size_ctr = detail::iterator_range_size(first_ctr, last_ctr);
        const size_t size_key = detail::iterator_range_size(first_key, last_key);
        if(!size_ctr || !size_key || (size_ctr != size_key)) {
            return;
        }
        kernel rng_kernel = m_program.create_kernel("generate_rng");
       
        rng_kernel.set_arg(0, first_ctr.get_buffer());
        rng_kernel.set_arg(1, first_key.get_buffer());
        size_t offset = 0;

        for(;;){
            size_t count = 0;
            size_t size = size_ctr/2;
            if(size > threads){
                count = (std::min)(static_cast<size_t>(threads), size - offset);
            }
            else {
                count = size;
            }
            rng_kernel.set_arg(2, static_cast<const uint_>(offset));
            queue.enqueue_1d_range_kernel(rng_kernel, 0, count, 0);

            offset += count;

            if(offset >= size){
                break;
            }

        }
    }

    template<class OutputIterator>
    void generate(OutputIterator first_ctr, OutputIterator last_ctr, command_queue &queue) {
        const size_t size_ctr = detail::iterator_range_size(first_ctr, last_ctr);
        if(!size_ctr) {
            return;
        }
        boost::compute::vector<uint_> vector_key(size_ctr, m_context);
        vector_key.assign(size_ctr, 0, queue);
        kernel rng_kernel = m_program.create_kernel("generate_rng");

        rng_kernel.set_arg(0, first_ctr.get_buffer());
        rng_kernel.set_arg(1, vector_key);
        size_t offset = 0;

        for(;;){
            size_t count = 0;
            size_t size = size_ctr/2;
            if(size > threads){
                count = (std::min)(static_cast<size_t>(threads), size - offset);
            }
            else {
                count = size;
            }
            rng_kernel.set_arg(2, static_cast<const uint_>(offset));
            queue.enqueue_1d_range_kernel(rng_kernel, 0, count, 0);

            offset += count;

            if(offset >= size){
                break;
            }

        }
    }
private:
    context m_context;
    program m_program;
};

} // end compute namespace
} // end boost namespace

#endif // BOOST_COMPUTE_RANDOM_THREEFRY_HPP
