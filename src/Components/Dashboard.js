import React, { Component } from "react";

/*Components*/
import BinaryPieChart from "./PieChart/BinaryPieChart";

/*Bootstrap*/
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Product from './Product/Product';
import { get_all_data, get_slug, oauth_login } from "../LookerSession";
import data from './035457.json';
import pdvsJson from './pdvs.json';

import { Button, Carousel, Image, Input, Select, Space, Tooltip } from 'antd';
import { Option } from "antd/es/mentions";
import { CheckCircleOutlined, ClearOutlined, CompassOutlined, EyeInvisibleOutlined, EyeOutlined, LeftSquareOutlined, ReloadOutlined, RightSquareOutlined, SearchOutlined, StarOutlined, StopOutlined } from "@ant-design/icons";
import { ALLFILTERS, QUERY_ALL_CLIENT_PRODUCTS, QUERY_MACHINE_PRODUCTS, QUERY_PDVS, SLUG_QUERY } from "../Constants";
import Recommendations from "./Recommendations/Recommendations";
import { keyboard } from "@testing-library/user-event/dist/keyboard";

const PieChartOPTIONS = {
  legend:"none",
  pieSliceText: "none",
  tooltip: { trigger: "label",isHtml: true,ignoreBounds:false},
  slices: {
    0: { color: "#54B9CA" },
    1: { color: "Lightgray" },
  },
  chartArea: {
    left: 0,
  },

}
class Dashboard extends Component {   

  constructor(props){
    super(props);
    this.state ={
         jsonData:{},
         productsData: [],
         allProductsData:null,
         hoverObject:{},
         vendingProdsByCell:6,
         vendingRows:4,
         vendingCols:10,
         query:"",
         queryProducts:[],
         searchArca:false,
         typeProduct:ALLFILTERS,
         generalCharts:[],
         productCharts:[],
         vendingData:[],
         filteredData:[],
         selectedProduct:{},
         vendingEmpty:[],
         productsInVending:[],
         upgradedVending:[],
         upgradedView:false,
         suggestionView:false,
         showRecom:false,

         pdvs:[],
         selectedClient:"",
         selectedPDV:"",
         lastPDVDate:"",
         pdvVending:[],

         tkn:"",
         lastTkn:0,
     }
  }

  refreshToken = async ()=>{
    const lastTkn = this.state.lastTkn;
    const tkn = this.state.tkn;

    if(Date.now() > lastTkn+(3500000)){
      const response = await oauth_login();
      /*if(response?.access_token == undefined && tkn!="" && tkn!=undefined){
        return tkn;
      }*/
      let tk = "";
      if(response.access_token){
        tk = response.access_token;
        this.setState({tkn:tk,lastTkn:Date.now()});
      }else{
        window.location.reload();
      }
      
      return tk;
    }else{
      return tkn;
    }
  }

  componentWillMount = async ()=>{
    const jsonData = data;
    this.setState({jsonData})
    const {vendingCols,vendingRows} = this.state;
    //console.log(this.empty2dArray(vendingRows,vendingCols));
    this.setState({vendingEmpty:this.empty2dArray(vendingRows,vendingCols)});
    this.setState({productsInVending:this.empty2dArray(vendingRows,vendingCols)});
    
  }

  empty2dArray(x,y){
    let twoDArray = [];
    for (let i = 0; i < x; i++) {
      let secondArray=[];
      for (let j = 0; j < y; j++) {
        secondArray.push({});
      }
      twoDArray.push(secondArray);
    }
    return twoDArray;
  }

