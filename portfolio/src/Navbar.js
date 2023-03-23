import React, { Component } from "react";
import { Link } from 'react-scroll';

export default class Navbar extends Component {
  render() {
    return (
        <div className="navBar">
        <ul>
        <li>
        <Link 
        activeClass="active" 
        to="sectionId" 
        spy={true} 
        smooth={true} 
        duration={500}>
        section1
        </Link>
        </li>
        <li>
        <Link 
        activeClass="active" 
        to="sectionId" 
        spy={true} 
        smooth={true} 
        duration={500}>
        section2
        </Link>
        </li>
        </ul>
        </div>
    );
  }
}