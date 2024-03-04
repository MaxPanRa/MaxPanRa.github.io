import { useNavigate } from "react-router-dom";
import { redeem_auth_code } from "../../LookerSession";


function Authenticated() {
  //alert("HOLA");
  const navigate = useNavigate();
  //navigate("/"+document.location.search);
  //console.log(document.location);
  redeem_auth_code(document.location.search);
  //navigate("/");
  return (
    <>
      <div>Validando Codigo Token de Autorización</div>
    </>
  )
}

export default Authenticated