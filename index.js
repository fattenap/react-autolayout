import './styles.css';
import autolayout from './node_modules/autolayout/dist/autolayout.kiwi.js';
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
      a[k] = x[k];
    }
  });
  return a;
}

function getViewportDimensions(viewport, w, h){
  //TODO: intrinsic values
  if(viewport !== void(0)){
    if('height' in viewport){
      h = viewport.height;
    }
    if('width' in viewport){
      w = viewport.width; 
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

function updateContraints(viewConfig, currentFormat, currentStyles) {
  let layoutConstraints = {};
  let subView;
  let constrainTo = viewConfig.layouts[currentFormat].constrainTo;
  let constrainToIsFixed = viewConfig.layouts[currentFormat].constrainToIsFixed;
  let viewport = {};
  let colors = {};
  let widths = {};
  let heights = {};
  let w, h; //width, height
  
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
          top: subView.top,
          left: subView.left,
          zIndex: subView.zIndex * 5,
          // transform: `translate3d(${subView.left}px, ${subView.top}px, 0)`,
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
    if(currentStyles !== void(0) && subViewKey in currentStyles){
      layoutConstraints[viewConfig.viewName][subViewKey].style = merge(currentStyles[subViewKey], layoutConstraints[viewConfig.viewName][subViewKey].style);
    }
    if (subViewKey in colors){
      layoutConstraints[viewConfig.viewName][subViewKey].style.backgroundColor = colors[subViewKey];
    }
    if (subViewKey in widths){
      if (widths[subViewKey] === true){
        //TODO
        //intrinsic width
      } else {
        layoutConstraints[viewConfig.viewName][subViewKey].style.width = widths[subViewKey];
      }
    }
    if (subViewKey in heights){
      if (heights[subViewKey] === true){
        //TODO
        //intrinsic height
      } else {
        layoutConstraints[viewConfig.viewName][subViewKey].style.height = heights[subViewKey];
      }
    }
  };
  return layoutConstraints;
}

function updateLayout(e, viewName, applyStyle) {

  let current; 

  for (let i = 0, l = configArr.length; i < l; i++) {
    current = configArr[i].query(constraints, configArr[i].currentFormat) || {};
    if(current.format !== void(0)){    
      if (configArr[i].currentFormat !== current.format){
        configArr[i].view = new autolayout.View();
        configArr[i].view.addConstraints(configArr[i].layouts[current.format].constraints);
      }
      configArr[i].currentFormat = current.format;
    }
    constraints = merge(constraints, updateContraints(configArr[i], configArr[i].currentFormat/*current.format*/, current.styles));
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

  if ('border' in style){
    border = style.border.match(pxRegex);
    width = border[0] * 2;
    height = border[0] * 2;
  } else if ('borderTop' in style || 
    'borderBottom' in style) {
    height = 0;
    if ('borderTop' in style) {
      border = style.borderTop.match(pxRegex);
      height += border[0];
    }
    if ('borderBottom' in style) {
      border = style.borderBottom.match(pxRegex);
      height += border[0];      
    }
  } else if ('borderRight' in style || 
    'borderLeft' in style) {
    width = 0;
    if ('borderRight' in style) {
      border = style.borderRight.match(pxRegex);
      width += border[0];
    }
    if ('borderLeft' in style) {
      border = style.borderLeft.match(pxRegex);
      width += border[0];
    }
  } else if ('borderWidth' in style){
    border = style.borderWidth.match(pxRegex);
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
      border = style.borderTopWidth.match(pxRegex);
      height += border[0];
    }
    if ('borderBottomWidth' in style) {
      border = style.borderBottomWidth.match(pxRegex);
      height += border[0];      
    }
  } else if ('borderRightWidth' in style || 
    'borderLeftWidth' in style) {
    width = 0;
    if ('borderRightWidth' in style) {
      border = style.borderRightWidth.match(pxRegex);
      width += border[0];
    }
    if ('borderLeftWidth' in style) {
      border = style.borderLeftWidth.match(pxRegex);
      width += border[0];
    }
  }
  return { width, height };
}

function addVisualFormat(component, descriptor){
  let viewName = component.props.name;
  let current;

  invariant(viewName === void(0), 'name is required!');
  invariant((viewName in config), `${viewName} name must be unique.`);
  
  //capture child border widths
  borders[viewName] = {};
  let childArray = React.Children.toArray(component.props.children);
  childArray.forEach(function(child){
    borders[viewName][child.props.viewKey] = {};
    borders[viewName][child.props.viewKey].borderWidth = 0;
    borders[viewName][child.props.viewKey].borderHeight = 0;
  
    if ('style' in child.props){
      let {width, height} = captureBorderDimensions(child.props.style);
      borders[viewName][child.props.viewKey].borderWidth = width;
      borders[viewName][child.props.viewKey].borderHeight = height;
    }
  
    if ('formatStyle' in child.props){
      borders[viewName][child.props.viewKey].format = borders[viewName][child.props.viewKey].format || {};
      for (let k in child.props.formatStyle){
        if (child.props.formatStyle.hasOwnProperty(k)){
          borders[viewName][child.props.viewKey].format[k] = {};
          
          let {width, height} = captureBorderDimensions(child.props.formatStyle[k], 
            borders[viewName][child.props.viewKey].borderWidth,
            borders[viewName][child.props.viewKey].borderHeight);
          
          borders[viewName][child.props.viewKey].format[k].borderWidth = width;
          borders[viewName][child.props.viewKey].format[k].borderHeight = height;
        }
      }
    }
  });

  //then we add the default view to the view as constraints
  listeners[viewName] = function(){
    component.forceUpdate();
  };

  /*
    If descriptor.layouts is not an Array it is assumed that an object has been passed. If an object has been passed then
    'query' is optional. However 'query' can still be used to set styles without referencing a format.
  */
  let layouts = Object.prototype.toString.call(descriptor.layouts) === '[object Array]' ? descriptor.layouts : [descriptor.layouts];

  config[viewName] = {};
  config[viewName].layouts = {};
  config[viewName].query = descriptor.query || () => {}; //If no query then just get an object.
  config[viewName].viewName = viewName;

  current = config[viewName].query(constraints) || {};
  config[viewName].currentFormat = current.format || layouts[0].name; //If format undefined then 'query' sets styles only.
  config[viewName].currentStyles = current.styles;

  for (let i = 0, len = layouts.length; i < len; i++) {
    let layout = layouts[i];
    config[viewName].layouts[layout.name] = {};
    config[viewName].layouts[layout.name].htmlTag = layout.htmlTag;
    if (Object.prototype.toString.call(layout.constrainTo) === '[object Array]'){
      config[viewName].layouts[layout.name].constrainToIsFixed = true;
      config[viewName].layouts[layout.name].constrainTo = layout.constrainTo;
    } else {
      //assume it is a string
      config[viewName].layouts[layout.name].constrainToIsFixed = false;
      config[viewName].layouts[layout.name].constrainTo = layout.constrainTo.split('.');
    }
    config[viewName].layouts[layout.name].constraints = autolayout.VisualFormat.parse(layout.format, {extended: true});
    config[viewName].layouts[layout.name].metaInfo = autolayout.VisualFormat.parseMetaInfo ? autolayout.VisualFormat.parseMetaInfo(layout.format) : {};
  };

  config[viewName].view = new autolayout.View();
  config[viewName].view.addConstraints(config[viewName].layouts[config[viewName].currentFormat].constraints);
  constraints = merge(constraints, updateContraints(config[viewName], config[viewName].currentFormat, config[viewName].currentStyles));

  configArr.push(config[viewName]);

  for (let i = 0, l = configArr.length; i < l; i++) {
    constraints = merge(constraints, updateContraints(configArr[i], configArr[i].currentFormat, configArr[i].currentStyles));
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

function getContraints(viewName, view){
  let viewKey = !!viewName && !!view ? view.props.viewKey : void(0);
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

//Layout Component
export default class AutoLayout extends React.Component {
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
      let constraints = getContraints(viewName, child);
      //check to see if the element was specified in the layout.
      if (constraints === void(0)) {
        return child;
      }      
      if ('formatStyle' in child.props){
        let currentFormat = getCurrentFormat(viewName);
        if (currentFormat !== void(0) && (currentFormat in child.props.formatStyle)){
          return React.cloneElement(child, { 
            style: merge(child.props.style, child.props.formatStyle[currentFormat], constraints) 
          });
        }
      }
      return React.cloneElement(child, { style: merge(child.props.style, constraints) });
    });
    return React.createElement(htmlTag, null, newChildren);
  }
}

AutoLayout.propTypes = {
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