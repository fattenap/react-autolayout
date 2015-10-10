import './styles.css';
import AutoLayout from './node_modules/autolayout/dist/autolayout.kiwi.js';
import React from 'react';

let listeners = {};
let config = {};
let configArr = [];
let constraints = {};
let borders = {};
let pxRegex = /\d+\.?\d?(?=(px))?/g;

function invariant(cond, message) {
  if (cond) {
    throw new Error('Invariant Violation: ' + message);
  }
}

function  merge() {
  let a = {};
  Array.prototype.slice.call(arguments).forEach(function(x) {
    for (let k in x) {
      if (!x.hasOwnProperty(k)) {
        continue;
      }
      if(typeof x[k] === 'function'){
        a[k] = x[k].call(null, constraints);
      } else {
        a[k] = x[k];
      }
    }
  });
  return a;
}

function getViewportDimensions(viewport, w, h){
  //TODO: intrinsic values
  if(viewport !== void(0)){
    if('height' in viewport){
      if(viewport.height === true){
        invariant(viewport.height, 'intrisic not supported for viewport');
      } else {
        h = viewport.height;
      }
    }
    if('width' in viewport){
      if(viewport.width === true){
        invariant(viewport.width, 'intrisic not supported for viewport');
      } else {
        w = viewport.width;
      }
    }
    if('max-height' in viewport){
      h = h > viewport['max-height'] ? viewport['max-height'] : h;
    }
    if('min-height' in viewport){
      h = h < viewport['min-height'] ? viewport['min-height'] : h;
    }
    if('aspect-ratio' in viewport){
      w = viewport['aspect-ratio'] * h;
    }
    if('max-width' in viewport){
      w = w > viewport['max-width'] ? viewport['max-width'] : w; 
    }
    if('min-width' in viewport){
      w = w < viewport['min-width'] ? viewport['min-width'] : w; 
    }
  }
  return [w, h];
}