  componentDidMount= async ()=>{
    let pdvs = [];
    try {
      const response = await oauth_login();
      let tk = response.access_token;
        
      const slug = await get_slug(tk,QUERY_PDVS);
      try{
        pdvs = await get_all_data(slug,tk); //LOOKER JSONS
        this.setState({tkn:tk,lastTkn:Date.now()});
        window.history.replaceState(null, '', window.location.pathname);
      }catch(e){
        console.error("No se pudo obtener el resultado del query:", e);
        pdvs=pdvsJson;  //LOCAL JSONS
      }
    } catch (error) {
      console.error("No se pudo obtener el Token:", error);
    }
    this.setState({pdvs})
    //let jsonData = this.state.jsonData;
    /*
    this.setState({jsonData},()=>{
      this.setState({productsData:jsonData},()=>{
        this.getProducts();
        this.upgradeAll(true);
      });
      let productsVend=[];
      
      if(sessionStorage.getItem("savedVending")){
        productsVend = JSON.parse(sessionStorage.getItem("savedVending"));
      }else{
        productsVend = this.empty2dArray(this.state.vendingRows,this.state.vendingCols);
        sessionStorage.setItem("savedVending",JSON.stringify(productsVend));
      }

      this.setState({productsInVending:productsVend});
      this.calculateGeneralCharts(productsVend);
    })
    */
    //this.setState({jsonData});
  }

