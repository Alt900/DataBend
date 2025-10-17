#pragma once
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <nlohmann/json.hpp>

namespace DataManagement {
  class ToolKit {
  public:
    ToolKit();
    std::string JSONString;
    std::string ActiveFilePath;
    nlohmann::json JSONObject;
    nlohmann::json SerializedMetricsDict;
    void ReadJSONReturnSerialized();
    void ReadJSONReturnString();
    void WriteJSON(std::string filename);
    void AppendMetricEntry(std::string DictString);
  };
}
