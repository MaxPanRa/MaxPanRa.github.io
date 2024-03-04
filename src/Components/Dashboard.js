/*Components*/
import BinaryPieChart from "./PieChart/BinaryPieChart";

/*Bootstrap*/
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Product from './Product/Product';
import { oauth_login } from "../LookerSession";

function Dashboard() {
  const newData = [
    ["Good", "Bad"],
    ["Good", 22],
    ["Bad", 2]
  ];

  const newOptions = {
    legend: "none",
    pieSliceText: "none",
    tooltip: { trigger: "label" },
    slices: {
      0: { color: "Green" },
      1: { color: "Lightgray" },
    }, 
  };

  const testProd={imagen:"/Images/LataCoca.png",nombre:"Coca",cantidad:2};

  oauth_login();

  return (
    <>
      <Container id="wrapper-background">
        <Row id="wrapper">
           <Col>
           </Col>
           <Col>
            <Row className='pie-chart-block'>
              <Col>
                <BinaryPieChart title={"Capacidad"} data={newData} options={newOptions} />
              </Col>
              <Col>
                <BinaryPieChart title={"Disponibilidad"} data={newData} options={newOptions} />
              </Col>
              <Col>
                <BinaryPieChart title={"Venta Óptima"} data={newData} options={newOptions} />
              </Col>
            </Row>
            <Row>
              <h1>SOCVI</h1>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
            </Row>
            <Row>
              <h1>OSS SDK</h1>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
              <Col>
                <Product data={testProd} />
              </Col>
            </Row>
           </Col>
        </Row>
      </Container>
    </>
  )
}

export default Dashboard