  render() {
    const {vendingRows,vendingCols,query, searchArca, typeProduct, hoverObject,productCharts, generalCharts, 
      productsInVending, suggestionView, queryProducts, upgradedView, upgradedVending, productsData, filteredData, showRecom,
      pdvs, selectedClient, selectedPDV, lastPDVDate, pdvVending} = this.state;
    
    const vendR= this.createArray(vendingRows);
    const vendC= this.createArray(vendingCols);
    let windowSize= window.innerHeight;
    
    if(productCharts==[] || productsData==[])
    return "";
    return (
      <>
        <Container id="wrapper-background" style={{height:windowSize+"px"}} onMouseMove={()=>{windowSize=window.innerHeight}}>
          <Recommendations listTitle={"Cliente: "+selectedClient+" -> Punto de Venta: "+selectedPDV+" - Última visita: "+this.formatDate(lastPDVDate)} dataBefore={productsInVending} dataAfter={upgradedVending} show={showRecom} allData={this.sortForecastData(productsData)} changeShow={()=>{this.setState({showRecom:!showRecom})}} tkn={this.state.tkn}/>
          <Row id="wrapper">
          {selectedClient==""?"":
            <Row className="vender-title-pdv" style={{height:"5%"}}>
              <div className="title-vender"><h1>{"Cliente: "+selectedClient}</h1></div>
              {selectedPDV==""?"":
              <div className="title-vender title-vender-pdv"><h1>{"-> Punto de Venta: "+selectedPDV}</h1></div>}
              {lastPDVDate==""?"":
              <div className="title-vender title-vender-date"><h1>{"-  Última Visita: "+this.formatDate(lastPDVDate)}</h1></div>}
            </Row>
          }
            <Row id="vending-wrap" style={{height:"50%"}}>
              <Col sm={9} className="vend-col">
                <Row className="vending-row">
                  <Row className="vending-sub-row">
                  {/*<div className="vendingMachineDiv"></div>*/}
                    <Col className="vending-sub-row-inner">
                    {vendR.map((row,j)=>
                      <Row key={j} className="vending-line" style={{"minHeight":"50px","height":""+100/vendR.length+"%"}}>
                        {vendC.map((col,k)=>{
                          let upgClass= upgradedView ? productsInVending[j][k].vm_forecast_dash_obs_cliente+"-upg ":"";
                          if(selectedPDV==""){
                            return(<Col onClick={()=>{this.moveProductVending(j,k)}} key={k} className={Object.keys(productsInVending[j][k]).length > 0 ? upgClass+"vending-prod filled-vend":upgClass+"vending-prod"} 
                            style={{"maxWidth":"80px","maxHeight":"100px","width":""+100/vendC.length+"%"}}><Tooltip title="Vacío" className="btn-vend-empty"><div style={{height:"100%",width:"100%"}}> </div></Tooltip></Col>)
                          }
                          return (
                            <Col onClick={()=>{this.moveProductVending(j,k)}} key={k} className={Object.keys(productsInVending[j][k]).length > 0 ? upgClass+"vending-prod filled-vend":upgClass+"vending-prod"} 
                              style={{"maxWidth":"80px","maxHeight":"100px","width":""+100/vendC.length+"%"}}>{
                                productsInVending.length>0 && Object.keys(productsInVending[j][k]).length > 0? 
                                  <Tooltip title={""+productsInVending[j][k].vm_forecast_dash_PRODUCTO} className={"btn-vend"}>
                                    <Image preview={false} src={this.checkImageRegex(productsInVending[j][k].cp_tipo)}/>
                                    {productsInVending[j][k].cp_arca=="true"?<img src={"/Images/ARCAIcon.png"} alt={data.vm_forecast_dash_PRODUCTO} className="arca-Icon-vend"/>:""}
                                    <span className={"btn-vend-txt"}>{productsInVending[j][k].vm_forecast_dash_PRODUCTO}</span>
                                    <span className={productsInVending[j][k].vm_forecast_dash_row_num==((k+1)+(vendC.length*j))?"btn-vend-ROW":productsInVending[j][k].vm_forecast_dash_obs_cliente+"-upg-vend btn-vend-ROW"}>{productsInVending[j][k].vm_forecast_dash_row_num}</span>
                                  </Tooltip>:
                                    <Tooltip title="Vacío" className="btn-vend-empty">
                                      <div style={{height:"100%",width:"100%"}}> </div>
                                    </Tooltip>
                                }
                            </Col>
                          )}
                        )} 
                      </Row>
                    )}
                    </Col>
                  </Row>
                </Row>
                
              </Col>
              <Col sm={3} id="vending-charts">
                <Row className="vending-row">
                  <Row className="vending-opts">
                  {selectedClient!=""?"":<h2 className="select-Aviso">SELECCIONE UN CLIENTE</h2>}
                  {selectedClient!="" && selectedPDV=="" ?<h2 className="select-Aviso">AHORA SELECCIONE UN PUNTO DE VENTA</h2>:""}
                    <Row className="vender-chose" >
                      <Col sm={12}>
                        <Select className={selectedClient!=""?"clients-combo":"unselected-combo clients-combo"} value={selectedClient} onChange={(obj)=>{this.changeClientsCombo(obj)}} >
                        <Option value="" selected>Elige un Cliente</Option>
                          {pdvs.map((x,k,arr)=> {
                            const prevPerson = arr[k - 1];
                            if (prevPerson?.CLIENTE==x.CLIENTE) return;
                            else return(<Option key={k} value={x.CLIENTE}>{x.CLIENTE}</Option>)
                            }
                          )}
                        </Select>
                      </Col>
                      {selectedClient!=""?
                      <Col sm={12}>
                        <Select className={selectedPDV!=""?"pdvs-combo":"unselected-combo pdvs-combo"} value={selectedPDV} onChange={(obj)=>{this.changePDVCombo(obj)}} >
                        <Option value="" disabled selected>Elige un Punto de Venta</Option>
                          {pdvs.map((x,k,arr)=> {
                            const prevPerson = arr[k - 1];
                              if (x.CLIENTE == selectedClient)
                                return(<Option key={k} value={x.PDV}>{x.PDV}</Option>)
                            }
                          )}
                        </Select>
                      </Col>
                      :""}
                    </Row>
                    {selectedPDV==""?"":
                      <Row className="vending-actions">
                        <Tooltip title="Alternar Vista" className="tool-vend" >
                          <Button type={upgradedView?"dashed":"primary"} shape="round" icon={upgradedView?<EyeInvisibleOutlined/> : <EyeOutlined />} onClick={()=>{this.alternateVista()}} style={{}}/>
                        </Tooltip>
                        { suggestionView?
                          <Tooltip title="Salir de Sugerencia Mejorada" className="tool-vend">
                            <Button type="dashed" shape="round" icon={<StopOutlined />} onClick={()=>{this.removeUpgrade()}} />
                          </Tooltip> 
                          :
                          <Tooltip title="Mostrar Sugerencia Mejorada" className="tool-vend">
                            <Button type="primary" shape="round" icon={<CheckCircleOutlined />} onClick={()=>{this.upgradeAll(false)}} />
                          </Tooltip>
                        }
                        {productsInVending != pdvVending?
                        <Tooltip title="Recargar Datos de PDV" className="tool-vend" >
                          <Button type="dashed" shape="round" icon={<ReloadOutlined />} onClick={()=>{this.changePDVCombo(selectedPDV)}}/>
                        </Tooltip>:""}
                        {this.vendingHasProducts()?
                        <Tooltip title="Vaciar Máquina" className="tool-vend" >
                          <Button type="dashed" shape="circle" icon={<ClearOutlined />} onClick={()=>{this.cleanVending()}} style={this.vendingHasProducts()?{opacity:1}:{opacity:0,pointerEvents:"none"}}/>
                        </Tooltip> :""}
                        
                        {suggestionView && JSON.stringify(productsInVending)!=sessionStorage.getItem("savedVending") ?
                        ""/*<Tooltip title="Mantener Mejora" className="tool-vend" >
                          <Button type="primary" shape="circle" icon={<StarOutlined />} onClick={()=>{this.maintainVending()}} style={{}}/>
                        </Tooltip>*/ :""}
                      </Row>
                    }
                  </Row>
                {selectedPDV=="" || generalCharts.length==0 ?"":
                  generalCharts.map((data,k)=>
                  <Col key={k} sm={12} className="chartBox">
                    <BinaryPieChart title={data.title} data={data.axis} options={PieChartOPTIONS} size={data.size+"px"} isMoney={data.title.toUpperCase().includes("VENTA")}/>
                  </Col>
                  )}
                  {selectedPDV==""?"":
                  <Tooltip title="Ver Recomendaciones" className="tool-vend recommTool" >
                    <Button type="primary" shape="round" icon={<CompassOutlined />} onClick={()=>{this.showRecomendations()}} style={{}}>Recomendaciones</Button>
                  </Tooltip>
                  }
                </Row>
              </Col>
            </Row>
            <Row id="charts-products-wrap" style={{height:"45%"}}>
              <Col sm={12} md={9} id="products-section">
                <Container className="containPad">
                  <Col sm={12} md={10} id="carousel-box">
                    <Row className="gray-box">
                      {selectedPDV!=""?<h1>Inventario de {selectedClient}</h1>:""}
                      {selectedPDV== "" || queryProducts.length == 0 ? "":
                      <Carousel touchMove={true} arrows afterChange={this.onChange} dots={true} dotWidth={20} prevArrow={<LeftSquareOutlined />} nextArrow={<RightSquareOutlined />} >
                        {queryProducts.map((x)=>x)}
                        </Carousel>
                      }
                    </Row>
                  </Col>
                </Container>
              </Col>
              <Col sm={12} md={3} id="search-section">
                <Container className="containPad">
                  <Row className="blue-box">
                    {filteredData.length==0?"":
                    <Col sm={12} md={10} id="search-bar" >
                      <Row className="search-section-in">
                        <Input placeholder="Texto a Buscar" className="search-inp" value={query} onChange={(val)=>{this.setState({query:val.currentTarget.value})}} />
                      </Row>
                    </Col>
                    }
                    {filteredData.length==0?"":
                    <Col sm={12} md={22} id="carousel-sett">
                      <Row className="multi-button">
                        <div className="subtitle-card"><h2>Marca</h2></div>
                        <Space/>
                        <Col><Button type={!searchArca?"primary":"default"} className="dual-btn" style={{padding:"0px 10px"}} onClick={()=>{this.setState({searchArca:false})}}>Todos</Button></Col>
                        <Col><Button type={searchArca?"primary":"default"} className="dual-btn" style={{padding:"0px 10px"}} onClick={()=>{this.setState({searchArca:true})}}>Arca</Button></Col>
                      </Row>
                      <Row className="filter-buttons">
                        <div className="subtitle-card"><h2>Tipo de Producto</h2></div>
                        <Space/>
                        <Button type={typeProduct.length==ALLFILTERS.length ? "primary":"default"} onClick={()=>{this.addAllFilters()}} className="select-btn" style={{padding:"0px 10px"}}>{typeProduct.length==ALLFILTERS.length ? "Ninguno":"Todos"}</Button>
                        <Button type={typeProduct.find((x)=>x=="bebida")? "primary":"default"} onClick={()=>{this.addRemoveFilter("bebida")}} className="select-btn" style={{padding:"0px 10px"}}>Bebida</Button>
                        <Button type={typeProduct.find((x)=>x=="botana")? "primary":"default"} onClick={()=>{this.addRemoveFilter("botana")}} className="select-btn" style={{padding:"0px 10px"}}>Botana</Button>
                        <Button type={typeProduct.find((x)=>x=="panaderia")? "primary":"default"} onClick={()=>{this.addRemoveFilter("panaderia")}} className="select-btn" style={{padding:"0px 10px"}}>Panadería</Button>
                        <Button type={typeProduct.find((x)=>x=="dulceria")? "primary":"default"} onClick={()=>{this.addRemoveFilter("dulceria")}} className="select-btn" style={{padding:"0px 10px"}}>Dulcería</Button>
                        
                      </Row>
                      <Row className="dualButtons">
                      <Col><Tooltip title="Buscar"><Button type="primary" className="search-btn" style={{padding:"0px 10px"}} onClick={()=>this.search()}><SearchOutlined style={{ fontSize: '23px'}} /></Button></Tooltip></Col>
                      {productsData.length!=filteredData.length?<Col><Tooltip title="Reiniciar"><Button type="dashed" className="search-btn" style={{padding:"0px 10px"}} onClick={()=>this.resetSearch()}><ReloadOutlined style={{ fontSize: '23px'}} /></Button></Tooltip></Col>:""}
                      </Row>
                    </Col>
                    }
                  </Row>
                </Container>
              </Col>
            </Row>  
          </Row>
        </Container>
      </>
    )
  }