function updateContraints(viewConfig, currentFormat) {
  let layoutConstraints = {};
  let subView;
  let constrainTo = viewConfig.layouts[currentFormat].constrainTo;
  let constrainToIsFixed = viewConfig.layouts[currentFormat].constrainToIsFixed;
  let viewport = {};
  let colors = {};
  let shapes = {};
  let widths = {};
  let heights = {};
  let w, h; //width, height
  
  /*
   * Sets the spacing for the view.
   *
   * The spacing can be set for 7 different variables:
   * `top`, `right`, `bottom`, `left`, `width`, `height` and `zIndex`. The `left`-spacing is
   * used when a spacer is used between the parent-view and a sub-view (e.g. `|-[subView]`).
   * The same is true for the `right`, `top` and `bottom` spacers. The `width` and `height` are
   * used for spacers in between sub-views (e.g. `[view1]-[view2]`).
   *
   * Instead of using the full spacing syntax, it is also possible to use shorthand notations:
   *
   * |Syntax|Type|Description|
   * |---|---|---|
   * |`[top, right, bottom, left, width, height, zIndex]`|Array(7)|Full syntax including z-index **(clockwise order)**.|
   * |`[top, right, bottom, left, width, height]`|Array(6)|Full horizontal & vertical spacing syntax (no z-index) **(clockwise order)**.|
   * |`[horizontal, vertical, zIndex]`|Array(3)|Horizontal = left, right, width, vertical = top, bottom, height.|
   * |`[horizontal, vertical]`|Array(2)|Horizontal = left, right, width, vertical = top, bottom, height, z-index = 1.|
   * |`spacing`|Number|Horizontal & vertical spacing are all the same, z-index = 1.|
   *
   * Examples:
   * ```javascript
   * view.setSpacing(10); // horizontal & vertical spacing 10
   * view.setSpacing([10, 15, 2]); // horizontal spacing 10, vertical spacing 15, z-axis spacing 2
   * view.setSpacing([10, 20, 10, 20, 5, 5]); // top, right, bottom, left, horizontal, vertical
   * view.setSpacing([10, 20, 10, 20, 5, 5, 1]); // top, right, bottom, left, horizontal, vertical, z
   * ```
   *
   * @param {Number|Array} spacing
   */

  if ('spacing' in viewConfig.layouts[currentFormat].metaInfo) {
    viewConfig.view.setSpacing(viewConfig.layouts[currentFormat].metaInfo.spacing);
  }

  if ('viewport' in viewConfig.layouts[currentFormat].metaInfo) {
    viewport = viewConfig.layouts[currentFormat].metaInfo.viewport;
  }

  if ('colors' in viewConfig.layouts[currentFormat].metaInfo) {
    colors = viewConfig.layouts[currentFormat].metaInfo.colors;
  }

  if ('widths' in viewConfig.layouts[currentFormat].metaInfo) {
    widths = viewConfig.layouts[currentFormat].metaInfo.widths;
  }

  if ('heights' in viewConfig.layouts[currentFormat].metaInfo) {
    heights = viewConfig.layouts[currentFormat].metaInfo.heights;
  }

  if ('shapes' in viewConfig.layouts[currentFormat].metaInfo) {
    shapes = viewConfig.layouts[currentFormat].metaInfo.shapes;
  }

  if (constrainToIsFixed){
    [w, h] = getViewportDimensions(viewport, constrainTo[0], constrainTo[1]);
  } else if (viewConfig.layouts[currentFormat].constrainTo[0] == 'viewport' || !(constrainTo[0] in constraints)){
    [w, h] = getViewportDimensions(viewport, window.innerWidth, window.innerHeight);
  } else {
    
    let constrainToViewName = constrainTo[0];
    let constrainToViewKey = constrainTo[1];
    
    //Need to determine if borders have been set on parent view and adjust obtain the innerWidth/Height
    let style = constraints[constrainToViewName][constrainToViewKey].style;
    let borderWidth = borders[constrainToViewName][constrainToViewKey].borderWidth;
    let borderHeight = borders[constrainToViewName][constrainToViewKey].borderHeight;

    if (('format' in  borders[constrainToViewName][constrainToViewKey]) &&
        currentFormat in borders[constrainToViewName][constrainToViewKey].format){
      borderWidth = borders[constrainToViewName][constrainToViewKey].format[currentFormat].borderWidth;
      borderHeight = borders[constrainToViewName][constrainToViewKey].format[currentFormat].borderHeight;
    }
    
    [w, h] = getViewportDimensions(viewport, style.width - borderWidth, style.height - borderHeight);
  }

  viewConfig.view.setSize(w, h);
  layoutConstraints[viewConfig.viewName] = {};
  layoutConstraints[viewConfig.viewName].currentFormat = currentFormat;
  
  for (let subViewKey in viewConfig.view.subViews) {
    if (viewConfig.view.subViews.hasOwnProperty(subViewKey) && subViewKey[0] !== "_"){
      subView = viewConfig.view.subViews[subViewKey];
      layoutConstraints[viewConfig.viewName][subViewKey] = {
        style: {
          width: subView.width, 
          height: subView.height,
          // top: subView.top,
          // left: subView.left,
          zIndex: subView.zIndex * 5,
          transform: `translate3d(${subView.left}px, ${subView.top}px, 0)`,
          position: 'absolute',
          margin: 0,
          padding: 0
        },
        top: subView.top,
        left: subView.left,
        width: subView.width, 
        height: subView.height,
        zIndex: subView.zIndex * 5,
      };
    }

    if (subViewKey in colors){
      layoutConstraints[viewConfig.viewName][subViewKey].style.backgroundColor = colors[subViewKey];
    }
    if (subViewKey in widths){
      if (widths[subViewKey] === true){
        layoutConstraints[viewConfig.viewName][subViewKey].style.width = 'auto';
        layoutConstraints[viewConfig.viewName][subViewKey].width = 'auto';
      } else {
        layoutConstraints[viewConfig.viewName][subViewKey].style.width = widths[subViewKey];
        layoutConstraints[viewConfig.viewName][subViewKey].width = widths[subViewKey];
      }
    }
    if (subViewKey in heights){
      if (heights[subViewKey] === true){
        layoutConstraints[viewConfig.viewName][subViewKey].style.height = 'auto';
        layoutConstraints[viewConfig.viewName][subViewKey].height = 'auto';
      } else {
        layoutConstraints[viewConfig.viewName][subViewKey].style.height = heights[subViewKey];
        layoutConstraints[viewConfig.viewName][subViewKey].height = heights[subViewKey];
      }
    }
    if (subViewKey in shapes){
      if (shapes[subViewKey] === 'circle'){
        layoutConstraints[viewConfig.viewName][subViewKey].style.borderRadius = '50%';
        layoutConstraints[viewConfig.viewName][subViewKey].style.width = layoutConstraints[viewConfig.viewName][subViewKey].style.height;
        layoutConstraints[viewConfig.viewName][subViewKey].width = layoutConstraints[viewConfig.viewName][subViewKey].style.height;
      }
    }
  };
  return layoutConstraints;
}

