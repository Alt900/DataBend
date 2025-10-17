#include "DataManagement.hpp"

namespace DataManagement {
  ToolKit::ToolKit(){

  };

  void ToolKit::ReadJSONReturnSerialized() {
    std::ifstream File(ActiveFilePath);
    JSONObject = nlohmann::json::parse(File);
    if (File.is_open()) {
      File.close();
    }
  }

  void ToolKit::AppendMetricEntry(std::string DictString) {
    auto SerializedObject = nlohmann::json::parse(DictString);
    if(JSONObject.is_array() && JSONObject.at(0).is_object()){
      const size_t Last = JSONObject.size();
      auto& LastObject = JSONObject.at(Last-1);
      if(LastObject.is_object() && LastObject.contains("tag")){
        if(LastObject["tag"] == "METRICSDICT"){
          LastObject.update(SerializedObject);
        } else {
          JSONObject.push_back(SerializedObject);
        }
      } else {
        JSONObject.push_back(SerializedObject);
      }
    }else if(JSONObject.is_object()){
      JSONObject.update(SerializedObject);
    }
    JSONString = JSONObject.dump();
  }

  void ToolKit::ReadJSONReturnString() {
    std::stringstream JSONBuffer;
    std::ifstream File(ActiveFilePath);
    JSONBuffer << File.rdbuf();
    JSONString = JSONBuffer.str();
    if (File.is_open()) {
      File.close();
    }
  }

  void ToolKit::WriteJSON(std::string filename) {
    std::ofstream OutputJSON(filename);
    if (OutputJSON.is_open()) {
      OutputJSON << JSONString;
      OutputJSON.close();
    }
  }
}