  changeClientsCombo  = (value)=>{
    const {vendingCols,vendingRows} = this.state;
    this.setState({selectedClient:value,selectedPDV:"", suggestionView:false, upgradedView:false,productsData:[],vendingData:[]});
    this.setState({productsInVending:this.empty2dArray(vendingRows,vendingCols)});
  }
  changePDVCombo = async (value)=>{
    //FIND QUERY OBJECTS
    const {vendingCols,vendingRows} = this.state;
    this.setState({selectedPDV:value});
    let products = []; //query to get Products
    let productsALL = []; //query to get Products
    try {
      let tk = this.state.tkn;
      const slug = await get_slug(tk,QUERY_MACHINE_PRODUCTS(value));
      const slug2 = await get_slug(tk,QUERY_ALL_CLIENT_PRODUCTS(this.state.selectedClient));
      try{
        products = await get_all_data(slug,tk); //LOOKER JSONS
        productsALL = await get_all_data(slug2,tk); //LOOKER JSONS
      }catch(e){
        console.error("No se pudo obtener el resultado del query:", e);
        products=data;  //LOCAL JSONS
      }
    } catch (error) {
      console.error("No se pudo obtener el Token:", error);
    }

    this.setState({vendingData:products,productsData:productsALL},()=>{
      this.getProducts();
      this.addVendingProducts();
    });
  }