function updateLayout(e, viewName, applyStyle) {

  let currentFormat; 

  for (let i = 0, l = configArr.length; i < l; i++) {
    currentFormat = configArr[i].query(constraints, configArr[i].currentFormat);
    if(currentFormat !== void(0)){    
      if (configArr[i].currentFormat !== currentFormat){
        configArr[i].view = new AutoLayout.View();
        configArr[i].view.addConstraints(configArr[i].layouts[currentFormat].constraints);
      }
      configArr[i].currentFormat = currentFormat;
    }
    constraints = merge(constraints, updateContraints(configArr[i], configArr[i].currentFormat));
  };

  for (let k3 in listeners){
    if (listeners.hasOwnProperty(k3)){
      listeners[k3]();
    }
  }
}

function captureBorderDimensions(style, defaultWidth, defaultHeight){
  let border, width = defaultWidth || 0, height = defaultHeight || 0;
  let len;
  let borderStyle;

  if ('border' in style){
    if(typeof style.border === 'function'){
      borderStyle = style.border.call(null, constraints);
    } else {
      borderStyle = style.border;
    }
    border = borderStyle.match(pxRegex);
    width = border[0] * 2;
    height = border[0] * 2;
  } else if ('borderTop' in style || 
    'borderBottom' in style) {
    height = 0;
    if ('borderTop' in style) {
      if(typeof style.borderTop === 'function'){
        borderStyle = style.borderTop.call(null, constraints);
      } else {
        borderStyle = style.borderTop;
      }
      border = borderStyle.match(pxRegex);
      height += border[0];
    }
    if ('borderBottom' in style) {
      if(typeof style.borderBottom === 'function'){
        borderStyle = style.borderBottom.call(null, constraints);
      } else {
        borderStyle = style.borderBottom;
      }
      border = borderStyle.match(pxRegex);
      height += border[0];      
    }
  } else if ('borderRight' in style || 
    'borderLeft' in style) {
    width = 0;
    if ('borderRight' in style) {
      if(typeof style.borderRight === 'function'){
        borderStyle = style.borderRight.call(null, constraints);
      } else {
        borderStyle = style.borderRight;
      }
      border = borderStyle.match(pxRegex);
      width += border[0];
    }
    if ('borderLeft' in style) {
      if(typeof style.borderLeft === 'function'){
        borderStyle = style.borderLeft.call(null, constraints);
      } else {
        borderStyle = style.borderLeft;
      }
      border = borderStyle.match(pxRegex);
      width += border[0];
    }
  } else if ('borderWidth' in style){
    if(typeof style.borderWidth === 'function'){
      borderStyle = style.borderWidth.call(null, constraints);
    } else {
      borderStyle = style.borderWidth;
    }
    border = borderStyle.match(pxRegex);
    len = border.length;
    if (len === 1){
      width = border[0] * 2;
      height = border[0] * 2;
    }
    if (len === 2){
      width = border[1] * 2;
      height = border[0] * 2;      
    }
    if (len === 3){
      width = border[1] * 2;
      height = border[0] * border[2];            
    }
    if (len === 4){
      width = border[1] * border[4];
      height = border[0] * border[2];      
    }
  } else if ('borderTopWidth' in style || 
    'borderBottomWidth' in style) {
    height = 0;
    if ('borderTopWidth' in style) {
      if(typeof style.borderTopWidth === 'function'){
        borderStyle = style.borderTopWidth.call(null, constraints);
      } else {
        borderStyle = style.borderTopWidth;
      }
      border = borderStyle.match(pxRegex);
      height += border[0];
    }
    if ('borderBottomWidth' in style) {
      if(typeof style.borderBottomWidth === 'function'){
        borderStyle = style.borderBottomWidth.call(null, constraints);
      } else {
        borderStyle = style.borderBottomWidth;
      }
      border = borderStyle.match(pxRegex);
      height += border[0];      
    }
  } else if ('borderRightWidth' in style || 
    'borderLeftWidth' in style) {
    width = 0;
    if ('borderRightWidth' in style) {
      if(typeof style.borderRightWidth === 'function'){
        borderStyle = style.borderRightWidth.call(null, constraints);
      } else {
        borderStyle = style.borderRightWidth;
      }
      border = borderStyle.match(pxRegex);
      width += border[0];
    }
    if ('borderLeftWidth' in style) {
      if(typeof style.borderLeftWidth === 'function'){
        borderStyle = style.borderLeftWidth.call(null, constraints);
      } else {
        borderStyle = style.borderLeftWidth;
      }
      border = borderStyle.match(pxRegex);
      width += border[0];
    }
  }
  return { width, height };
}

