import { Injectable } from '@angular/core';

export interface DynamicDict {[key:string]:any}
export interface NestedDict {[key:string]:DynamicDict}

@Injectable({
  providedIn: 'root',
})

export class GlobalStateManager{

    public CurrentLabelSet:string[] = [];
    public CurrentTotalLabelSet:string[] = [];
    public CurrentDataSet:[number,number][][] = [];
    public MetricDict:DynamicDict = {};
    public MetricDictKeys:string[] = [];

    public async FetchRoute(Route:string,ReturnType:string):Promise<any>{
        const response = await fetch(`/api/${Route}`);
        if(ReturnType==="json"){
            return await response.json();
        } else if (ReturnType==="string") {
            return await response.text();
        } else {
            await response;
        }
    }
    public GetKeyofObj(Obj:{}):string[]{return Object.keys(Obj);}

    public PrettyJSON(JSONObject:DynamicDict):string{return JSON.stringify(JSONObject,null,2);}
}