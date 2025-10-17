#include "Statistics.hpp"
namespace Statistics {
  Metrics::Metrics() {
    const std::vector<std::vector<float>> EmptyMatrix;
    DatasetMatrix = EmptyMatrix;
  }
  std::vector<float> Metrics::C_Mean(){
    std::vector<float> MeanArray;
    std::vector<float> SumVector = BasicSum();
    for (size_t I = 0; I < RowI; I++) {
      MeanArray.push_back(SumVector[I] / ColJ);
    }
    return MeanArray;
  }

  std::vector<float> Metrics::C_Median() {
    std::vector<std::vector<float>> SortedMatrix = SortMatrix();
    std::vector<float> MedianArray;
    if (ColJ % 2 == 1) {
      const size_t J = ColJ / 2;
      for (size_t I = 0; I < RowI; I++) {
        MedianArray.push_back(SortedMatrix[I][J]);
      }
    }
    else {
      const size_t J = ColJ / 2;
      const size_t J1 = J - 1;
      for (size_t I = 0; I < RowI; I++) {
        const float Median = (SortedMatrix[I][J1] + SortedMatrix[I][J])/2.0f;
        MedianArray.push_back(Median);
      }
    }
    return MedianArray;
  }

  std::vector<float> Metrics::C_Mode() {
    std::vector<float> ModeArray;
    for (size_t I = 0; I < RowI; I++) {
      std::unordered_map<float,float> FrequencyMap;
      for(size_t J = 0; J < ColJ; J++){
        FrequencyMap[DatasetMatrix[I][J]]++;
      }
      auto MaxFrequency = std::max_element(FrequencyMap.begin(),FrequencyMap.end(),[](const auto& a, const auto& b){return a.second < b.second;});
      ModeArray.push_back(MaxFrequency->first);
    }
    return ModeArray;
  }

  std::vector<float> Metrics::C_Min() {
    std::vector<float> MinVector;
    for (size_t I = 0; I < RowI; I++) {
      MinVector.push_back(float(*std::min_element(DatasetMatrix[I].begin(), DatasetMatrix[I].end())));
    }
    return MinVector;
  }

  std::vector<float> Metrics::C_Max() {
    std::vector<float> MaxVector;
    for (size_t I = 0; I < RowI; I++) {
      MaxVector.push_back(float(*std::max_element(DatasetMatrix[I].begin(), DatasetMatrix[I].end())));
    }
    return MaxVector;
  }

  std::vector<float> Metrics::C_Range() {
    std::vector<float> RangeVector;
    for (size_t I = 0; I < RowI; I++) {
      auto min_val = std::min_element(DatasetMatrix[I].begin(), DatasetMatrix[I].end()); //ptr
      auto max_val = std::max_element(DatasetMatrix[I].begin(), DatasetMatrix[I].end());//ptr
      RangeVector.push_back(*max_val - *min_val);
    }
    return RangeVector;
  }

  std::vector<float> Metrics::C_Variance(std::string VarianceType, int SampleSize) {//check against python
    std::vector<float> VarianceVector;
    std::vector<float> MeanVector = C_Mean();
    size_t N;
    size_t Denom;
    if (VarianceType == "population") {
      N = ColJ;
      Denom = N;
    }
    else {//variance type sample 
      N = SampleSize;
      Denom = N - 1;
    }
    for (size_t I = 0; I < RowI; I++) {
      float Sum = 0.0f;
      for (size_t J = 0; J < N; J++) {
        float Diff = DatasetMatrix[I][J] - MeanVector[I];
        Sum += Diff * Diff;
      }
      Sum = Sum / Denom;
      VarianceVector.push_back(Sum);
    }
    return VarianceVector;
  }

  std::vector<float> Metrics::C_StdDeviation() {//result does not match python
    std::vector<float> StdDevVector;
    std::vector<float> MeanVector = C_Mean();
    for (size_t I = 0; I < RowI; I++) {
      float Sum = 0.0f;
      for (size_t J = 0; J < ColJ; J++) {
        float Diff = DatasetMatrix[I][J] - MeanVector[I];
        Sum += Diff * Diff;
      }
      Sum = std::sqrt(Sum / ColJ);
      StdDevVector.push_back(Sum);
    }
    return StdDevVector;
  }

