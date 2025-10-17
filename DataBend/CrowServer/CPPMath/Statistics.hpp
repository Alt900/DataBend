#pragma once
#include <cmath>
#include <map>
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
#include <unordered_map>
namespace Statistics {
  //every operation will be based on a 2D matrix over T time, if dataset is 1D, the dataset will be DatasetMatrix[0]
  //if DatasetMatrix[0].len : DatasetMatrix[-1].len any == all then the matrix is contiguous and can be accessed as a flattened matrix vector<vector> as vector
  //else, optionally, enforce a contiguous matrix with default values for missing entries using entry n as a template
  class Metrics {
  public:

    Metrics();

    std::vector<float> C_Mean();
    std::vector<float> C_Median();
    std::vector<float> C_Mode();
    std::vector<float> C_Min();
    std::vector<float> C_Max();
    std::vector<float> C_Range();
    std::vector<float> BasicSum();
    std::vector<float> C_Variance(std::string VarianceType = "population", int SampleSize = 15);
    std::vector<float> C_StdDeviation();
    std::vector<float> C_IQR();
    std::vector<float> C_PearsonCorrelationCoefficientOverTime();
    std::vector<float> C_CoefficientOfVariation();
    size_t MedianIndex(size_t Lower, size_t Range);

    void SwapMatrix(std::vector<std::vector<float>> NewMatrix);

    std::vector<std::vector<float>> DatasetMatrix;

  private:
    std::vector<std::vector<float>> SortMatrix();
    float LinearQuickSumofX(float Delta);
    size_t RowI = 0;
    size_t ColJ = 0;
  };
}
