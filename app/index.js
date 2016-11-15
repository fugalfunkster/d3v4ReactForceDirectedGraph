
import React from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';

let color = d3.scaleOrdinal(d3.schemeCategory20);

const Node = (props) => (
  <circle
    data-index={props.i}
    r={5}
    cx={props.x}
    cy={props.y}
    name={props.name}
    style={{
      "fill": color(props.group),
      "stroke":"#fff",
      "strokeWidth":"1.5px"
    }}
    onClick={props.onClick}
    onMouseDown={props.onDragStart}
  />
);

const Link = ({datum}) => (
  <line
    x1={datum.source.x}
    y1={datum.source.y}
    x2={datum.target.x}
    y2={datum.target.y}
    style={{
      "stroke":"#999", 
      "strokeOpacity":".6",
      "strokeWidth": Math.sqrt(datum.value)  
    }}
  />
);


const Graph = React.createClass({

  getInitialState () {
    let svgWidth = 600;
    let svgHeight = 500;
    let nodes = this.props.lesmis.nodes;
    let links = this.props.lesmis.links;
      
    let force = d3.forceSimulation()
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .nodes(nodes)
      .force("link", d3.forceLink(links));
      
      return {
        svgWidth: svgWidth,
        svgHeight: svgHeight,
        force: force,
        nodes: nodes,
        links: links,
        dragIndex: -1,
        dragStartNodeX: 0,
        dragStartNodeY: 0,
        dragStartMouseX: 0,
        dragStartMouseY: 0
      };
    },
  componentWillMount () {
    this.state.force
      .nodes(this.state.nodes)
      .force("link", d3.forceLink(this.state.links))
      .on("tick", () => this.forceUpdate());
  },
  
  drawLinks () {
    const links = this.props.lesmis.links.map(function (link, index) {
      return (<Link datum={link} key={index} />);
    });
    return (<g> {links} </g>);
  },
  drawNodes () {
    let onClick = this.onClick;
    let onDragStart = this.onDragStart;
    let nodes = this.state.nodes.map(function (node, index) {
      return (
        <Node 
          key={index}
          x={node.x}
          y={node.y}
          name={node.name}
          i={index}
          group={node.group}
          onClick={onClick}
          onDragStart={onDragStart}
        />
      );
    });
    return (<g> {nodes} </g>);
  },
  
  onClick () {
    console.log("click event heard");
  },
  onDragStart (e) {
    const nodes = [...this.state.nodes];
    const index = parseInt(e.target.attributes["data-index"].value);
    const node = nodes[index];
    node.fixed = true;
    this.setState({dragIndex: index, dragStartX: node.x, dragStartY: node.y,
                   dragStartMouseX: e.clientX, dragStartMouseY: e.clientY });
  },
  onDrag (e) {
    if (this.state.dragIndex < 0) {
      return;
    }
    const node = this.state.nodes[this.state.dragIndex];
    node.x = this.state.dragStartX + e.clientX - this.state.dragStartMouseX;
    node.y = this.state.dragStartY + e.clientY - this.state.dragStartMouseY;
    this.setState({});
    this.state.force.alphaTarget(0.5).restart();
  },
  onDragEnd (e) {
    if (this.state.dragIndex < 0) {
      return;
    }
    const node = this.state.nodes[this.state.dragIndex];
    node.fixed = false;
    this.setState({dragIndex: -1});
    this.state.force.alphaTarget(0).restart();
  },
  
  render () {
    return (
      <div>
        <div style={{"marginLeft": "20px",
                     "fontFamily": "Helvetica"}}
        >
          LesMiserables
        </div>
        <svg
          onMouseMove={this.onDrag}
          onMouseUp={this.onDragEnd}
          onMouseLeave={this.onDragEnd}
          style={{"border": "2px solid black",
                  "margin": "20px"}}
          width={this.state.svgWidth}
          height={this.state.svgHeight}
        >
          {this.drawLinks()}
          {this.drawNodes()}
        </svg>
        <div>
          Based on <a href="https://bl.ocks.org/mbostock/4062045">this</a> and <a href="https://formidable.com/blog/2015/05/21/react-d3-layouts/">this</a>.
        </div>
      </div>
    );
  }
});

const mount = document.createElement('div');
mount.id = 'app';
document.body.appendChild(mount);

d3.json("https://gist.githubusercontent.com/fredbenenson/4212290/raw/40be75727ab60227a2b41abe5a509d30de831ffd/miserables.json", function(error, lesmis) {
  ReactDOM.render(<Graph lesmis={lesmis}/>, document.getElementById("app"));   
});


/* ATTEMPTS TO SET STATE USING REACT

  ON DRAG START:
      const move = Object.assign({}, nodes[index], {fx: nodes[index].x, fy: nodes[index].y,
                                                    mx: e.clientX, my: e.clientY, dragging: true});
      const newState = Object.assign({}, this.state, {nodes: [...nodes.slice(0, index),
                                                              move,
                                                             ...nodes.slice(index +       
      this.setState(newState);
 
  ON DRAG:
      const index = parseInt(e.target.attributes["data-index"].value);
      const nodes = [...this.state.nodes];
      if(nodes[index].dragging) {
        console.log(`dragging ${e.target.attributes.name.value} from ${nodes[index].fx} `
                    + `to ${nodes[index].x + (e.clientX - nodes[index].mx)}`);
        
        const move = Object.assign({}, nodes[index], {mx: e.clientX, my: e.clientY},
                                   {fx: nodes[index].x + (e.clientX - nodes[index].mx),
                                    fy: nodes[index].y + (e.clientY - nodes[index].my)},
                                    {x: nodes[index].fx, y: nodes[index].fy});
        const newState = Object.assign({}, this.state, {nodes: [...nodes.slice(0, index),
                                                              move,
                                                              ...nodes.slice(index + 1)]});
        this.setState(newState);
        this.state.force.alphaTarget(0.3).restart();
        }

  ON DRAG END:
     const index = parseInt(e.target.attributes["data-index"].value);
     const nodes = [...this.state.nodes];
      if(nodes[index].dragging) {
        console.log("drag end");
        const move = Object.assign({}, nodes[index], {fx: null, fy: null, mx: null, my: null, dragging: false});
        const newState = Object.assign({}, this.state, {nodes: [...nodes.slice(0, index),
                                                                move,
                                                                ...nodes.slice(index + 1)]});
        this.setState(newState);
        }
 */
