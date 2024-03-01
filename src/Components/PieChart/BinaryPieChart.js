import { Fragment } from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Chart } from "react-google-charts";

const BinaryPieChart = ({ title, data, options }) => {
    console.log(data[1]);
    const total = data[1][1]+data[2][1];
    const partial = data[1][1];
  return (
    <Container className="pie-chart-container">
        <Row>
            <span className="pie-chart-title">{title}</span>
        </Row>
        <Row className="pie-desc-row">
            <Col xs lg="6">
                <Row className="center-all">
                    <span className="pie-chart-desc">{partial}/{total}</span>    
                </Row>
                <Row className="center-all">
                    <span className="pie-chart-subdesc">{(partial*100/total).toFixed(2)}%</span>   
                </Row>
            </Col> 
            <Col xs lg="6">
                <Chart
                    chartType="PieChart"
                    width="100%"
                    height="200px"
                    data={data}
                    options={options}
                />
            </Col>
        </Row>
    </Container>
  );
};

export default BinaryPieChart;