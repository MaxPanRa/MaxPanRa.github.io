import React, { Component } from "react";
import mpr from "./img/mpr.png";
import gtec from "./img/gtec.png";
import unam from "./img/unam.png";
import instagram from "./img/instagram.png";
import youtube from "./img/youtube.png";
import github from "./img/github.png";
import linkedin from "./img/linkedin.png";

import gal1 from "./gallery/1.png";
import gal2 from "./gallery/2.png";
import gal3 from "./gallery/3.mp4";
import gal4 from "./gallery/4.png";
import gal5 from "./gallery/5.png";
import gal6 from "./gallery/6.png";
import gal7 from "./gallery/7.png";
import { Animator, ScrollContainer, ScrollPage, batch, Fade, FadeIn, FadeOut, Move, MoveIn, MoveOut, Sticky, StickyIn, StickyOut, Zoom, ZoomIn, ZoomOut } from "react-scroll-motion";
import "./App.css";

const ZoomInScrollOut = batch(StickyIn(), FadeIn(), ZoomIn());
const FadeInZoomIn = batch(FadeIn(),ZoomIn());
const FadeInZoomOut = batch(FadeIn(),ZoomOut());
const FadeUp = batch(Fade(), Move(), Sticky());
const Redirect = (url)=>{window.open(url, "_blank")};

class App extends Component {
  