function addVisualFormat(component, descriptor){
  let viewName = component.props.name;
  let currentFormat;

  invariant(viewName === void(0), 'name is required!');
  invariant((viewName in config), `${viewName} name must be unique.`);
  
  //capture child border widths
  borders[viewName] = {};
  let childArray = React.Children.toArray(component.props.children);
  childArray.forEach(function(child){
    borders[viewName][child.props.name] = {};
    borders[viewName][child.props.name].borderWidth = 0;
    borders[viewName][child.props.name].borderHeight = 0;
  
    if ('style' in child.props){
      let {width, height} = captureBorderDimensions(child.props.style);
      borders[viewName][child.props.name].borderWidth = width;
      borders[viewName][child.props.name].borderHeight = height;
    }
  
    if ('layoutStyle' in child.props){
      borders[viewName][child.props.name].format = borders[viewName][child.props.name].format || {};
      for (let k in child.props.layoutStyle){
        if (child.props.layoutStyle.hasOwnProperty(k)){
          borders[viewName][child.props.name].format[k] = {};
          
          let {width, height} = captureBorderDimensions(child.props.layoutStyle[k], 
            borders[viewName][child.props.name].borderWidth,
            borders[viewName][child.props.name].borderHeight);
          
          borders[viewName][child.props.name].format[k].borderWidth = width;
          borders[viewName][child.props.name].format[k].borderHeight = height;
        }
      }
    }
  });

  //then we add the default view to the view as constraints
  listeners[viewName] = function(){
    component.forceUpdate();
  };

  /*
    If descriptor.layouts is not an Array it is assumed that an object. 'query' is optional.
  */
  let layouts = Array.isArray(descriptor.layouts) ? descriptor.layouts : [descriptor.layouts];

  config[viewName] = {};
  config[viewName].layouts = {};
  config[viewName].query = descriptor.query || () => void(0); //If no query then just return void(0).
  config[viewName].viewName = viewName;

  currentFormat = config[viewName].query(constraints);
  config[viewName].currentFormat = currentFormat || layouts[0].name;

  for (let i = 0, len = layouts.length; i < len; i++) {
    let layout = layouts[i];
    config[viewName].layouts[layout.name] = {};
    config[viewName].layouts[layout.name].htmlTag = layout.htmlTag;
    if (Array.isArray(layout.constrainTo)){
      config[viewName].layouts[layout.name].constrainToIsFixed = true;
      config[viewName].layouts[layout.name].constrainTo = layout.constrainTo;
    } else {
      //assume it is a string
      config[viewName].layouts[layout.name].constrainToIsFixed = false;
      config[viewName].layouts[layout.name].constrainTo = layout.constrainTo.split('.');
    }
    config[viewName].layouts[layout.name].constraints = AutoLayout.VisualFormat.parse(layout.format, {extended: true});
    config[viewName].layouts[layout.name].metaInfo = AutoLayout.VisualFormat.parseMetaInfo ? AutoLayout.VisualFormat.parseMetaInfo(layout.format) : {};
  };

  config[viewName].view = new AutoLayout.View();
  config[viewName].view.addConstraints(config[viewName].layouts[config[viewName].currentFormat].constraints);
  constraints = merge(constraints, updateContraints(config[viewName], config[viewName].currentFormat));

  configArr.push(config[viewName]);

  for (let i = 0, l = configArr.length; i < l; i++) {
    constraints = merge(constraints, updateContraints(configArr[i], configArr[i].currentFormat));
  };

  updateLayout();
  
}