  addVendingProducts=()=>{
    const {vendingRows,vendingCols, vendingData} = this.state;
    let cleanedData = [];
    cleanedData=this.sortRowData(vendingData);
    let productsInVending = this.empty2dArray(vendingRows,vendingCols);
    let lastDate="";
    //debugger;
    //console.log(JSON.stringify(productsInVending));
    cleanedData.map((data,i)=>{
      let added = false;
      productsInVending.map((y,j)=> {
        //console.log("row:"+y);
        if(added) return;
        for(let k=0;k<y.length;k++){
          //console.log("col:"+x);
          if(added)break;
          if(Object.keys(productsInVending[j][k]).length==0){
            added=true;
            productsInVending[j][k]=data;
            lastDate=data.vm_forecast_dash_fecha_visita;
          }
        }
      });
    });
    this.setState({
      productsInVending,
      pdvVending:productsInVending,
      lastPDVDate:lastDate
    },()=>{
      //console.log(this.state.pdvVending,this.state.productsInVending,this.state.pdvVending==this.state.productsInVending)
      this.maintainVending()
    });
    
    this.calculateGeneralCharts(productsInVending);
  }
  vendingHasProducts=()=>{
    const {productsInVending} = this.state;
    let hasProducts = false;
    productsInVending.map((y,j)=> {
      if(hasProducts)
        return;
      y.map((x,k)=> {
        if(Object.keys(x).length>0){
          hasProducts=true;
        }
      });
    });
    return hasProducts;
  }

