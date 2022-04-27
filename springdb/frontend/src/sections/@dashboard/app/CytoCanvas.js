import cytoscape from "cytoscape";

import {Component} from "react";

// ----------------------------------------------------------------------

// https://jfly.uni-koeln.de/color/
// const pathwayColor = "rgb(204, 121, 167)"; // orange
// const targetColor = "rgb(0, 0, 0)"; // black
// const drugColor = "rgb(0, 114, 178)";  // blue
// const adverseEventColor = "rgb(213, 84, 0)"; // vermilion

// https://davidmathlogic.com/colorblind
const pathwayColor = "#D81B60";
const targetColor = "#FFC107";
const drugColor = "#1E88E5";
const adverseEventColor = "#004D40";

export default class CytoCanvas extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div
        id="cyto_canvas"
        style={this.canvasStyle}
        ref={el => (this.el = el)}
      />
    );
  }

  componentDidMount() {
    // on initial mount, create a new cytoscape canvas
    // and hook that canvas up to this element's div
    let cytoInstance = cytoscape({
      container: this.el,
      style: this.initialStyles,
      wheelSensitivity: 0.3
    });

    this.setState({
      cytoInstance: cytoInstance
    });
  }

  componentWillUnmount() {
    // when this React component is unmounted, also unmount the Cytoscape canvas
    this.state.cytoInstance.unmount();
    this.state.cytoInstance.destroy();
  }

  componentDidUpdate() {
    // replace all elements with the current graphNodes
    this.state.cytoInstance.remove("*");
    this.state.cytoInstance.add(this.props.graphNodes);

    if ("AE" in this.props.focusNode) {
      let nodeToFocus = this.state.cytoInstance.elements(
        `node#${this.props.focusNode.AE}`
      );
      let neighbouringNodes = nodeToFocus.closedNeighborhood();

      // show neighbouring elements only
      neighbouringNodes.style("display", "element");
      neighbouringNodes.layout({ name: "breadthfirst" }).run();
      // neighbouringNodes.layout({name:"circle"}).run();
      this.state.cytoInstance.fit(neighbouringNodes);
    } else {
      // no focusNode, so show all nodes
      this.state.cytoInstance
        .elements(this.props.nodeFilter)
        .style("display", "element");

      // lay out elements hierarchically

      // Increasing these will try to squish things closer together
      const screenHeightDivisor = 4;
      const screenWidthDivisor = 4;

      // Put each type of node in a grid on one layer of the viz
      this.state.cytoInstance.elements(".pathway").layout({
        name: "grid",
        boundingBox: {x1: 0, y1: 0,
          w: this.el.offsetWidth / screenWidthDivisor, h: this.el.offsetHeight / screenHeightDivisor},
        nodeDimensionsIncludeLabels: true
      }).run();

      this.state.cytoInstance.elements(".target").layout({
        name: "grid",
        boundingBox: {x1: 0, y1: this.el.offsetHeight * 1 / screenHeightDivisor,
          w: this.el.offsetWidth / screenWidthDivisor, h: this.el.offsetHeight / screenHeightDivisor},
        nodeDimensionsIncludeLabels: true
      }).run();

      this.state.cytoInstance.elements(".drug").layout({
        name: "grid",
        boundingBox: {x1: 0, y1: this.el.offsetHeight * 2 / screenHeightDivisor,
          w: this.el.offsetWidth / screenWidthDivisor, h: this.el.offsetHeight / screenHeightDivisor},
        nodeDimensionsIncludeLabels: true
      }).run();

      this.state.cytoInstance.elements(".adverse-event").layout({
        name: "grid",
        boundingBox: {x1: 0, y1: this.el.offsetHeight * 3 / screenHeightDivisor,
          w: this.el.offsetWidth / screenWidthDivisor, h: this.el.offsetHeight / screenHeightDivisor},
        nodeDimensionsIncludeLabels: true
      }).run();

      // Center each layer based on whichever is the widest
      const bbOptions = {includeLabels: false}
      const pathwayBox = this.state.cytoInstance.elements(".pathway").boundingBox(bbOptions);
      const targetBox = this.state.cytoInstance.elements(".target").boundingBox(bbOptions);
      const drugBox = this.state.cytoInstance.elements(".drug").boundingBox(bbOptions);
      const aeBox = this.state.cytoInstance.elements(".adverse-event").boundingBox(bbOptions);
      const pathwayX = pathwayBox.x1 + pathwayBox.x2;
      const targetX = targetBox.x1 + targetBox.x2;
      const drugX = drugBox.x1 + drugBox.x2;
      const aeX = aeBox.x1 + aeBox.x2;
      const maxX = Math.max(pathwayX, targetX, drugX, aeX);
      this.state.cytoInstance.nodes(".pathway").shift({x: (maxX - pathwayX) / 2, y: 0})
      this.state.cytoInstance.nodes(".target").shift({x: (maxX - targetX) / 2, y: 0})
      this.state.cytoInstance.nodes(".drug").shift({x: (maxX - drugX) / 2, y: 0})
      this.state.cytoInstance.nodes(".adverse-event").shift({x: (maxX - aeX) / 2, y: 0})

      // This doesn't move the nodes but does reset the zoom to include the full graph
      this.state.cytoInstance.layout({name: "preset"}).run();
    }
  }

  initialStyles = [
    // the stylesheet for the graph
    {
      selector: "node",
      style: {
        "label": "data(name)",
      }
    },
    {
      selector: ".pathway",
      style: {
        "background-color": pathwayColor,
        "shape": "triangle"
      }
    },
    {
      selector: ".target",
      style: {
        "background-color": targetColor,
      }
    },
    {
      selector: ".drug",
      style: {
        "background-color": drugColor,
        "shape": "rectangle"
      }
    },
    {
      selector: ".adverse-event",
      style: {
        "background-color": adverseEventColor,
        "shape": "diamond"
      }
    },
    {
      selector: "edge",
      style: {
        width: 3,
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      }
    },
    {
      selector: "edge[action = 'ASSOCIATED WITH']",
      style: {
        "label": "data(llr)",
        "line-color": adverseEventColor,
        "target-arrow-color": adverseEventColor
      }
    },
    {
      selector: "edge[action = 'TARGETS']",
      style: {
        "label": "data(actionType)",
        "line-color": drugColor,
        "target-arrow-color": drugColor
      }
    },
    {
      selector: "edge[action = 'PARTICIPATES_IN']",
      style: {
        "line-color": pathwayColor,
        "target-arrow-color": pathwayColor
      }
    },
    {
      selector: "*",
      style: {
        "display": "none",
        "text-outline-color": "white",
        "text-outline-width": "2px",
        "text-valign": "bottom",
        "text-halign": "center",
        "color": "black",
        "min-zoomed-font-size": "10",
      }
    }
  ];

  canvasStyle = {
    width: "100%",
    minHeight: "300px"
  };
}
