import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';

import { GlobalStateManager, DynamicDict, NestedDict } from './globalstates.service';
import { GraphManager } from './chartmanager.service';

@Component({
  selector: 'app-root',
  imports: [
    DashboardComponent,
    DragDropModule,
    CommonModule,
    MatFormFieldModule,
    MatListModule,
    MatInputModule,
    MatExpansionModule
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  ChartManagerObject = inject(GraphManager);
  GlobalStateManagerObject = inject(GlobalStateManager);

  title = 'DataBend';
  SelectedMetric = "Mean";
  SelectedVariables:string[] = [];
  MetricDictJSONString = "";
  PositionAccumulator = 0;
  InjectionNotification = false;

  DescriptiveStatistics:string[] = [
    "Mean",
    "Median",
    "Mode",
    "Variance",
    "Range",
    "Standard_Deviation",
    "IQR",
    "Coefficient_of_Variation",
    "Pearson_Correlation_Coefficient"
  ];

  ParameterDict:NestedDict = {};

  ngOnInit(){
    this.DescriptiveStatistics.forEach((Element:string)=>{
      this.ParameterDict[Element]={
        "Checked":false
      }
    });
  }

  private async StartInjectionNotificationTimer():Promise<void>{
    this.InjectionNotification = true;
    await new Promise((Resolve)=>setTimeout(Resolve,3000));
    this.InjectionNotification = false;
  }

  async InjectMetricDict():Promise<void>{
    const ShallowCopy:DynamicDict = {}
    ShallowCopy["tag"] = "METRICSDICT";
    this.GlobalStateManagerObject.MetricDictKeys.forEach((Key:string)=>{
      ShallowCopy[Key] = this.GlobalStateManagerObject.MetricDict[Key];
    });
    await this.GlobalStateManagerObject.FetchRoute(`AppendMetricsToJSON?METRICDICT=${JSON.stringify(ShallowCopy)}`,"string");
    this.StartInjectionNotificationTimer();
  }

  async AppendtoDataset(Metric:string):Promise<void>{
    const ShallowCopy:DynamicDict = {}
    ShallowCopy["tag"] = "METRICSDICT";
    this.GlobalStateManagerObject.MetricDictKeys.forEach((Key:string)=>{
      if(Key==Metric){
        ShallowCopy[Key] = this.GlobalStateManagerObject.MetricDict[Key];
      }
    });
    await this.GlobalStateManagerObject.FetchRoute(`AppendMetricsToJSON?METRICDICT=${JSON.stringify(ShallowCopy)}&VAR=${Metric}`,"string");
  }

  async UpdateCalculatedMetrics(I:number):Promise<void>{
    const Key:string = this.DescriptiveStatistics[I];
    if(this.ParameterDict[Key]['Checked']){
      this.ParameterDict[Key]['Checked'] = false;
      delete this.GlobalStateManagerObject.MetricDict[Key];
      const Index:number = this.GlobalStateManagerObject.MetricDictKeys.indexOf(Key);
      if(Index>-1){this.GlobalStateManagerObject.MetricDictKeys.splice(Index,1);}
      this.ChartManagerObject.CleanMetricLine(Key);
    } else {
      await this.GlobalStateManagerObject.FetchRoute(`Calculate${Key}`,"string")
      .then(async (ResultString)=>{
        this.GlobalStateManagerObject.MetricDict[Key]=ResultString.split(",");
        this.GlobalStateManagerObject.MetricDict[Key][0] = this.GlobalStateManagerObject.MetricDict[Key][0].replace("(","");
        this.GlobalStateManagerObject.MetricDict[Key][this.GlobalStateManagerObject.MetricDict[Key].length-1] = this.GlobalStateManagerObject.MetricDict[Key][this.GlobalStateManagerObject.MetricDict[Key].length-1].replace(")","")
        this.GlobalStateManagerObject.MetricDict = {...this.GlobalStateManagerObject.MetricDict}
      });
      this.GlobalStateManagerObject.MetricDictKeys.push(Key);

      this.SelectedMetric = Key;
      this.ParameterDict[Key]['Checked'] = true;
    }
    this.MetricDictJSONString = this.GlobalStateManagerObject.PrettyJSON(this.GlobalStateManagerObject.MetricDict);
  }

  public GenerateIndexedStyle(Index:number,Mod:number):string{return `${Index*Mod}%`}

  public GenerateAccumulatedPosition():number{
    this.PositionAccumulator += 1;
    return this.PositionAccumulator * 19;
  }

  public ResetAccumulator():void{this.PositionAccumulator=0}

}