  alternateVista=()=>{
    const {upgradedView} = this.state;
    this.setState({upgradedView:!upgradedView},()=>{
      this.refreshCarousel();
    })
  }

  refreshCarousel=()=>{
    this.getProducts();
  }

  cleanVending = () =>{
    const {vendingCols,vendingRows} = this.state;
    const d2 =this.empty2dArray(vendingRows,vendingCols);
    this.setState({productsInVending:d2});
    this.setState({suggestionView:false});
    this.setState({generalCharts:[]});
  }

  maintainVending = () =>{
    const {productsInVending} = this.state;
    sessionStorage.setItem("savedVending",JSON.stringify(productsInVending));
    this.removeUpgrade();
  }

  showRecomendations = () =>{
    const {showRecom} = this.state;
    this.setState({showRecom:!showRecom});
  }

  hoverObjectChange = (hoverObject) =>{
    this.setState({hoverObject});
    this.calculateIndividualCharts(hoverObject);
  }

  clickObjectChange = (clickObject)=>{
    //alert(JSON.stringify(clickObject));
    const selected = this.state.selectedProduct;
    if(selected == clickObject){
      this.setState({selectedProduct:{}}, () => {
        this.refreshCarousel();
    });
    }else{
      this.setState({selectedProduct:clickObject}, () => {
        this.refreshCarousel();
    });
    }
  }

  moveProductVending = (row,col) =>{
    const {selectedProduct,suggestionView} = this.state;
    let productsInVending = this.state.productsInVending;
    if(selectedProduct != {}){
      productsInVending[row][col] = selectedProduct;
    }
    this.setState({
      productsInVending,
      selectedProduct:{}
    }, () => {
        this.refreshCarousel();
    });
    if(!suggestionView)
      sessionStorage.setItem("savedVending",JSON.stringify(productsInVending));
    
      this.calculateGeneralCharts(productsInVending);
  }

  addRemoveFilter = (word) =>{
    const filter = this.state.typeProduct;
    let newfilter= [];
    //debugger;
    if(filter.length == ALLFILTERS.length){
      newfilter.push(word);
      this.setState({typeProduct:newfilter});
      //console.log("EDO ACTUAL:"+newfilter);
      return;
    }
    if(filter.find((x)=>x==word)!=null){
      filter.map((x)=>{
        if(x!=word){
          newfilter.push(x);
        }
      });
    }else{
      newfilter = filter;
      newfilter.push(word);
    }

    //console.log("EDO ACTUAL:"+newfilter);
    this.setState({typeProduct:newfilter});
    return;
    
  }

  addAllFilters = () =>{
    const filter = this.state.typeProduct;
    if(filter.length == ALLFILTERS.length){
      this.setState({typeProduct:[]});
    }else{
      this.setState({typeProduct:ALLFILTERS});
    }
    //console.log("TODOS EN ESTADO:"+this.state.typeProduct);
  }

