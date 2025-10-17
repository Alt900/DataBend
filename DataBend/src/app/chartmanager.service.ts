import { Injectable, inject } from '@angular/core';
import { GlobalStateManager } from './globalstates.service';
import * as d3 from 'd3';
import { Selection } from "d3-selection";

@Injectable({
  providedIn: 'root',
})

export class GraphManager{
    private GlobalStateManagerObject = inject(GlobalStateManager);

    public PrimarySVG:d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
    public SecondarySVG:d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
    public Zoom:d3.ZoomBehavior<SVGSVGElement, unknown> = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1,100]);
    public DragHandler:d3.DragBehavior<SVGSVGElement, unknown, unknown> = d3.drag<SVGSVGElement, unknown>();

    public Height = 0;
    public Width = 0;
    private GlobalK = 1;

    private XScaling:d3.ScaleLinear<number, number, never> = d3.scaleLinear();
    private YScaling:d3.ScaleLinear<number, number, never> = d3.scaleLinear();
    private ZoomedXScaling:d3.ScaleLinear<number, number, never> = d3.scaleLinear();
    private LineDraw:d3.Line<[number, number]>|null=null;

    private  ColorPalette:string[] = [];//Interpolated at rendering
    private  StartingRGB:{ r: number; g: number; b: number } = {r:255,g:0,b:0}
    private  EndingRGB:{ r: number; g: number; b: number } = {r:255,g:130,b:255}

    private HexMapfnCallback(value: number){
        const Hex = value.toString(16);
        return Hex.length === 1 ? '0' + Hex : Hex;
    }

    private GenerateColorPalette(Len:number):void{
        this.ColorPalette = []; 
        for(let i=1; i<=Len; i++){
            const T:number = i/Len;
            const R:number = Math.round(this.StartingRGB.r+T*(this.EndingRGB.r-this.StartingRGB.r));
            const G:number = Math.round(this.StartingRGB.g+T*(this.EndingRGB.g-this.StartingRGB.g));
            const B:number = Math.round(this.StartingRGB.b+T*(this.EndingRGB.b-this.StartingRGB.b));
            const HexString:string =  '#'+[R,G,B].map(this.HexMapfnCallback).join('');
            this.ColorPalette.push(HexString);
        }
    }

    public Initialize(PrimarySVG:SVGSVGElement,SecondarySVG:SVGSVGElement,W:number,H:number):void{
        this.PrimarySVG = d3.select(PrimarySVG);
        this.SecondarySVG = d3.select(SecondarySVG);

        this.Zoom.on("zoom",this.ZoomHandler.bind(this));

        if(this.PrimarySVG && this.SecondarySVG){
            this.Height = H;
            this.Width = W;

            this.DragHandler
                .on("start",()=>{})
                .on("drag",this.DragHandlerDrag.bind(this))
                .on("end",()=>{});

            this.Zoom.translateExtent([[0,0],[this.Width,this.Height]]);

            this.PrimarySVG
                .attr("id","SVGContainer")
                .attr("viewBox",[0,0,this.Width,this.Height])
                .call(this.DragHandler.bind(this))
                .call(this.Zoom);
            
            this.SecondarySVG
                .attr("id","SVGContainerBackdrop")
                .attr("viewBox",[0,0,this.Width,this.Height]);
        }
    }

    public DragHandlerDrag(E:any):void{//fix linter unexpected any with e type
        console.log(E)
        if(this.PrimarySVG){
            const NewX:number = E.dx/this.GlobalK;
            const NewY:number = E.dy/this.GlobalK;
            this.PrimarySVG.select("#MainDrawGroup").attr("transform",`translate(${NewX},${NewY})`);
            this.Zoom.translateBy(this.PrimarySVG,NewX,NewY);
        }
    }

    public ZoomHandler(E:d3.D3ZoomEvent<SVGSVGElement, unknown>):void{
        this.PrimarySVG?.attr("d")
        if(this.PrimarySVG && this.LineDraw){
            this.GlobalK = E.transform.k;
            const NewX:d3.ScaleLinear<number, number, never> = E.transform.rescaleX(this.XScaling);
            this.ZoomedXScaling = NewX.copy();
            const NewY:d3.ScaleLinear<number, number, never> = E.transform.rescaleY(this.YScaling);
            const XGrid:Selection<SVGGElement, unknown, null, any> =this.PrimarySVG.select("#x-grid");
            const YGrid:Selection<SVGGElement, unknown, null, any> = this.PrimarySVG.select("#y-grid");
            XGrid.call(d3.axisBottom(NewX).tickSize(this.Height)).selectAll(".tick text").attr("dy","-1em");
            YGrid.call(d3.axisRight(NewY).tickSize(this.Width)).selectAll(".tick text").attr("dx","-2em");
            this.LineDraw.x(d=>NewX(d[0]));
            this.LineDraw.y(d=>NewY(d[1]));
            Object.keys(this.GlobalStateManagerObject.MetricDict).forEach(async(Key:string)=>{
                if(this.PrimarySVG){
                    const Line = d3.select(`#DataLine_${Key}`)
                    if(!Line.empty()){
                        Line
                            .attr("y1",NewY(this.GlobalStateManagerObject.MetricDict[Key][0]))
                            .attr("y2",NewY(this.GlobalStateManagerObject.MetricDict[Key][0]))
                    }
                }
            });
            this.PrimarySVG.selectAll<SVGPathElement, [number, number][]>("path").attr("d",d=>d?this.LineDraw?this.LineDraw(d):0:0);
        }
    }

    public MouseMove(E:MouseEvent):void{
        if(this.PrimarySVG){
            const [x,y] = d3.pointer(E,this.PrimarySVG.node());
            const Index:number = Math.round(this.ZoomedXScaling.invert(x));
            const IndexSnapX:number = Math.round(this.ZoomedXScaling(Index));
            if(this.GlobalStateManagerObject.CurrentDataSet[0][Index]){
                this.PrimarySVG.selectAll("#NavigationText").remove();
                this.GlobalStateManagerObject.CurrentLabelSet.forEach((Key:string,i:number)=>{
                    const KeyIndex:number = this.GlobalStateManagerObject.CurrentTotalLabelSet.indexOf(Key);
                    this.PrimarySVG?.append("text")
                        .attr("id","NavigationText")
                        .attr("x",1)
                        .attr("y",(i+1)*26)
                        .attr("stroke",this.ColorPalette[i])
                        .text(`${this.GlobalStateManagerObject.CurrentLabelSet[i]}: ${this.GlobalStateManagerObject.CurrentDataSet[KeyIndex][Index][1]}`)
                });
            }
            this.PrimarySVG.select("#XNavLine").attr("x1",IndexSnapX).attr("x2",IndexSnapX);
            this.PrimarySVG.select("#YNavLine").attr("y1",y).attr("y2",y);
        }
    }

    public CleanSVG():void{d3.selectAll("svg > *").remove();}


    public InjectComponents(Components:string[]){
        Components.forEach((Component:string)=>{
            if(this.PrimarySVG){
                if(Component==="GridLines"){
                    this.PrimarySVG.append("g")
                        .attr("id","x-grid")
                        .attr("stroke","white")
                        .attr("color","gray")
                        .call(
                        d3.axisBottom(this.XScaling).tickSize(this.Height)
                        )
                        .selectAll(".tick text")
                        .attr("dy","-1em");

                    this.PrimarySVG.append("g")
                        .attr("id","y-grid")
                        .attr("stroke","white")
                        .attr("color","gray")
                        .call(
                        d3.axisRight(this.YScaling).tickSize(this.Width)
                        )
                        .selectAll(".tick text")
                        .attr("dx","-2em");
                } else if(Component==="NavigationCrosshair"){
                    this.PrimarySVG.append("line")
                        .attr("id","XNavLine")
                        .attr("stroke","white")
                        .attr("x1",0)
                        .attr("x2",0)
                        .attr("y1",0)
                        .attr("y2",this.Height)
                        .style("stroke-dasharray", "5,5");
                    
                    this.PrimarySVG.append("line")
                        .attr("id","YNavLine")
                        .attr("stroke","white")
                        .attr("x1",0)
                        .attr("x2",this.Width)
                        .attr("y1",0)
                        .attr("y2",0)
                        .style("stroke-dasharray", "5,5");
                } else if(Component==="NavigationText"){
                    this.PrimarySVG.append("rect")
                        .attr("id","NavigationTextRect")
                        .attr("x",0)
                        .attr("y",0)
                        .attr("width",150)
                        .attr("height",25)
                        .attr("fill","#191919")
                        .attr("opacity",1)
                        .attr("stroke","gray")
                        .attr("height",this.GlobalStateManagerObject.CurrentLabelSet.length*30);
                }
            }
        });
    }

    public DrawLineChart():void{
        if(this.PrimarySVG){
            this.PrimarySVG.on('mousemove',this.MouseMove.bind(this));
            const OuterLen:number = this.GlobalStateManagerObject.CurrentDataSet.length;
            const InnerLen:number = this.GlobalStateManagerObject.CurrentDataSet[0].length;
            let Min = 0;
            let Max = 0;
            this.GenerateColorPalette(OuterLen);
            for(const pair of this.GlobalStateManagerObject.CurrentDataSet[0]){
                if(pair[0] > Max){Max=pair[0]}
                else if(pair[0] < Min){Min=pair[0]}
            }
            this.YScaling.domain([Min,Max]).range([this.Height,0]).clamp(true);
            this.XScaling.domain([0,InnerLen]).range([0,this.Width]);
            let CubedScale:number = InnerLen/this.Width;
            CubedScale *= CubedScale*CubedScale;
            this.Zoom.scaleExtent([1,100+CubedScale]);
            this.LineDraw = d3.line().x((d:number[])=>this.XScaling(d[0])).y((d:number[])=>this.YScaling(d[1]));
            const MainGroup = this.PrimarySVG.append("g").attr("id","MainDrawGroup");
            this.InjectComponents(["GridLines","NavigationCrosshair","NavigationText"]);
            for(let i=0; i<this.GlobalStateManagerObject.CurrentLabelSet.length; i++){
                MainGroup.append("path")
                    .datum(this.GlobalStateManagerObject.CurrentDataSet[i])
                    .attr("fill","none")
                    .attr("stroke",this.ColorPalette[i])
                    .attr("stroke-width",2)
                    .attr("d",this.LineDraw)
                    .attr("id",`DataLine_${this.GlobalStateManagerObject.CurrentTotalLabelSet[i]}`);
            }
        }
    }

    public HandleMetricsDraw(Key:string):void{
        if(this.PrimarySVG){
            const MetricLine = d3.select(`#DataLine_${Key}`);
            if(!MetricLine.empty()){
                MetricLine.remove();
            } else {
                this.PrimarySVG.append("line")
                    .attr("id",`DataLine_${Key}`)
                    .attr("x1",0)
                    .attr("x2",this.Width)
                    .attr("y1",this.YScaling(this.GlobalStateManagerObject.MetricDict[Key][0]))
                    .attr("y2",this.YScaling(this.GlobalStateManagerObject.MetricDict[Key][0]))
                    .attr("stroke",this.ColorPalette[0])
                    .attr("stroke-width",2);
            }
        }
    }

    public CleanMetricLine(Key:string):void{d3.select(`#DataLine_${Key}`).remove()}

    public CleanVariablePath(Key:string):void{
        d3.select("#MainDrawGroup").selectAll(`#DataLine_${Key}`).remove()
    }

    public RenderVariables(Var:string):void{
        if(this.PrimarySVG){
            const MainDrawGroup = d3.select("#MainDrawGroup");
            const i:number = this.GlobalStateManagerObject.CurrentTotalLabelSet.indexOf(Var);
            MainDrawGroup.append("path")
                .datum(this.GlobalStateManagerObject.CurrentDataSet[i])
                .attr("fill","none")
                .attr("stroke",this.ColorPalette[i])
                .attr("stroke-width",2)
                .attr("d",this.LineDraw)
                .attr("id",`DataLine_${this.GlobalStateManagerObject.CurrentTotalLabelSet[i]}`);
            this.PrimarySVG.select("#NavigationTextRect").attr("height",this.GlobalStateManagerObject.CurrentLabelSet.length*28);
        }
    }
}