function removeVisualFormat(viewName){

  if (viewName in listeners){
    delete listeners[viewName];
  }

  if (viewName in constraints){
    delete constraints[viewName];
  }

  if (viewName in config){
    config[viewName].view = null;
    delete config[viewName];
  }

  if (viewName in borders){
    delete borders[viewName];
  }

  configArr = configArr.filter((config)=>{
    return config.viewName !== viewName
  });

  updateLayout();
  
}

function getContraints(viewName, region){
  let viewKey = !!viewName && !!region ? region.props.name : void(0);
  if (viewKey === void(0) ||
    !(viewName in constraints) || 
    !(viewKey in constraints[viewName])){
    return void(0);
  }
  return constraints[viewName][viewKey].style;
}

function getCurrentFormat(viewName){ 
  if (viewName === void(0) || 
    viewName === null || 
    !(viewName in constraints)){
    return void(0);
  }
  return constraints[viewName].currentFormat;
}

window.addEventListener('resize', updateLayout);

let Region = (props) => {
  let htmlTag = props.htmlTag || 'div';
  return React.createElement(htmlTag, props);
}

export { Region };

//Viewport Component
export class Viewport extends React.Component {
  constructor(props){
    super(props);
  }

  componentWillMount(){
    addVisualFormat(this, {
      query: this.props.query,
      layouts: this.props.layout
    });
  }

  componentWillUnmount() {
    removeVisualFormat(this.props.name);
  }

  render(){
    let viewName = this.props.name;
    let htmlTag = this.props.htmlTag || 'div';
    let newChildren = React.Children.map(this.props.children, function(child) {
      
      if (child.type !== Region) {
        return child;
      }

      let constraints = getContraints(viewName, child);
      
      //check to see if the element was specified in the layout.
      if (constraints === void(0)) {
        return child;
      }

      if ('layoutStyle' in child.props){
        let currentFormat = getCurrentFormat(viewName);
        if (currentFormat !== void(0) && (currentFormat in child.props.layoutStyle)){
          return React.cloneElement(child, { 
            style: merge(child.props.style, child.props.layoutStyle[currentFormat], constraints) 
          });
        }
      }
      return React.cloneElement(child, { style: merge(child.props.style, constraints) });
    });
    return React.createElement(htmlTag, null, newChildren);
  }
}

Viewport.propTypes = {
  name: React.PropTypes.string.isRequired,
  query: React.PropTypes.func,
  layout: React.PropTypes.oneOfType([
    React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      constrainTo: React.PropTypes.oneOfType([
        React.PropTypes.arrayOf(React.PropTypes.number),
        React.PropTypes.string
      ]).isRequired,
      format: React.PropTypes.oneOfType([
        React.PropTypes.arrayOf(React.PropTypes.string),
        React.PropTypes.string
      ]).isRequired
    }),
    React.PropTypes.arrayOf(React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        constrainTo: React.PropTypes.oneOfType([
          React.PropTypes.arrayOf(React.PropTypes.number),
          React.PropTypes.string
        ]).isRequired,
        format: React.PropTypes.oneOfType([
          React.PropTypes.arrayOf(React.PropTypes.string),
          React.PropTypes.string
        ]).isRequired
      })
    )
  ]).isRequired,
  htmlTag: React.PropTypes.string,
  children: React.PropTypes.any.isRequired
}