  calculateGeneralCharts=(datas)=>{
    //console.log(JSON.stringify(datas));
    let charts=[];
    
    let totalVendido=0, totalCapConfig = 0,totalDineroVendido=0, totalDineroPosible = 0;
    datas.map((y,j)=> {
      //console.log("y["+j+"]"+y);
      y.map((x,k)=> {
        //console.log(JSON.stringify(x));
        if(Object.keys(x).length>0){
          totalCapConfig+=x.vm_forecast_dash_CAPACIDAD_CONFIGURADA;
          totalVendido+=x.vm_forecast_dash_VENDIDO;
          let preciopieza = 0;
          if(x.vm_forecast_dash_VAL_VENDIDO != 0){
            preciopieza = x.vm_forecast_dash_VENDIDO == 0 ? 0 : x.vm_forecast_dash_VAL_VENDIDO/x.vm_forecast_dash_VENDIDO;
          }
          totalDineroPosible+= preciopieza*totalCapConfig;
          totalDineroVendido+=x.vm_forecast_dash_VAL_VENDIDO;
        }
      });
    });
    if(totalVendido>0 && totalCapConfig-totalVendido > 0){
      charts.push({
        title:"Capacidad",
        axis:[
          ["Vendido", "En máquina"],
          ["Vendido", totalVendido],
          ["En máquina", totalCapConfig-totalVendido]
        ],
        size:100
      });
    }
    if(totalDineroVendido>0 && totalDineroPosible-totalDineroVendido > 0){
      charts.push({
        title:"Ventas",
        axis:[
          ["Vendido", "Por vender"],
          ["Vendido", totalDineroVendido],
          ["Por vender", totalDineroPosible-totalDineroVendido]
        ],
        size:100
      });
    }

    this.setState({generalCharts:charts});
  }
  sortRowData=(data) => {
    return data.sort((a, b) => a.vm_forecast_dash_row_num - b.vm_forecast_dash_row_num);
  }
  sortForecastData=(data) => {
    const sortOrder = { "UP": 1, "-": 2, "DOWN": 3 }; // Establece el orden de clasificación
    return data.sort((a, b) => {
        return sortOrder[a.vm_forecast_dash_obs_cliente] - sortOrder[b.vm_forecast_dash_obs_cliente];
    });
  }
calculateIndividualCharts=(product)=>{
  let charts=[];
  
  let totalVendido=0, totalCapConfig = 0,totalDineroVendido=0, totalDineroPosible = 0;
  
  totalCapConfig=product.vm_forecast_dash_CAPACIDAD_CONFIGURADA;
  totalVendido=product.vm_forecast_dash_VENDIDO;
  const preciopieza = product.vm_forecast_dash_VENDIDO == 0 ? 0 : product.vm_forecast_dash_VAL_VENDIDO/product.vm_forecast_dash_VENDIDO;
  totalDineroPosible = preciopieza*totalCapConfig;
  totalDineroVendido =product.vm_forecast_dash_VAL_VENDIDO;

  charts.push({
    title:"Capacidad",
    axis:[
      ["Vendido", "En máquina"],
      ["Vendido", totalVendido],
      ["En máquina", totalCapConfig-totalVendido]
    ],
    size:100
  });
  charts.push({
    title:"Ventas",
    axis:[
      ["Vendido", "Por vender"],
      ["Vendido", totalDineroVendido],
      ["Por vender", totalDineroPosible-totalDineroVendido]
    ],
    size:100
  });

  this.setState({productCharts:charts});
}

  search = () => {
    this.getProducts();
  }

  resetSearch = () => {
    this.setState({filteredData:this.state.productsData,query:"",typeProduct:ALLFILTERS,searchArca:false},()=>{
      this.getProducts();
    });
  }

  onChange = (currentSlide) => {
    //console.log(currentSlide);
  }

  calculatePages = (carouselSize,data)=>{
    return Math.floor(data/carouselSize);
  }

  createArray = (size) =>{
    let cont=0;
    return Array.from({ length: size }, () => {cont++; return cont});
  }

  getProducts() {
    const {upgradedView, searchArca, typeProduct, query, productsData} = this.state;
    const itemsPerRow=12;

    let filteredData = [];

    //console.log(typeProduct);
    productsData.map((x)=>{
      var applies = false;
      var typi = "";
      for (var i = 0; i < typeProduct.length; i++) {
        
        
        if (x.cp_tipo.toUpperCase().includes(typeProduct[i].toUpperCase()) || x.cp_tipo=="") {
          applies = true;
          typi = typeProduct[i];
          break;
        }
      }
      if(query != "" && !x.vm_forecast_dash_PRODUCTO.toUpperCase().includes(query.toUpperCase())){
        applies=false;
      }
      if(applies && ((x.cp_arca=="true" && searchArca) || !searchArca )){
        filteredData.push(x);
        //console.log(x.vm_forecast_dash_PRODUCTO,"vs",query," --- tipo:",x.cp_tipo,"vs",typi," --- arca:",x.cp_arca);
      
      }
    })
    const len= filteredData.length;
    const pages= Math.ceil(len/itemsPerRow);
    
    let pagesArray = Array.from({ length: pages }, () => "0");
    let insides=[];
    let cont = 0;
    
    //console.log("Productos:",filteredData.length," --- Paginas:",pages)
    pagesArray.map((page,k)=>{
      insides.push( 
        <Row className="carouselPage" key={k}>
          {filteredData.map((product, k2) => {
            if(k2<cont || k2>cont+(itemsPerRow-1)) return;
            
            return(
            <Col key={k2} xs="12" sm="6" md="4" lg="3" xl="2">
              <Product data={product} upgradedView={upgradedView} classUpg={false ? product.vm_forecast_dash_obs_cliente+"-upg ":""} hoverObj={this.hoverObjectChange} clickObj={this.clickObjectChange} isSelected={product==this.state.selectedProduct}/>
            </Col>
            )
          })
        }</Row>
      )
      cont+=12;
    }) 

    this.setState({filteredData,queryProducts:insides, search:false});
    return insides;
  }

