import React, { Component } from "react";
import jsPDF from 'jspdf';
import { renderToStaticMarkup } from 'react-dom/server'

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Button } from "antd";
import { CloseOutlined, EyeFilled, EyeInvisibleFilled } from "@ant-design/icons";
import { QUERY_RECOMMENDATIONS } from "../../Constants";
import { get_all_data, get_slug, oauth_login } from "../../LookerSession";

class Recommendations extends Component {

    constructor(props){
      super(props);
      this.state ={
            allData:[],
           dataBefore: [],
           dataAfter: [],
           show: false, 
           recommended:[],
           tkn:"",
           listTitle:"",
       };
    }

    componentDidMount(){
        this.setState({
            allData:this.props.allData,
            dataBefore:this.props.dataBefore,
            dataAfter:this.props.dataAfter,
            show: this.props.show,
            tkn:this.props.tkn,
            listTitle:this.props.listTitle,
            loading:false,
        },()=>{
            this.searchRecommendations(this.state.dataBefore);
        })
        //console.log("RECOMM Before:"+JSON.stringify(this.props.dataBefore))
        //console.log("RECOMM After:"+JSON.stringify(this.props.dataAfter))
    }

    componentDidUpdate(prevProps){
        if (this.props.dataBefore !== prevProps.dataBefore) {
            this.setState({ dataBefore: this.props.dataBefore });
            this.searchRecommendations(this.props.dataBefore);
        }
        if (this.props.dataAfter !== prevProps.dataAfter) {
            this.setState({ dataAfter: this.props.dataAfter });
        }
        if (this.props.show !== prevProps.show) {
            this.setState({ show: this.props.show });
        }  
        if (this.props.tkn !== prevProps.tkn) {
            this.setState({ tkn: this.props.tkn });
        }
        if (this.props.listTitle !== prevProps.listTitle) {
            this.setState({ tkn: this.props.listTitle });
        }
    }

    render(){
        //console.log(data);
        const {dataBefore,dataAfter,show, recommended, listTitle, loading}=this.state;
        return (
            <Container className={show ? "recom-show blackdrop":"recom-hide blackdrop"}>
                <Container className="recom-white">
                    <Row className="recom-title">
                        {loading?<h2 className="recom-title-gral">Cargando Sugerencias...</h2>:<h2 className="recom-title-gral">Sugerencias</h2>}
                    </Row>
                    <Row className="recom-title">
                        {<h2 className="recom-title-gral">{listTitle}</h2>}
                    </Row>
                    <Row className="prod-block-div-row-1">
                        <Col>
                        <Container className="aftrem">
                            {recommended.map((x,k)=>
                            <div className={x.vm_forecast_dash_obs_cliente+"-recom prod-txt"}>{x.vm_forecast_dash_PRODUCTO}
                            <span className="filacol-title">{/*"Fila ["+x.x+"] Columna ["+x.y+"]"*/"Producto #"+x.vm_forecast_dash_row_num}</span>
                                {x.suggestions.map((y,l)=>
                                    <span key={l} className="suggestion" onClick={()=>{console.log(y)}}>{"Cambiar por: "+y.p_PRODUCTO}</span>
                                )}
                            </div>
                            )}
                            </Container>
                        </Col>
                    </Row>
                    <Row>
                        <Button className="btn-closeModal" type="primary" shape="default" icon={<CloseOutlined />} onClick={()=>{this.props.changeShow()}} >Volver</Button>
                    </Row>
                    <Row>
                    <Button className="btn-generatePDF" disabled={loading} type="dashed" shape="default" icon={<EyeFilled />} onClick={()=>{this.generatePDF()}} >Generar PDF</Button>
                    </Row>
                </Container>
            </Container>
        );
    }

    generatePDF = () =>{
        const {recommended} = this.state;

        const doc = new jsPDF({
			format: 'letter',
            precision:2,
            orientation: 'p',
            unit: 'px',
            putOnlyUsedFonts: true,
		});
        doc.setTextColor("black");

        let htmlElem = (
            recommended.map((x,k)=>
            <div style={{fontFamily:"Arial",fontSize:"10px !important",width:"500px"}} className={x.vm_forecast_dash_obs_cliente+"-recom prod-txt"}>{x.vm_forecast_dash_PRODUCTO+ " Producto #"+x.vm_forecast_dash_row_num}
                {x.suggestions.map((y,l)=>
                    <span style={{fontFamily:"Arial",fontSize:"10px !important",width:"500px"}} key={l} className="suggestion" >{"Cambiar por: "+y.p_PRODUCTO}</span>
                )}
            </div>
            )
        )

        htmlElem = renderToStaticMarkup(htmlElem);
        doc.html(htmlElem, {
			async callback(doc) {
				await doc.save('document');
			},
		});
    }

    searchRecommendations = async (subData) => {
        let html = [];
        let tk = this.state.tkn;
        this.setState({loading:true});
        let total = subData.length;
        let currents = 0;
        subData.map(async (productRow,j)=>{
            productRow.map(async(product,k)=>{
                if(Object.keys(product).length==0) return;
                var newProd = product;
                var suggestions = [];
                //console.log(product);
                    try {
                        this.setState({loading:true});
                        let slug = "";
                        if(newProd.vm_forecast_dash_obs_cliente == "DOWN"){
                            slug = await get_slug(tk,QUERY_RECOMMENDATIONS(newProd));
                        }
                        try{
                            if(newProd.vm_forecast_dash_obs_cliente == "DOWN"){
                                suggestions = await get_all_data(slug,tk); //LOOKER JSONS
                            }
                        }catch(e){
                            console.error("No se pudo obtener el resultado del query:", e);
                        }finally{
                            //console.log("for",newProd.cp_PRODUCTO,"Suggestions:",suggestions);
                            var newSuggestions=[];
                            var cont = 0;
                            suggestions.map((x,k)=>{
                                if(x!=product && cont<3 ){
                                    cont++;
                                    newSuggestions.push(x);
                                }
                            })
                            newProd.suggestions = newSuggestions;
                            newProd.x=j+1;
                            newProd.y=k+1;
                            html.push(newProd);
                            html = html.sort((a,b)=>a.vm_forecast_dash_row_num-b.vm_forecast_dash_row_num);
                            currents++;
                            this.setState({recommended:html});
                            if(currents-1 >= total){
                                this.setState({loading:false});
                            }
                        }
                    } catch (error) {
                        console.error("No se pudo obtener el Token:", error);
                    }
                
            }) 
        })
        return html;
    }

}
export default Recommendations;