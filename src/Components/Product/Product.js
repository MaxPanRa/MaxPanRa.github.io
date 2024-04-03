import React, { Component } from "react";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

const regexWater = /[0-9]*(([Mm]+[lL]+)+|([Mm]+[Nn]+[Rr]+)+|([Oo]+[Zz]+))/;
const regexBag = /[0-9]*(([Gg]+\s+)+|([Gg]+[Rr]+)+|([Gg]$))/;

class Product extends Component {

    constructor(props){
      super(props);
      this.state ={
           classUpg:"",
           data: null, 
           imageSrc:"",
           arcaSrc:"",
           upgradedView:false,
           isSelected:false,
           hoverObj:()=>{},
           clickObj:()=>{},
       };
    }

    componentWillMount(){
        const data = this.props.data;
        this.setState({
            upgradedView:this.props.upgradedView,
            isSelected:this.props.isSelected,
            classUpg: this.props.classUpg,
            data: this.props.data
        })
    }
    componentDidMount(){
        const {data} = this.state;
        this.checkImageRegex(data.cp_tipo);
        this.setState({arcaSrc:"/Images/ARCAIcon.png"});
        this.setState({
            upgradedView:this.props.upgradedView,
            isSelected:this.props.isSelected,
            classUpg: this.props.classUpg,
            data: this.props.data
        })
    }

    componentDidUpdate(prevProps){
        if (this.props.upgradedView !== prevProps.upgradedView) {
            this.setState({ upgradedView: this.props.upgradedView });
        }
        if (this.props.classUpg !== prevProps.classUpg) {
            this.setState({ classUpg: this.props.classUpg });
        }
        if (this.props.isSelected !== prevProps.isSelected) {
            this.setState({ isSelected: this.props.isSelected });
        }
        if (this.props.data !== prevProps.data) {
            this.setState({ data: this.props.data });
            this.checkImageRegex(this.props.data.cp_tipo);
        }
    }

    render(){
        //console.log(data);
        let {data,imageSrc,arcaSrc, isSelected, classUpg}=this.state;
        return (
            <Container className={isSelected ? classUpg+"prod-block selected":classUpg+"prod-block"} onMouseEnter={()=>{this.props.hoverObj(data)}} onMouseUp={()=>{this.props.clickObj(data)}}>
                <Row className="prod-block-qty-row" >
                    {/*<span className="prod-block-qty">QTY: {data.vm_forecast_dash_CAPACIDAD_CONFIGURADA}</span>*/}
                </Row>
                <Row className="prod-block-div-row">
                    <div className="prod-block-div">
                        <img src={imageSrc} alt={data.vm_forecast_dash_PRODUCTO}/>
                        {data.cp_arca=="true"?<img src={arcaSrc} alt={data.vm_forecast_dash_PRODUCTO} className="arca-Icon"/>:""}
                    </div>
                </Row>
                <Row className="prod-block-title-row">
                    <span className="prod-block-title">{data.vm_forecast_dash_PRODUCTO}</span>
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