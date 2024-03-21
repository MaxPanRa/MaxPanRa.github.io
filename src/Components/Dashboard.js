import React, { Component } from "react";

/*Components*/
import BinaryPieChart from "./PieChart/BinaryPieChart";

/*Bootstrap*/
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Pagination from 'react-bootstrap/Pagination';

import Product from './Product/Product';
import { get_all_data, get_slug, oauth_login } from "../LookerSession";
import data from './data.json';

import { Button, Carousel, Flex, Image, Input, Space, Tooltip } from 'antd';
import { ArrowLeftOutlined, CaretRightOutlined, CheckCircleOutlined, ClearOutlined, LeftCircleOutlined, LeftSquareOutlined, ReloadOutlined, RightCircleOutlined, RightSquareOutlined, SearchOutlined, SettingFilled, StopOutlined } from "@ant-design/icons";
import { ALLFILTERS } from "../Constants";

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
    height: "70%",
    width: "100%"
  },

}
class Dashboard extends Component {   

  constructor(props){
    super(props);
    this.state ={
         jsonData:{},
         productsData: null,
         allProductsData:null,
         hoverObject:{},
         vendingProdsByCell:6,
         vendingRows:5,
         vendingCols:10,
         query:"",
         queryProducts:[],
         searchArca:false,
         typeProduct:ALLFILTERS,
         generalCharts:[],
         productCharts:[],
         selectedProduct:{},
         vendingEmpty:[],
         productsInVending:[],
         upgradedView:false,
         
     }
  }

