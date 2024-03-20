import React, { Component, Fragment } from "react";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Figure from 'react-bootstrap/Figure'
import FigureImage from 'react-bootstrap/FigureImage'

import axios from 'axios';

const regexWater = /[0-9]*(([Mm]+[lL]+)+|([Mm]+[Nn]+[Rr]+)+|([Oo]+[Zz]+))/;
const regexBag = /[0-9]*(([Gg]+\s+)+|([Gg]+[Rr]+)+|([Gg]$))/;

class Product extends Component {

    constructor(props){
      super(props);
      this.state ={
           data: null, 
           imageSrc:"",
           arcaSrc:"",
           isUpgradedView:false,
           isSelected:false,
           hoverObj:()=>{},
           clickObj:()=>{},
       };
    }

    componentWillMount(){
        const data = this.props.data;
        this.setState({
            isUpgradedView:this.props.isUpgradedView,
            isSelected:this.props.isSelected,
            data: this.props.data
        })
    }
    componentDidMount(){
        const {data} = this.state;
        this.checkImageRegex(data.vm_forecast_dash_type);
        this.setState({arcaSrc:"/Images/ARCAIcon.png"});
        this.setState({
            isUpgradedView:this.props.isUpgradedView,
            isSelected:this.props.isSelected,
            data: this.props.data
        })
    }

    componentDidUpdate(prevProps){
        if (this.props.isUpgradedView !== prevProps.isUpgradedView) {
            this.setState({ isUpgradedView: this.props.isUpgradedView });
        }
        if (this.props.isSelected !== prevProps.isSelected) {
            this.setState({ isSelected: this.props.isSelected });
        }
        if (this.props.data !== prevProps.data) {
            this.setState({ data: this.props.data });
        }
    }

    render(){
        //console.log(data);
        let {data,imageSrc,arcaSrc, isUpgradedView, isSelected}=this.state;
        const upgClass = isUpgradedView ? data.vm_forecast_dash_obs_cliente+"-upg ":"";
        return (
            <Container className={isSelected ? upgClass+"prod-block selected":upgClass+"prod-block"} onMouseEnter={()=>{this.props.hoverObj(data)}} onMouseUp={()=>{this.props.clickObj(data)}}>
                <Row className="prod-block-qty-row">
                    <span className="prod-block-qty">QTY: {data.vm_forecast_dash_capacidad_configurada}</span>
                </Row>
                <Row className="prod-block-div-row">
                    <div className="prod-block-div">
                        <img src={imageSrc} alt={data.vm_forecast_dash_producto}/>
                        {data.vm_forecast_dash_arca=="true"?<img src={arcaSrc} alt={data.vm_forecast_dash_producto} className="arca-Icon"/>:""}
                    </div>
                </Row>
                <Row className="prod-block-title-row">
                    <span className="prod-block-title">{data.vm_forecast_dash_producto}</span>
                </Row>
                
            </Container>
        );
    }

    checkImageRegex(name){
        if (name.toUpperCase().includes("PANADE") ) {
            this.setState({imageSrc: "/Images/breadIcon.png"});
        } else if (name.toUpperCase().includes("BOTAN")) {
            this.setState({imageSrc: "/Images/snackIcon.png"});
        } else if (name.toUpperCase().includes("DULCE")) {
            this.setState({imageSrc: "/Images/candyIcon.png"});
        } else if (name.toUpperCase().includes("BEBID")) {
            this.setState({imageSrc: "/Images/waterIcon.png"});
        } else {
            this.setState({imageSrc: "/Images/anyIcon.png"});
        }
    }

}
export default Product;