  size_t Metrics::MedianIndex(size_t Lower, size_t Range){
    size_t N = Range - Lower + 1;
    N = (N+1)/2-1;
    return N+Lower;
  }

  std::vector<float> Metrics::C_CoefficientOfVariation() {//check against Python
    std::vector<float> VariationCoeffVector;
    std::vector<float> StdDevVector = C_StdDeviation();
    std::vector<float> MeanVector = C_Mean();
    for (size_t I = 0; I < RowI; I++) {
      VariationCoeffVector.push_back((StdDevVector[I] / MeanVector[I])*100);
    }
    return VariationCoeffVector;
  }

  std::vector<float> Metrics::C_IQR() {
    std::vector<float> IRQVector;
    std::vector<std::vector<float>> SortedMatrix = SortMatrix();
    size_t N = SortedMatrix[0].size();
    size_t Mid_Index = MedianIndex(0,N-1);
    if(N%2==0){
      for(size_t I = 0; I < RowI; I++){
        float Q1 = SortedMatrix[I][MedianIndex(0,Mid_Index)];
        float Q3 = SortedMatrix[I][MedianIndex(Mid_Index+1,N-1)];
        IRQVector.push_back(Q3-Q1);
      }
    } else{
      for(size_t I = 0; I < RowI; I++){
        float Q1 = SortedMatrix[I][MedianIndex(0,Mid_Index-1)];
        float Q3 = SortedMatrix[I][MedianIndex(Mid_Index+1,N)];
        IRQVector.push_back(Q3-Q1);
      }
    }
    return IRQVector;
  }

  std::vector<float> Metrics::C_PearsonCorrelationCoefficientOverTime() {
    std::vector<float> PearsonVector;
    const float XSum = LinearQuickSumofX(1.0);//sum(x) where any x_i - x_i-1 = 1 I;E [1,2,3,4,5,6,7,...]
    const float XSumSquared = XSum * XSum;//sum(x)^2
    float SquaredXSum = 0.0;//sum(x^2)
    for (size_t J = 0; J < ColJ; J++) {
      SquaredXSum += J * J;
    }
    const float DenominatorLeft = std::sqrt(ColJ*SquaredXSum-XSumSquared);
    for (size_t I = 0; I < RowI; I++) {
      float XYSum = 0.0;//sum(x*y)
      float YSum = 0.0;//sum(y)
      float SquaredYSum = 0.0;//sum(y^2)
      for (size_t J = 0; J < ColJ; J++) {
        YSum += DatasetMatrix[I][J];
        SquaredYSum += DatasetMatrix[I][J] * DatasetMatrix[I][J];
        XYSum += J * DatasetMatrix[I][J];
      }
      const float YSumSquared = YSum * YSum;//sum(y)^2
      const float Numerator = XYSum - XSum * YSum;
      const float Denominator = DenominatorLeft * std::sqrt(ColJ * SquaredYSum - YSumSquared);
      PearsonVector.push_back(Numerator/Denominator);
    }
    return PearsonVector;
  }

  void Metrics::SwapMatrix(std::vector<std::vector<float>> NewMatrix) {
    DatasetMatrix = NewMatrix;
    RowI = DatasetMatrix.size();
    ColJ = DatasetMatrix[0].size();
  }


  //private functions
  std::vector<std::vector<float>> Metrics::SortMatrix() {
    std::vector<std::vector<float>> TempMatrix = DatasetMatrix;
    for (size_t I = 0; I < RowI; I++) {
      std::sort(std::begin(TempMatrix[I]), std::end(TempMatrix[I]));
    }
    return TempMatrix;
  }

  std::vector<float> Metrics::BasicSum() {
    std::vector<float> SumVector;
    for (size_t I = 0; I < RowI; I++) {
      float Sum = .0f;
      for (size_t J = 0; J < ColJ; J++) {
        Sum += DatasetMatrix[I][J];
      }
      SumVector.push_back(Sum);
    }
    return SumVector;
  }

  //X is guaranteed linear in time and raw index
  float Metrics::LinearQuickSumofX(float DeltaX) {return DeltaX*(RowI * (RowI - 1) / 2);}
}
