import { Fragment } from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const Product = ({ data}) => {
    console.log(data);
  return (
    <Container className="prod-block">
        <Row>
            <span className="prod-block-qty">{data.cantidad}</span>
        </Row>
        <Row>
            <div className="prod-block-div">
                <img src={data.imagen} alt={data.nombre}/>
            </div>
        </Row>
        <Row>
            <span className="prod-block-title">{data.nombre}</span>
        </Row>
        
    </Container>
  );
};

export default Product;