#include "crow.h"
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

#include "CPPMath.hpp"

using namespace std;
using namespace crow;
using namespace CPPMath;

int main() {
  class CrowAPIServer {
  public:
    SimpleApp app;
    vector<vector<string>> TempDocs;
    Statistics::Metrics* MetricsObject = new Statistics::Metrics();
    DataManagement::ToolKit* DataManagementObject = new DataManagement::ToolKit();

    CrowAPIServer() {

      CROW_ROUTE(app, "/api/CalculateMean")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_Mean());
        });

      CROW_ROUTE(app, "/api/CalculateMode")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_Mode());
        });

      CROW_ROUTE(app, "/api/CalculateMedian")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_Median());
        });
      
      CROW_ROUTE(app, "/api/CalculateSum")([this]() {//checked
        return FloatVectorToString(MetricsObject->BasicSum());
        });

      CROW_ROUTE(app, "/api/CalculateMin")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_Min());
        });

      CROW_ROUTE(app, "/api/CalculateMax")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_Max());
        });

      CROW_ROUTE(app, "/api/CalculateIQR")([this](const request& Args) {//checked
        return FloatVectorToString(MetricsObject->C_IQR());
        });

      CROW_ROUTE(app, "/api/CalculateStandard_Deviation")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_StdDeviation());
        });

      CROW_ROUTE(app, "/api/CalculateVariance")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_Variance("population"));
        });

      CROW_ROUTE(app, "/api/CalculateCoefficient_of_Variation")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_CoefficientOfVariation());
        });

      CROW_ROUTE(app, "/api/CalculateRange")([this]() {//checked
        return FloatVectorToString(MetricsObject->C_Range());
        });

      CROW_ROUTE(app, "/api/CalculatePearson_Correlation_Coefficient")([this]() {//pearson correlation coefficient does not match
        return FloatVectorToString(MetricsObject->C_PearsonCorrelationCoefficientOverTime());
        });

      CROW_ROUTE(app, "/api/AppendMetricsToJSON")([this](const request& Args) {
        DataManagementObject->AppendMetricEntry(Args.url_params.get("METRICDICT"));
        return DataManagementObject->JSONString;
        });

      CROW_ROUTE(app, "/api/SaveJSON")([this](const request& Args) {
        DataManagementObject->WriteJSON(Args.url_params.get("PATH"));
        return "JSON has been saved";
        });

      CROW_ROUTE(app, "/api/FetchJSONReturnString")([this](const request& Args) {
        DataManagementObject->ActiveFilePath = Args.url_params.get("PATH");
        DataManagementObject->ReadJSONReturnString();
        return DataManagementObject->JSONString;
        });

      CROW_ROUTE(app, "/api/LoadJSONtoMatrix")([this](const request& Args) {
        DataManagementObject->ActiveFilePath = Args.url_params.get("PATH");
        vector<string> Variables = ReconstructStringVector(Args.url_params.get("VARS"));
        vector<vector<float>> NewMatrix;
        DataManagementObject->ReadJSONReturnSerialized();
        for (size_t I = 0; I < Variables.size(); I++) {
          vector<float> RowEntry;
          for (size_t J = 0; J < DataManagementObject->JSONObject.size(); J++) {
            if (!DataManagementObject->JSONObject[J].contains("tag")) {
              RowEntry.push_back(DataManagementObject->JSONObject[J][Variables[I]]);
            }
            else {
              std::cout << "Found a metrics tag" << std::endl;
            }
          }
          NewMatrix.push_back(RowEntry);
        }
        MetricsObject->SwapMatrix(NewMatrix);
        return "Loaded JSON file as a matrix in statistics";
      });
    };
    void StartServer() {
      app.port(18080).multithreaded().run();
    }
  private:
    string FloatVectorToString(const vector<float>& Vec) {
      string TempString = "(";
      size_t N = Vec.size()-1;
      for (size_t I = 0; I < Vec.size(); I++) {
        TempString.append(to_string(Vec[I]));
        if(I!=N){
          TempString.append(",");
        }
      }
      TempString.append(")");
      return TempString;
    }

    char VectorDelimiter = ',';

    vector<string> ReconstructStringVector(const string& VectorString) {
      stringstream Stream(VectorString);
      string Token;
      vector<string> OutputVector;
      while (getline(Stream, Token, VectorDelimiter)) {
        OutputVector.push_back(Token);
      }
      return OutputVector;
    }
  };

  CrowAPIServer CrowServer;
  CrowServer.StartServer();

  return 0;
}
