// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #include <unordered_map>

 #include <float.h>
 #include <math.h>
 #include <stdint.h>

 #import <Accelerate/Accelerate.h>

 #include "FBSDKTensor.hpp"

 #define SEQ_LEN 128
 #define DENSE_FEATURE_LEN 30

namespace fbsdk {
  static void relu(MTensor &x)
  {
    float min = 0;
    float max = FLT_MAX;
    float *x_data = x.mutable_data();
    vDSP_vclip(x_data, 1, &min, &max, x_data, 1, x.count());
  }

  static void flatten(MTensor &x, int start_dim)
  {
    const std::vector<int> &shape = x.sizes();
    std::vector<int> new_shape;
    for (int i = 0; i < start_dim; i++) {
      new_shape.push_back(shape[i]);
    }
    int count = 1;
    for (int i = start_dim; i < shape.size(); i++) {
      count *= shape[i];
    }
    new_shape.push_back(count);
    x.Reshape(new_shape);
  }

  static MTensor concatenate(std::vector<MTensor *> &tensors)
  {
    int n_examples = tensors[0]->size(0);
    int count = 0;
    for (int i = 0; i < tensors.size(); i++) {
      count += tensors[i]->size(1);
    }
    MTensor y({n_examples, count});
    float *y_data = y.mutable_data();
    for (int i = 0; i < tensors.size(); i++) {
      int this_count = (int)tensors[i]->size(1);
      const float *this_data = tensors[i]->data();
      for (int n = 0; n < n_examples; n++) {
        memcpy(y_data + n * count, this_data + n * this_count, this_count * sizeof(float));
      }
      y_data += this_count;
    }
    return y;
  }

  static void softmax(MTensor &x)
  {
    int n_examples = x.size(0);
    int n_channel = x.size(1);
    float *x_data = x.mutable_data();
    float max;
    float sum;
    for (int n = 0; n < n_examples; n++) {
      vDSP_maxv(x_data, 1, &max, n_channel);
      max = -max;
      vDSP_vsadd(x_data, 1, &max, x_data, 1, n_channel);
      vvexpf(x_data, x_data, &n_channel);
      vDSP_sve(x_data, 1, &sum, n_channel);
      vDSP_vsdiv(x_data, 1, &sum, x_data, 1, n_channel);
      x_data += n_channel;
    }
  }

  static std::vector<int> vectorize(const char *texts, const int seq_length)
  {
    int str_len = (int)strlen(texts);
    std::vector<int> vec(seq_length, 0);
    for (int i = 0; i < seq_length; i++) {
      if (i < str_len) {
        vec[i] = static_cast<unsigned char>(texts[i]);
      }
    }
    return vec;
  }

  static MTensor embedding(const char *texts, const int seq_length, const MTensor &w)
  {
    // TODO: T65152708 support batch prediction
    const std::vector<int> &vec = vectorize(texts, seq_length);
    int n_examples = 1;
    int embedding_size = w.size(1);
    MTensor y({n_examples, seq_length, embedding_size});
    const float *w_data = w.data();
    float *y_data = y.mutable_data();
    for (int i = 0; i < n_examples; i++) {
      for (int j = 0; j < seq_length; j++) {
        memcpy(y_data, w_data + vec[i * seq_length + j] * embedding_size, (size_t)(embedding_size * sizeof(float)));
        y_data += embedding_size;
      }
    }
    return y;
  }

  /*
   x shape: n_examples, in_vector_size
   w shape: in_vector_size, out_vector_size
   b shape: out_vector_size
   return shape: n_examples, out_vector_size
   */
  static MTensor dense(const MTensor &x, const MTensor &w, const MTensor &b)
  {
    int n_examples = x.size(0);
    int in_vector_size = x.size(1);
    int out_vector_size = w.size(1);
    MTensor y({n_examples, out_vector_size});
    float *y_data = y.mutable_data();
    const float *b_data = b.data();
    vDSP_mmul(x.data(), 1, w.data(), 1, y_data, 1, n_examples, out_vector_size, in_vector_size);
    for (int i = 0; i < out_vector_size; i++) {
      vDSP_vsadd(y_data + i, out_vector_size, b_data + i, y_data + i, out_vector_size, n_examples);
    }
    return y;
  }

