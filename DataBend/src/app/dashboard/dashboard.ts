import { Component, ElementRef, ViewChild, AfterViewInit, inject }from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { GlobalStateManager, DynamicDict } from '../globalstates.service';
import { GraphManager } from '../chartmanager.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule, 
    FormsModule,
    MatFormFieldModule, 
    MatListModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements AfterViewInit {
  ChartManagerObject = inject(GraphManager);
  GlobalStateManagerObject = inject(GlobalStateManager);

  ActiveVariableMap:DynamicDict = {};
  ActiveFileName = "";
  TempActiveFileName = "";
  JSONEditorSring = "";
  JSONJumpToEntryInput = 0;
  MaxEntries = 0;
  SaveNotification = false;
  SaveNotificationMessage = "";


  @ViewChild('D3ChartsSVG',{ static: true }) PrimarySVGObserver!: ElementRef<SVGSVGElement>;
  @ViewChild('D3SecondaryChartSVG',{ static: true }) SecondarySVGObserver!: ElementRef<SVGSVGElement>;

  async ngAfterViewInit():Promise<void>{
    const PrimaryD3Canvas:SVGSVGElement = this.PrimarySVGObserver.nativeElement;
    const SecondaryD3Canvas:SVGSVGElement = this.SecondarySVGObserver.nativeElement;
    const D3ChartRect = PrimaryD3Canvas.getBoundingClientRect();
    this.ChartManagerObject.Initialize(PrimaryD3Canvas,SecondaryD3Canvas,D3ChartRect.width,D3ChartRect.height);
  }

  SanitizeEntryInput(ChangeEvent:Event):void{
    const InputNumber:number = +(ChangeEvent.target as HTMLInputElement).value;
    if(InputNumber < 0){
      this.JSONJumpToEntryInput = 0;
    } else if (InputNumber > this.MaxEntries){
      this.JSONJumpToEntryInput = this.MaxEntries;
    } else {
      this.JSONJumpToEntryInput = InputNumber;
    }
  }

  JumptoEntry():void{
    const TextArea:HTMLTextAreaElement = document.getElementById("JSONTextArea") as HTMLTextAreaElement;
    let StartingPosition = 0;
    const Entries = TextArea.value.split("}");
    for(let i = 0; i<this.JSONJumpToEntryInput+1 && i<Entries.length; i++){
      StartingPosition += Entries[i].length+1;
    }
    TextArea.selectionStart = StartingPosition;
    TextArea.selectionEnd = StartingPosition;
    TextArea.focus();
  }

  async FetchJSONFile(FileFetchEvent:Event):Promise<void>{
    const TargetInputElement:HTMLInputElement = FileFetchEvent.target as HTMLInputElement;
    if(TargetInputElement.files){
      this.ActiveFileName = TargetInputElement.files[0].name;
      this.TempActiveFileName = this.ActiveFileName;
      this.GlobalStateManagerObject.FetchRoute(`FetchJSONReturnString?PATH=./DataBend/Datafiles/${this.ActiveFileName}`,'json')
      .then(async (JSONObject)=>{
        this.JSONEditorSring = this.GlobalStateManagerObject.PrettyJSON(JSONObject);
        const Vars:string[] = Object.keys(JSONObject[0]);
        if(Vars.includes("timestamp")){
          Vars.splice(Vars.indexOf("timestamp"),1);//if the dataset is a time series 
        }
        Vars.forEach((element:string)=>{
          this.ActiveVariableMap[element]=false;
        })
        this.MaxEntries = JSONObject.length;

        this.GlobalStateManagerObject.CurrentTotalLabelSet = Vars;

        const PairedMatrix:[number,number][][] = [];
        Vars.forEach((Var:string) => {
          const Paired:[number,number][] = [];
          const X:number[] = Array.from(Array(this.MaxEntries),(_,i)=>i);
          JSONObject.forEach((Entry:DynamicDict,index:number)=>{
            Paired.push([X[index],+Entry[Var]]);
          });
          PairedMatrix.push(Paired);
        });
        this.GlobalStateManagerObject.CurrentDataSet = PairedMatrix;
        this.ChartManagerObject.CleanSVG();
        this.ChartManagerObject.DrawLineChart();
      
        this.GlobalStateManagerObject.FetchRoute(`LoadJSONtoMatrix?PATH=./DataBend/Datafiles/${this.ActiveFileName}&VARS=${Vars}`,"void");
      });
    }
  }

  private async StartSaveNotificationTimer():Promise<void>{
    this.SaveNotification = true;
    await new Promise((Resolve)=>setTimeout(Resolve,3000));
    this.SaveNotification = false;
  }

  async SaveSaveAs():Promise<void>{
    if(this.TempActiveFileName === this.ActiveFileName){
      this.SaveNotificationMessage = `Saved ${this.ActiveFileName}`
    } else {
      this.SaveNotificationMessage = `Saved the datafile as ${this.TempActiveFileName}`
    }
    this.GlobalStateManagerObject.FetchRoute(`SaveJSON?PATH=./DataBend/Datafiles/${this.TempActiveFileName}`,"string").then(async()=>{this.StartSaveNotificationTimer()})
  }

  HandleVariableChange(Variables:string[]):void{
    this.GlobalStateManagerObject.CurrentTotalLabelSet.forEach((Key:string)=>{
      if(Variables.includes(Key) && !this.GlobalStateManagerObject.CurrentLabelSet.includes(Key)){
        this.GlobalStateManagerObject.CurrentLabelSet.push(Key);
        this.ActiveVariableMap[Key] = true;
        this.ChartManagerObject.RenderVariables(Key);
      } else if(!Variables.includes(Key)){
        const Index:number = this.GlobalStateManagerObject.CurrentTotalLabelSet.indexOf(Key);
        if(Index>-1){
          this.GlobalStateManagerObject.CurrentLabelSet.splice(Index,1);
          this.ActiveVariableMap[Key] = false;
          this.ChartManagerObject.CleanVariablePath(Key);
        }
      }
    });
  }
}