  render() { 
    return(
      <div>
        <div class="black-bg">
          <ScrollContainer >
            <ScrollPage>
            <Animator animation={FadeInZoomIn}>
              <div className="container-wallpaper white-shine" id="page-0">
                <div className="blur"></div>
                <Animator animation={batch(MoveOut(0,650))}>
                  <div className="container">
                    <span class="neucha" style={{ fontSize: "40px" }}>
                      ¡Hola, bienvenido!
                    </span>
                  </div>
                </Animator>
              </div>
              </Animator>
            </ScrollPage>
            <ScrollPage>
              <Animator animation={FadeInZoomIn}>
                <div className="container-wallpaper" id="page-1">
                  <div className="blur"></div>
                  <Animator animation={batch(MoveOut(0,650))}>
                    <div className="container">
                      <span style={{ fontSize: "40px" }} class="white-shine">
                      <Animator animation={batch(MoveIn(0,100))}><img src={mpr} class="mpr-img"/></Animator>
                      <Animator animation={batch(MoveIn(200,0))}><span class="neucha">Maximiliano Pantoja</span></Animator>
                        <Animator animation={batch(MoveOut(0,650))}>
                          <span class="neucha" style={{ fontSize: "25px" }}>
                            Simple programador y diseñador, convirtiendo todo lo <i class="b&w">blanco y negro</i><br/>
                            a obras <i class="color">multicolor </i> en todos los aspectos de mi vida.
                          </span>
                        </Animator>
                      </span>
                    </div>
                  </Animator>
                </div>
              </Animator>
            </ScrollPage>
            <ScrollPage>
            <Animator animation={FadeInZoomIn}>
                <div className="container-wallpaper" id="page-2">
                  <div className="blur"></div>
                  <Animator animation={batch(MoveOut(0,650))}>
                    <div className="container">
                      <span style={{ fontSize: "20px" }}>
                        <Animator animation={batch(MoveIn(200,0))}><span class="neucha">Egresado de la Escuela Nacional Preparatoria No. 3</span></Animator>
                      </span>
                      <br/>
                      <span style={{ fontSize: "25px" }}>
                        <Animator animation={batch(MoveIn(-200,0))}><span class="neucha">Egresado también de la Facultad de Ingeniería de la UNAM</span></Animator>
                        <Animator animation={batch(MoveIn(0,100))}><img src={unam} class="unam-img"/></Animator>
                        <Animator animation={batch(MoveIn(-300,0))}><span class="neucha">De la carrera de Ingeniería en Computación</span></Animator>
                      </span>
                    </div>
                  </Animator>
                </div>
              </Animator>
            </ScrollPage>
            <ScrollPage>
            <Animator animation={FadeInZoomIn}>
                <div className="container-wallpaper" id="page-3">
                  <div className="blur"></div>
                  <Animator animation={batch(MoveOut(0,650))}>
                    <div className="container">
                      <span style={{ fontSize: "25px" }}>
                        <Animator animation={batch(MoveIn(200,0))}><span class="neucha">Desarrollador Web Sr. Full-stack para la <i className="lightblue">Empresa Gtec Software</i></span></Animator>
                        <Animator animation={batch(MoveIn(0,100))}><img src={gtec} class="gtec-img"/></Animator>
                      </span>
                      <br/>
                      <span style={{ fontSize: "20px" }} class="mini-container">
                        <Animator animation={batch(MoveIn(-200,0))}><span class="neucha">Donde he formado parte de varios proyectos, entre ellos se encuentran:</span></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Sitio web sobre el cuidado de los niños </span></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Aplicación en Web View para Móviles para eventos sociales</span></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Sitio web para promover la educación</span></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Entre otros...</span></Animator>
                      </span>
                    </div>
                  </Animator>
                </div>
              </Animator>
            </ScrollPage>
            <ScrollPage>
            <Animator animation={FadeInZoomIn}>
                <div className="container-wallpaper" id="page-4">
                  <div className="blur"></div>
                  <Animator animation={batch(MoveOut(0,650))}>
                    <div className="container">
                      <span style={{ fontSize: "25px" }} class="black">
                        <Animator animation={batch(MoveIn(200,0))}><span class="neucha">Mediante <b>habilidades sociales</b> y con <b>perseverancia</b></span></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><span class="neucha">me han caracterizado las siguientes 
                        <span class="wrapper neucha" style={{ fontSize: "25px",marginLeft:"5px"}}>
                           soft skills <sup>?</sup>
                          <div class="neucha tooltip">Habilidades interpesonales no técnicas</div>
                        </span></span></Animator>
                      </span>
                      <br/>
                      <span style={{ fontSize: "25px" }} class="mini-container">
                      <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Excelente trabajador en equipo</span></Animator>
                      <Animator animation={batch(MoveIn(200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Pensamiento fuera de la caja</span></Animator>
                      <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Aprendizaje Rápido</span></Animator>
                      <Animator animation={batch(MoveIn(200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Resolutor de Problemas</span></Animator>
                      <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "15px" }} class="neucha">► Preventor de Riesgos</span></Animator>
                      </span>
                    </div>
                  </Animator>
                </div>
              </Animator>
            </ScrollPage>
            <ScrollPage>
            <Animator animation={FadeInZoomIn}>
                <div className="container-wallpaper" id="page-5">
                  <div className="blur"></div>
                  <Animator animation={batch(MoveOut(0,650))}>
                    <div className="container">
                      <span style={{ fontSize: "25px" }} class="white-shine">
                        <Animator animation={batch(MoveIn(200,0))}><span class="neucha">En cuanto a mis <b>otras habilidades...</b></span></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><span class="neucha">Me han caracterizado las siguientes: </span></Animator>
                      </span>
                      <br/>
                      <span style={{ fontSize: "20px" }} >
                        <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "20px" }} class="patrick"><div class="progress progress-100">Manejo de lenguaje Inglés - 99%</div> </span></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><span style={{ fontSize: "20px" }} class="patrick"><div class="progress progress-90">Manejo de Tecnologías Javascript (React, Angular) - 95%</div> </span></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "20px" }} class="patrick"><div class="progress progress-90">Manejo de la Herramientas de Edición 2D (Photoshop, After Effects) - 90%</div> </span></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><span style={{ fontSize: "20px" }} class="patrick"><div class="progress progress-80">Manejo de la Plataforma Unity y C# - 85%</div> </span></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "20px" }} class="patrick"><div class="progress progress-70">Manejo de la Herramientas de Modelado 3D (Blender, C4D) - 70%</div> </span></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><span style={{ fontSize: "20px" }} class="patrick"><div class="progress progress-70">Manejo de Lenguajes Orientados a Objetos (Java, C++) - 70%</div> </span></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><span style={{ fontSize: "20px" }} class="patrick"><div class="progress progress-40">Manejo de Otros Lenguajes (Python, Flutter, etc.) - 40%</div> </span></Animator>
                      </span>
                    </div>
                  </Animator>
                </div>
              </Animator>
            </ScrollPage>
            <ScrollPage>
            <Animator animation={FadeInZoomIn}>
                <div className="container-wallpaper" id="page-6">
                  <div className="blur"></div>
                  <Animator animation={batch(MoveOut(0,650))}>
                    <div className="container">
                      <span style={{ fontSize: "25px" }} class="white-shine">
                        <Animator animation={batch(MoveIn(200,0))}><span class="neucha">Algunas muestras de mi trabajo:</span></Animator>
                      </span>
                      <br/>
                      <div class="gallery">
                        <Animator animation={batch(MoveIn(-200,0))}><a href={gal1} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Modelado 3D con Blender</div><img src={gal1}/></a></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><a href={gal2} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Modelado 3D con Blender</div><img src={gal2}/></a></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><a href={gal3} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Animación 3D con Blender</div><video><source src={gal3} type="video/mp4"></source></video></a></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><a href={gal4} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Modelado 3D con Blender</div><img src={gal4}/></a></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><a href={gal5} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Modelado 3D con Blender</div><img src={gal5}/></a></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><a href={gal6} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Modelado 3D con Blender</div><img src={gal6}/></a></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><a href="https://www.youtube.com/watch?v=kt22HA10XR0" target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Videojuego para Android, Click para ver</div><img src={gal7}/></a></Animator>
                      </div>
                    </div>
                  </Animator>
                </div>
              </Animator>
            </ScrollPage>
            <ScrollPage>
            <Animator animation={FadeInZoomIn}>
                <div className="container-wallpaper" id="page-7">
                  <div className="blur"></div>
                  <Animator animation={batch(MoveOut(0,650))}>
                    <div className="container">
                      <span style={{ fontSize: "25px" }} class="black">
                        <Animator animation={batch(MoveIn(200,0))}><span class="neucha">Mis Redes sociales</span></Animator>
                      </span>
                      <br/>
                      <span style={{ fontSize: "20px" }} class="mini-container">
                      <div class="gallery networks">
                        <Animator animation={batch(MoveIn(-200,0))}><a href={"https://www.instagram.com/maxipanra/"} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Instagram</div><img src={instagram}/></a></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><a href={"https://www.youtube.com/channel/UCqYB9Ft_geSxvcxgGF0UvPA"} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Youtube</div><img src={youtube}/></a></Animator>
                        <Animator animation={batch(MoveIn(-200,0))}><a href={"https://github.com/MaxPanRa"} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">Github</div><img src={github}/></a></Animator>
                        <Animator animation={batch(MoveIn(200,0))}><a href={"https://www.linkedin.com/in/max-pan-618962249/"} target="_blank" class="gal-img wrapper"><div class="neucha tooltip">LinkedIn</div><img src={linkedin}/></a></Animator>
                      </div>
                      </span>
                      <br/>
                      <Animator animation={batch(MoveOut(0,650))}><a href="#" class="white-shine patrick" style={{ fontSize: "25px" }}>Volver Arriba</a></Animator>
                    </div>
                  </Animator>
                </div>
              </Animator>
            </ScrollPage>
          </ScrollContainer>
          <ul class="fireflies" id="firef">
                <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
            </ul>
        </div>
      </div>
      );
  }

}

export default App;