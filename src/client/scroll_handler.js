import * as FP from "fullpage.js";
import fullpage from 'fullpage.js';
import { onLeave } from './three_handler.js';

async function init_fp() {
    const fp = new fullpage("#fullpage", {
      //options here
      anchors: [
        "about",
        "project-1",
        "project-2",
        "project-3",
        "project-4",
        "project-5",
      ],
      slidesNavigation: false,
      controlArrows: false,
      fixedElements: ".webgl",
      scrollOverflow: true,
      navigation: false,
      responsive:false,
      licenseKey: "30AKK-H9O08-A2J18-L0PHH-RQRPO",
      afterLoad: function(origin, destination, direction, trigger) {
        console.log("after load", origin, destination, trigger, this);
      },
      beforeLeave(origin, destination, direction, trigger) {
        console.log("Left Page", origin.index, destination.index, trigger);
        let fp_nav = document.getElementById("fp-nav");
        let nav = document.getElementsByClassName(
          "section-navigation-wrapper"
        )[0];
        let arrowDown = document.querySelector('#arrowdown')
        if (origin.index == 0 || destination.index == 0) {
          nav.classList.toggle("visible");
          arrowDown.classList.toggle("invisible")
          //fp_nav.style.visibility = 'visible';
        }
        if (trigger == null) {
          console.log(destination, fullpage_api.getActiveSection());
          //fullpage_api.moveTo(destination.anchor,0);
        }
      },
      onLeave: function(origin, destination, direction, trigger) {
        console.log("onleave", origin, destination, direction, trigger);
        onLeave(origin, destination, direction, trigger);
      },
      onSlideLeave: function(section, origin, destination, direction, trigger) {
        console.log(origin, destination);
        let leftClick = document.getElementsByClassName("nav-left-text")[0];
        let rightClick = document.getElementsByClassName("nav-right-text")[0];
        leftClick.classList.remove("nav-text-animation");
        rightClick.classList.remove("nav-text-animation");
        leftClick.classList.remove("nav-text-load-animation");
        rightClick.classList.remove("nav-text-load-animation");

        void leftClick.offsetWidth;
        void rightClick.offsetWidth;

        leftClick.classList.add("nav-text-animation");
        rightClick.classList.add("nav-text-animation");
        
        if (destination.index == 2) {
          rightClick.innerText = "Contact Me";
          leftClick.innerText = "About Me";
        }
        if (destination.index == 3) {
          leftClick.innerText = "Home";
          rightClick.innerText = "";
        }
        if (destination.index == 1) {
          leftClick.innerText = "Education";
          rightClick.innerText = "Home";
        }
        if (destination.index == 0){
          leftClick.innerText = "";
          rightClick.innerText = "Skills";
        }
      },
      afterRender: function() {
        console.log("Rendered");
        //fullpage_api.moveTo('about',1)
      },
      scrollingSpeed: 2000,
    });
    document
      .getElementsByClassName("nav-left-text")[0]
      .addEventListener("click", () => {
        console.log("click about");
        fullpage_api.moveSlideLeft();
      });
    document
      .getElementsByClassName("nav-right-text")[0]
      .addEventListener("click", () => {
        console.log("click home");
        fullpage_api.moveSlideRight();
      });
    document
      .querySelector(".section-navigation")
      .addEventListener("click", (event) => {
        if (event.target.tagName == "A") {
          console.log(event.target.dataset);
          console.log("Moving", event.target.dataset.section);
          fullpage_api.moveTo(
            event.target.dataset.section,
            event.target.dataset.slide
          );
          //fullpage_api.moveSectionDown();
        } else {
          console.log("wrong click");
        }
        console.log(event.target.tagName, event);
      });
      document.querySelector("#arrowdown").addEventListener("click", (event) => {
        console.log("Arrow Down clicked")
        fullpage_api.moveSectionDown();
      })
      console.log("Done init fullpage.js")
  };
export { init_fp };