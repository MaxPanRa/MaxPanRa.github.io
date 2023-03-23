import React, { Component } from "react";
import logo from "./logo.svg";
import { Animator, ScrollContainer, ScrollPage, batch, Fade, FadeIn, FadeOut, Move, MoveIn, MoveOut, Sticky, StickyIn, StickyOut, Zoom, ZoomIn, ZoomOut } from "react-scroll-motion";
import "./App.css";

const ZoomInScrollOut = batch(StickyIn(), FadeIn(), ZoomIn());
const FadeUp = batch(Fade(), Move(), Sticky());

class App extends Component {
  render() { 
    return(
      <div>
        <ScrollContainer>
          <ScrollPage>
            <Animator animation={batch(Fade(), Sticky(), MoveOut(0, -200))}>
              <div class="container-wallpaper" id="page-1">
                <div class="container">
                  <span class="white-text" style={{ fontSize: "30px" }}>
                  <Animator animation={MoveIn(-1000, 0)}>¡Hola! 👋🏻</Animator>
                  <Animator animation={MoveIn(1000, 0)}>¡Hola! 👋🏻</Animator>
                  </span>
                </div>
              </div>
            </Animator>
          </ScrollPage>
          <ScrollPage>
            <Animator animation={ZoomInScrollOut}>
            <div class="container-wallpaper" id="page-1">
                <div class="container">
                  <span class="white-text" style={{ fontSize: "30px" }}>Let me show you scroll animation 😀</span>
                </div>
              </div>
            </Animator>
          </ScrollPage>
          <ScrollPage>
            <Animator animation={FadeUp}>
            <div class="container-wallpaper" id="page-1">
                <div class="container">
                  <span class="white-text" style={{ fontSize: "30px" }}>Let me show you scroll animation 😀</span>
                </div>
              </div>
            </Animator>
          </ScrollPage>
          <ScrollPage>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }} >
              <span style={{ fontSize: "40px" }}>
                <Animator animation={MoveIn(-1000, 0)}>Hello Guys 👋🏻</Animator>
                <Animator animation={MoveIn(1000, 0)}>Nice to meet you 🙋🏻‍♀️</Animator>
                - I'm Dante Chun -
                <Animator animation={MoveOut(1000, 0)}>Good bye ✋🏻</Animator>
                <Animator animation={MoveOut(-1000, 0)}>See you 💛</Animator>
              </span>
            </div>
          </ScrollPage>
          <ScrollPage>
            <Animator animation={batch(Fade(), Sticky())}>
              <span style={{ fontSize: "40px" }}>Done</span>
              <br/>
              <span style={{ fontSize: "30px" }}>
                There's FadeAnimation, MoveAnimation, StickyAnimation, ZoomAnimation
              </span>
            </Animator>
          </ScrollPage>
        </ScrollContainer>
        
      </div>
      );
  }
}

export default App;