  componentWillMount=()=>{
    const jsonData = [];
    this.setState({jsonData})
    const {vendingCols,vendingRows} = this.state;
    console.log(this.empty2dArray(vendingRows,vendingCols));
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
    let jsonData = []
    let tk = "";
    //debugger;
    try {
      const response = await oauth_login();
      //debugger;
      console.log("TOKEN?"+response);
      tk = response.access_token;
      const slug = await get_slug(tk);
      try{
        jsonData = await get_all_data(slug,tk);
        window.history.replaceState(null, '', window.location.pathname);
      }catch(e){
        jsonData=this.state.jsonData; 
      }

      this.setState({ data });
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
    this.setState({jsonData},()=>{
      this.setState({productsData:jsonData, allProductsData:jsonData, queryProducts:this.getProducts(jsonData,12)});
      let productsVend=[];
      if(sessionStorage.getItem("savedVending")){
        try{
          this.setState({productsInVending:JSON.parse(sessionStorage.getItem("savedVending"))});
          productsVend=JSON.parse(sessionStorage.getItem("savedVending"));
        }catch(error){
          sessionStorage.clear("savedVending")
        }
      }
      this.calculateGeneralCharts(productsVend);
    })
  }

  render() {
    const {productsData,vendingRows,vendingCols,query, searchArca, typeProduct, hoverObject,productCharts,generalCharts, productsInVending, queryProducts, upgradedView} = this.state;
    //oauth_login();
    
    const vendR= this.createArray(vendingRows);
    const vendC= this.createArray(vendingCols);
    let windowSize= window.innerHeight;
    if(productCharts==[])
    return "";
    return (
      <>
        <Container id="wrapper-background" style={{height:windowSize+"px"}} onMouseMove={()=>{windowSize=window.innerHeight}}>
          <Row id="wrapper">
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
                          return (<Col onClick={()=>{this.moveProductVending(j,k)}} key={k} className={Object.keys(productsInVending[j][k]).length > 0 ? upgClass+"vending-prod filled-vend":upgClass+"vending-prod"} 
                            style={{"maxWidth":"80px","maxHeight":"100px","width":""+100/vendC.length+"%"}}>{
                              Object.keys(productsInVending[j][k]).length > 0? 
                                <Tooltip title={""+productsInVending[j][k].vm_forecast_dash_producto} className={"btn-vend"}>
                                  <Image preview={false} src={this.checkImageRegex(productsInVending[j][k].vm_forecast_dash_type)}/>
                                  {productsInVending[j][k].vm_forecast_dash_arca=="true"?<img src={"/Images/ARCAIcon.png"} alt={data.vm_forecast_dash_producto} className="arca-Icon-vend"/>:""}
                                  <span className="btn-vend-txt">{productsInVending[j][k].vm_forecast_dash_producto}</span>
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
                <Row className="vending-row-btns" style={{display:"none"}}>
                  <div className="vm-btns-sqr vm-btns"></div>
                  <div className="vm-btns-sqr-long vm-btns">
                    <div className="vm-btns-sqr-1 vm-btns">
                      <div className="vm-btns-sqr-2 vm-btns"></div>
                      <div className="vm-btns-sqr-3 vm-btns"></div>
                      <div className="vm-btns-sqr-4 vm-btns"></div>
                    </div>
                    <div className="vm-btns-double-1 vm-btns">
                      <div className="vm-btns-sqr-dbl-1 vm-btns "></div>
                      <div className="vm-btns-sqr-dbl-2 vm-btns"></div>
                    </div>
                    <div className="vm-btns-double-1 vm-btns">
                      <div className="vm-btns-sqr-dbl-1 vm-btns"></div>
                      <div className="vm-btns-sqr-dbl-2 vm-btns"></div>
                    </div>
                    <div className="vm-btns-double-1 vm-btns">
                      <div className="vm-btns-sqr-dbl-1 vm-btns"></div>
                      <div className="vm-btns-sqr-dbl-2 vm-btns"></div>
                    </div>
                    <div className="vm-btns-sqr-5 vm-btns"></div>
                    <div className="vm-btns-sqr-6 vm-btns">
                      <div className="vm-btns-sqr-7 vm-btns"></div>
                    </div>
                    <div className="vm-btns-sqr-8 vm-btns">
                      <div className="vm-btns-sqr-9 vm-btns"></div>
                    </div>
                    <div className="vm-btns-sqr-10">
                      <div className="vm-btns-sqr-11"></div>
                    </div>
                    <div className="vm-btns-sqr-12"></div>
                  </div>
                </Row>
              </Col>
              <Col sm={3} id="vending-charts">
                <Row className="vending-row">
                  <Row className="vending-actions">
                    {upgradedView?
                    <Tooltip title="Salir de vista Mejorada" className="tool-vend">
                      <Button type="dashed" shape="circle" icon={<StopOutlined />} onClick={()=>{this.removeUpgrade()}} />
                    </Tooltip> 
                    :
                    <Tooltip title="Mostrar Mejora" className="tool-vend">
                      <Button type="dashed" shape="circle" icon={<CheckCircleOutlined />} onClick={()=>{this.upgradeAll()}} />
                    </Tooltip>
                    }
                    <Tooltip title="Vaciar Máquina" className="tool-vend" >
                      <Button type="primary" shape="circle" icon={<ClearOutlined />} onClick={()=>{this.cleanVending()}} style={this.vendingHasProducts()?{opacity:1}:{opacity:0,pointerEvents:"none"}}/>
                    </Tooltip> 
                  </Row>
                {generalCharts.length==0 ?"":
                  generalCharts.map((data,k)=>
                  <Col key={k} sm={12} className="chartBox">
                    <BinaryPieChart title={data.title} data={data.axis} options={PieChartOPTIONS} size={data.size+"px"}/>
                  </Col>
                  )}
                  
                </Row>
              </Col>
            </Row>
            <Row id="charts-products-wrap" style={{height:"50%"}}>
              <Col sm={12} md={3} id="product-charts">
                <Container className="containPad">
                  <Row className='pie-chart-block blue-box'>
                    <div className="title-card"><h2>{hoverObject.vm_forecast_dash_producto!=null?hoverObject.vm_forecast_dash_producto:"Información del Producto"}</h2></div>
                    {productCharts.length==0?"":
                      productCharts.map((data,k)=>
                      <Col key={k} sm={12} className="chartBox">
                        <BinaryPieChart title={data.title} data={data.axis} options={PieChartOPTIONS} size={data.size+"px"}/>
                      </Col>
                    )}
                  </Row>
                </Container>
              </Col>
              <Col sm={12} md={7} id="products-section">
                <Container className="containPad">
                  <Col sm={12} md={10} id="carousel-box">
                    <Row className="gray-box">
                      <h1>SOCVI</h1>
                      {queryProducts.length == 0 ? "":
                      <Carousel touchMove arrows afterChange={this.onChange} dots={true} dotWidth={20} prevArrow={<LeftSquareOutlined />} nextArrow={<RightSquareOutlined />} >
                        {queryProducts.map((x)=>x)}
                        </Carousel>
                      }
                    </Row>
                  </Col>
                </Container>
              </Col>
              <Col sm={12} md={2} id="search-section">
                <Container className="containPad">
                  <Row className="blue-box">
                    <Col sm={12} md={10} id="search-bar" >
                      <Row className="search-section-in">
                        <Input placeholder="input search text" className="search-inp" value={query} onChange={(val)=>{this.setState({query:val.currentTarget.value})}} />
                        <Button type="primary" className="search-btn" style={{padding:"0px 10px"}} onClick={()=>this.search()}><SearchOutlined style={{ fontSize: '18px'}} /></Button>
                      </Row>
                    </Col>
                    <Col sm={12} md={22} id="carousel-sett">
                      <Row className="multi-button">
                        <div className="subtitle-card"><h2>Marca</h2></div>
                        <Space/>
                        <Button type={!searchArca?"primary":"default"} className="dual-btn" style={{padding:"0px 10px"}} onClick={()=>{this.setState({searchArca:false})}}>Todos</Button>
                        <Button type={searchArca?"primary":"default"} className="dual-btn" style={{padding:"0px 10px"}} onClick={()=>{this.setState({searchArca:true})}}>Arca</Button>
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
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>  
          </Row>
        </Container>
      </>
    )
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

  refreshCarousel=()=>{
    const {productsData}=this.state;
    this.getProducts(productsData,12);
  }
  cleanVending = () =>{
    const {vendingCols,vendingRows} = this.state;
    const d2 =this.empty2dArray(vendingRows,vendingCols);
    this.setState({productsInVending:d2});
    this.setState({generalCharts:[]});
    sessionStorage.clear("savedVending");
  }

  hoverObjectChange = (hoverObject) =>{
    this.setState({hoverObject});
    this.calculateIndividualCharts(hoverObject);
  }

  clickObjectChange = (clickObject)=>{
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
    const {selectedProduct,upgradedView} = this.state;
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
    if(!upgradedView)
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
    if(filter.find((x)=>x==word) !=null){
      newfilter= filter.map((x)=>x!=word);
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
          totalCapConfig+=x.vm_forecast_dash_capacidad_configurada;
          totalVendido+=x.vm_forecast_dash_vendido;
          const preciopieza = x.vm_forecast_dash_vendido == 0 ? 0 : x.vm_forecast_dash_val_vendido/x.vm_forecast_dash_vendido;
          totalDineroPosible+= preciopieza*totalCapConfig;
          totalDineroVendido+=x.vm_forecast_dash_val_vendido;
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
        size:130
      });
    }
    if(totalDineroVendido>0 && totalDineroPosible-totalDineroVendido > 0){
      charts.push({
        title:"Compras",
        axis:[
          ["Vendido", "Por vender"],
          ["Vendido", totalDineroVendido],
          ["Por vender", totalDineroPosible-totalDineroVendido]
        ],
        size:130
      });
    }

    this.setState({generalCharts:charts});
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
  
  totalCapConfig=product.vm_forecast_dash_capacidad_configurada;
  totalVendido=product.vm_forecast_dash_vendido;
  const preciopieza = product.vm_forecast_dash_vendido == 0 ? 0 : product.vm_forecast_dash_val_vendido/product.vm_forecast_dash_vendido;
  totalDineroPosible = preciopieza*totalCapConfig;
  totalDineroVendido =product.vm_forecast_dash_val_vendido;

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
    title:"Compras",
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
    const query = this.state.query;
    alert(query);
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

  getProducts(data,itemsPerRow) {
    const len= data.length;
    const pages= Math.ceil(len/itemsPerRow);
    
    let pagesArray = Array.from({ length: pages }, () => "0");
    let insides=[];
    let cont = 0;

    pagesArray.map((page,k)=>{
      insides.push( <Row className="carouselPage" key={k}>
        {data.map((product, k2) => {
          if(k2<cont || k2>cont+(itemsPerRow-1)) return;
          
          return(
          <Col key={k2} xs="12" sm="6" md="4" lg="3" xl="2">
            <Product data={product} isUpgradedView={this.state.upgradedView} hoverObj={this.hoverObjectChange} clickObj={this.clickObjectChange} isSelected={product==this.state.selectedProduct}/>
          </Col>
          )
        })
      }</Row>)
      cont+=5;
    }) 
    this.setState({queryProducts:[]}, () => {
      this.setState({queryProducts:insides})
      });
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

  upgradeAll = () =>{
    const {productsData,vendingRows,vendingCols} = this.state;
    let cleanedData = [];
    cleanedData=this.sortForecastData(productsData);
    let productsInVending = this.empty2dArray(vendingRows,vendingCols);
    //debugger;
    //console.log(JSON.stringify(productsInVending));
    cleanedData.map((data,i)=>{
      let added = false;
      productsInVending.map((y,j)=> {
        console.log("row:"+y);
        if(added) return;
        y.map((x,k)=> {
          console.log("col:"+x);
          if(added)return;
          if(Object.keys(x).length==0){
            added=true;
            productsInVending[j][k]=data;
          }
        });
      });
    });
    this.setState({
      productsInVending,
      upgradedView:true
    }, () => {
      this.refreshCarousel();
    });
    
    this.calculateGeneralCharts(productsInVending);
  }
  removeUpgrade = () =>{
    const {productsData,vendingCols,vendingRows} = this.state;
    let prod = [];
    if(sessionStorage.getItem("savedVending")){
      try{
        prod = JSON.parse(sessionStorage.getItem("savedVending"));
      }catch(error){
        prod = this.empty2dArray(vendingRows,vendingCols);
      }
    }
    this.setState({
      productsInVending:prod,
      upgradedView:false,
    }, () => {
      this.refreshCarousel();
  });

    this.calculateGeneralCharts(prod);
  }

  
}

export default Dashboard