  checkImageRegex(name){
    let src= ""
      if (name.toUpperCase().includes("PANADE") ) {
        src= "/Images/breadIcon.png";
      } else if (name.toUpperCase().includes("BOTAN")) {
        src= "/Images/snackIcon.png";
      } else if (name.toUpperCase().includes("DULCE")) {
        src= "/Images/candyIcon.png";
      } else if (name.toUpperCase().includes("BEBID")) {
        src= "/Images/waterIcon.png";
      } else {
        src= "/Images/anyIcon.png";
      }
      return src;
  }

  upgradeAll = (onlyState) =>{
    const {productsData,vendingRows,vendingCols} = this.state;
    let cleanedData = [];
    cleanedData=this.sortForecastData(productsData);
    let productsInVending = this.empty2dArray(vendingRows,vendingCols);
    //debugger;
    //console.log(JSON.stringify(productsInVending));
    cleanedData.map((data,i)=>{
      let added = false;
      productsInVending.map((y,j)=> {
        //console.log("row:"+y);
        if(added) return;
        y.map((x,k)=> {
          //console.log("col:"+x);
          if(added)return;
          if(Object.keys(x).length==0){
            added=true;
            productsInVending[j][k]=data;
          }
        });
      });
    });
    if(onlyState){
      this.setState({upgradedVending:productsInVending});
      return;
    }
    this.setState({
      productsInVending,
      suggestionView:true
    }, () => {
      this.refreshCarousel();
    });
    
    this.calculateGeneralCharts(productsInVending);
  }

  upgradeAll = (onlyState) =>{
    const {productsData,vendingRows,vendingCols} = this.state;
    let cleanedData = [];
    cleanedData=this.sortForecastData(productsData);
    let productsInVending = this.empty2dArray(vendingRows,vendingCols);
    //debugger;
    //console.log(JSON.stringify(productsInVending));
    cleanedData.map((data,i)=>{
      let added = false;
      productsInVending.map((y,j)=> {
        //console.log("row:"+y);
        if(added) return;
        y.map((x,k)=> {
          //console.log("col:"+x);
          if(added)return;
          if(Object.keys(x).length==0){
            added=true;
            productsInVending[j][k]=data;
          }
        });
      });
    });
    if(onlyState){
      this.setState({upgradedVending:productsInVending});
      return;
    }
    this.setState({
      productsInVending,
      suggestionView:true
    }, () => {
      this.refreshCarousel();
    });
    
    this.calculateGeneralCharts(productsInVending);
  }
  removeUpgrade = () =>{

    const {productsData,vendingCols,vendingRows} = this.state;
    let prod = [];
    if(sessionStorage.getItem("savedVending")){
      prod = JSON.parse(sessionStorage.getItem("savedVending"));
    }
    
    this.setState({
      productsInVending:prod,
      suggestionView:false,
    }, () => {
      this.refreshCarousel();
  });
    this.calculateGeneralCharts(prod);
  }

  formatDate(dateString) {
    // Crea un objeto Date a partir de la cadena
    const date = new Date(dateString);

    // Extrae el día, mes y año
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() devuelve un índice basado en cero, por lo que se suma 1
    const year = date.getFullYear();
    
    // Retorna la cadena formateada, asegurándote de que el día y el mes tengan dos dígitos
    return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
}
  
}

export default Dashboard