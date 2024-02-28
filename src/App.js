import logo from './logo.svg';
import './App.css';

/*Looker API*/
import { login } from './LookerSession';

/*Components*/
import BinaryPieChart from "./Components/PieChart/BinaryPieChart";

/*Bootstrap*/
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function App() {
  login();
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
  return (
    <>
      <Container id="Wrapper">
        <Row>
           <Col>
           </Col>
           <Col>
            <Row>
              
            </Row>
            <Row>
              <h1>SOCVI</h1>
            </Row>
            <Row>
              <h1>OSS SDK</h1>
            </Row>
           </Col>
          <BinaryPieChart title={"Calidad"} data={newData} options={newOptions} />
        </Row>
      </Container>
    </>
  )
}

export default App