  /*
   x shape: n_examples, seq_len, input_size
   w shape: kernel_size, input_size, output_size
   return shape: n_examples, seq_len - kernel_size + 1, output_size
   */
  static MTensor conv1D(const MTensor &x, const MTensor &w)
  {
    int n_examples = x.size(0);
    int seq_len = x.size(1);
    int input_size = x.size(2);
    int kernel_size = w.size(0);
    int output_size = w.size(2);
    MTensor y({n_examples, seq_len - kernel_size + 1, output_size});
    MTensor temp_x({kernel_size, input_size});
    MTensor temp_w({kernel_size, input_size});
    const float *x_data = x.data();
    const float *w_data = w.data();
    float *y_data = y.mutable_data();
    float *temp_x_data = temp_x.mutable_data();
    float *temp_w_data = temp_w.mutable_data();
    float sum;
    for (int n = 0; n < n_examples; n++) {
      for (int o = 0; o < output_size; o++) {
        for (int i = 0; i < seq_len - kernel_size + 1; i++) {
          for (int m = 0; m < kernel_size; m++) {
            for (int k = 0; k < input_size; k++) {
              temp_x_data[m * input_size + k] = x_data[n * (seq_len * input_size) + (m + i) * input_size + k];
              temp_w_data[m * input_size + k] = w_data[(m * input_size + k) * output_size + o];
            }
          }
          vDSP_dotpr(temp_x_data, 1, temp_w_data, 1, &sum, (size_t)(kernel_size * input_size));
          y_data[(n * (output_size * (seq_len - kernel_size + 1)) + i * output_size + o)] = sum;
        }
      }
    }
    return y;
  }

  /*
   input shape: n_examples, len, n_channel
   return shape: n_examples, len - pool_size + 1, n_channel
   */
  static MTensor maxPool1D(const MTensor &x, const int pool_size)
  {
    int n_examples = x.size(0);
    int input_len = x.size(1);
    int n_channel = x.size(2);
    int output_len = input_len - pool_size + 1;
    MTensor y({n_examples, output_len, n_channel});
    const float *x_data = x.data();
    float *y_data = y.mutable_data();
    for (int n = 0; n < n_examples; n++) {
      for (int c = 0; c < n_channel; c++) {
        for (int i = 0; i < output_len; i++) {
          float this_max = -FLT_MAX;
          for (int r = i; r < i + pool_size; r++) {
            this_max = fmax(this_max, x_data[n * (n_channel * input_len) + r * n_channel + c]);
          }
          y_data[n * (n_channel * output_len) + i * n_channel + c] = this_max;
        }
      }
    }
    return y;
  }

  /*
   input shape: m, n
   return shape: n, m
   */
  static MTensor transpose2D(const MTensor &x)
  {
    int m = x.size(0);
    int n = x.size(1);
    MTensor y({n, m});
    float *y_data = y.mutable_data();
    const float *x_data = x.data();
    for (int i = 0; i < m; i++) {
      for (int j = 0; j < n; j++) {
        y_data[j * m + i] = x_data[i * n + j];
      }
    }
    return y;
  }

  /*
   input shape: m, n, p
   return shape: p, n, m
   */
  static MTensor transpose3D(const MTensor &x)
  {
    int m = x.size(0);
    int n = x.size(1);
    int p = x.size(2);
    MTensor y({p, n, m});
    float *y_data = y.mutable_data();
    const float *x_data = x.data();
    for (int i = 0; i < m; i++) {
      for (int j = 0; j < n; j++) {
        for (int k = 0; k < p; k++) {
          y_data[k * m * n + j * m + i] = x_data[i * n * p + j * p + k];
        }
      }
    }
    return y;
  }

