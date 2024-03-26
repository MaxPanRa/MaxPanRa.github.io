import React, { Component } from "react";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
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
       };
    }

    componentDidMount(){
        this.setState({
            allData:this.props.allData,
            dataBefore:this.props.dataBefore,
            dataAfter:this.props.dataAfter,
            show: this.props.show,
            tkn:this.props.tkn
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
    }

    render(){
        //console.log(data);
        const {dataBefore,dataAfter,show, recommended}=this.state;
        return (
            <Container className={show ? "recom-show blackdrop":"recom-hide blackdrop"}>
                <Container className="recom-white">
                    <Row className="recom-title">
                        <h2 className="recom-title-gral">Sugerencias</h2>
                    </Row>
                    <Row className="prod-block-div-row-1">
                        <Col>
                            <Container className="aftrem">
                            {recommended.map((x,k)=>
                            <div className={x.vm_forecast_dash_obs_cliente+"-recom prod-txt"}>{x.vm_forecast_dash_PRODUCTO}
                            <span className="filacol-title">{/*"Fila ["+x.x+"] Columna ["+x.y+"]"*/"Producto #"+x.vm_forecast_dash_row_num}</span>
                                {x.suggestions.map((y,l)=>
                                    <span key={l} className="suggestion" onClick={()=>{console.log(y)}}>{y.vm_forecast_dash_PRODUCTO}</span>
                                )}
                            </div>
                            )}
                            </Container>
                        </Col>
                    </Row>
                    <Row>
                        <Button className="btn-closeModal" type="primary" shape="default" icon={<CloseOutlined />} onClick={()=>{this.props.changeShow()}} >Volver</Button>
                    </Row>
                </Container>
            </Container>
        );
    }

    searchRecommendations = async (subData) => {
        let html = [];
        let tk = this.state.tkn;
        
        subData.map(async (productRow,j)=>{
            productRow.map(async(product,k)=>{
                if(Object.keys(product).length==0) return;
                var newProd = product;
                var suggestions = [];
                //console.log(product);
                    try {
                        const slug = await get_slug(tk,QUERY_RECOMMENDATIONS(newProd));
                        try{
                            if(newProd.vm_forecast_dash_obs_cliente != "UP"){
                                suggestions = await get_all_data(slug,tk); //LOOKER JSONS
                            }
                        }catch(e){
                            console.error("No se pudo obtener el resultado del query:", e);
                        }finally{
                            console.log("for",newProd.cp_PRODUCTO,"Suggestions:",suggestions);
                            newProd.suggestions = suggestions;
                            newProd.x=j+1;
                            newProd.y=k+1;
                            html.push(newProd);
                        }
                    } catch (error) {
                        console.error("No se pudo obtener el Token:", error);
                    }
                
            }) 
        })
        this.setState({recommended:html});
        return html;
    }

}
export default Recommendations;