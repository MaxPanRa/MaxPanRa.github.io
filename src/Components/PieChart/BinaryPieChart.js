import { Fragment } from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Chart } from "react-google-charts";

const toMoney =(amount)=>{
    let formattedAmount = amount.toFixed(2);

    // Replace the dot with a comma for thousands and add MXN symbol
    formattedAmount = formattedAmount.replace(/(\d)(?=(\d{3})+\.)/g, '$1,');

    // Replace dot with comma for decimal point and return
    return `$ ${formattedAmount.replace('.', ',')}`;
}
const BinaryPieChart = ({ title, data, size, options, isMoney }) => {
    //console.log(data[1]);
    const total = data[1][1]+data[2][1];
    const partial = data[1][1];
    let part = partial;
    let tot = total;
    if(isMoney){
        part = toMoney(partial);
        tot = toMoney(total);
    }
  return (
    <Container className="pie-chart-container">
        <Row>
            <span className="pie-chart-title">{title}</span>
        </Row>
        <Row className="pie-desc-row">
            <Col xs lg="6">
                <Row className="center-all">
                    <span className="pie-chart-desc">{part}</span>    
                    <br/>
                    <span className="pie-chart-desc pie-chart-desc-div">{tot}</span>    
                </Row>
                <Row className="center-all">
                    <span className="pie-chart-subdesc">{(partial*100/total).toFixed(2)}%</span>   
                </Row>
            </Col> 
            <Col xs lg="6">
                <Chart
                    chartType="PieChart"
                    width="200px"
                    height={size}
                    data={data}
                    options={options}
                    
                />
            </Col>
        </Row>
    </Container>
  );
  
};



export default BinaryPieChart;