  static void addmv(MTensor &y, const MTensor &x)
  {
    int m = y.size(0);
    int n = y.size(1);
    int p = y.size(2);
    float *y_data = y.mutable_data();
    const float *x_data = x.data();
    for (int i = 0; i < p; i++) {
      vDSP_vsadd(y_data + i, p, x_data + i, y_data + i, p, m * n);
    }
  }

  static MTensor getDenseTensor(const float *df)
  {
    MTensor dense_tensor({1, DENSE_FEATURE_LEN});
    if (df) {
      memcpy(dense_tensor.mutable_data(), df, DENSE_FEATURE_LEN * sizeof(float));
    } else {
      memset(dense_tensor.mutable_data(), 0, DENSE_FEATURE_LEN * sizeof(float));
    }
    return dense_tensor;
  }

  static MTensor predictOnMTML(const std::string task, const char *texts, const std::unordered_map<std::string, MTensor> &weights, const float *df)
  {
    MTensor dense_tensor = getDenseTensor(df);
    std::string final_layer_weight_key = task + ".weight";
    std::string final_layer_bias_key = task + ".bias";

    const MTensor &embed_t = weights.at("embed.weight");
    const MTensor &conv0w_t = weights.at("convs.0.weight");
    const MTensor &conv1w_t = weights.at("convs.1.weight");
    const MTensor &conv2w_t = weights.at("convs.2.weight");
    const MTensor &conv0b_t = weights.at("convs.0.bias");
    const MTensor &conv1b_t = weights.at("convs.1.bias");
    const MTensor &conv2b_t = weights.at("convs.2.bias");
    const MTensor &fc1w_t = weights.at("fc1.weight"); // (128, 190)
    const MTensor &fc1b_t = weights.at("fc1.bias"); // 128
    const MTensor &fc2w_t = weights.at("fc2.weight"); // (64, 128)
    const MTensor &fc2b_t = weights.at("fc2.bias"); // 64
    const MTensor &final_layer_weight_t = weights.at(final_layer_weight_key); // (2, 64) or (5, 64)
    const MTensor &final_layer_bias_t = weights.at(final_layer_bias_key); // 2 or 5

    const MTensor &convs_0_weight = transpose3D(conv0w_t);
    const MTensor &convs_1_weight = transpose3D(conv1w_t);
    const MTensor &convs_2_weight = transpose3D(conv2w_t);
    const MTensor &fc1_weight = transpose2D(fc1w_t);
    const MTensor &fc2_weight = transpose2D(fc2w_t);
    const MTensor &final_layer_weight = transpose2D(final_layer_weight_t);

    // embedding
    const MTensor &embed_x = embedding(texts, SEQ_LEN, embed_t);

    // conv0
    MTensor c0 = conv1D(embed_x, convs_0_weight); // (1, 126, 32)
    addmv(c0, conv0b_t);
    relu(c0);

    // conv1
    MTensor c1 = conv1D(c0, convs_1_weight); // (1, 124, 64)
    addmv(c1, conv1b_t);
    relu(c1);
    c1 = maxPool1D(c1, 2); // (1, 123, 64)

    // conv2
    MTensor c2 = conv1D(c1, convs_2_weight); // (1, 121, 64)
    addmv(c2, conv2b_t);
    relu(c2);

    // max pooling
    MTensor ca = maxPool1D(c0, c0.size(1));
    MTensor cb = maxPool1D(c1, c1.size(1));
    MTensor cc = maxPool1D(c2, c2.size(1));

    // concatenate
    flatten(ca, 1);
    flatten(cb, 1);
    flatten(cc, 1);
    std::vector<MTensor *> concat_tensors { &ca, &cb, &cc, &dense_tensor };
    const MTensor &concat = concatenate(concat_tensors);

    // dense + relu
    MTensor dense1_x = dense(concat, fc1_weight, fc1b_t);
    relu(dense1_x);
    MTensor dense2_x = dense(dense1_x, fc2_weight, fc2b_t);
    relu(dense2_x);
    MTensor final_layer_dense_x = dense(dense2_x, final_layer_weight, final_layer_bias_t);
    softmax(final_layer_dense_x);
    return final_layer_dense_x;
  }
}

#endif
