import React, { Component } from "react";
import logo from "./logo.svg";
import { Animator, ScrollContainer, ScrollPage, batch, Fade, FadeIn, FadeOut, Move, MoveIn, MoveOut, Sticky, StickyIn, StickyOut, Zoom, ZoomIn, ZoomOut } from "react-scroll-motion";
import "./App.css";

const ZoomInScrollOut = batch(StickyIn(), FadeIn(), ZoomIn());
const FadeInZoomIn = batch(FadeIn(),ZoomIn());
const FadeInZoomOut = batch(FadeIn(),ZoomOut());
const FadeUp = batch(Fade(), Move(), Sticky());

class App extends Component {
  render() { 
    return(
      <div class="black-bg">
        <ScrollContainer>
          <ScrollPage>
          <div className="container" id="page-0" >
                  <span style={{ fontSize: "40px" }}>
                    <Animator animation={batch(MoveOut(0,700))}>Hola 👋🏻</Animator>
                  </span>
                </div>
          </ScrollPage>
          <ScrollPage>
          <Animator animation={FadeInZoomIn}>
              <div className="container-wallpaper" id="page-1" >
                <div className="container">
                  <span style={{ fontSize: "40px" }}>
                    <Animator animation={MoveIn(100,0)}>Hola 👋🏻</Animator>
                    <Animator animation={MoveIn(200,0)}>Hola 2 👋🏻</Animator>
                  </span>
                </div>
              </div>
            </Animator>
          </ScrollPage>
          <ScrollPage>
            <Animator animation={FadeInZoomIn}>
              <div className="container-wallpaper" id="page-2" >
                <div className="container">
                  <span style={{ fontSize: "40px" }}>
                    <Animator animation={MoveIn(100,0)}>Hola 👋🏻</Animator>
                    <Animator animation={MoveIn(200,0)}>Hola 2 👋🏻</Animator>
                  </span>
                </div>
              </div>
            </Animator>
          </ScrollPage>
          <ScrollPage>
            <Animator animation={FadeInZoomIn}>
            <div className="container-wallpaper" id="page-3">
                <div className="container">
                  <span className="white-text" style={{ fontSize: "30px" }}>Let me show you scroll animation 😀</span>
                </div>
              </div>
            </Animator>
          </ScrollPage>
          <ScrollPage>
            <Animator animation={FadeInZoomIn}>
            <div className="container-wallpaper" id="page-4">
                <div className="container">
                  <span className="white-text" style={{ fontSize: "30px" }}>Let me show you scroll animation 😀</span>
                </div>
              </div>
            </Animator>
          </ScrollPage>
          
        </ScrollContainer>
        
      </div>
      );
  }
}

export default App;