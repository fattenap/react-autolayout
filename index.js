import './styles.css';
import AutoLayout from './node_modules/autolayout/dist/autolayout.min.js';
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
      if (k === 'top' || 
        k === 'left' || 
        !x.hasOwnProperty(k)) {
        continue;
      }
      a[k] = x[k];
    }
  });
  return a;
}

function updateContraints(viewConfig, current) {
  let layoutConstraints = {};
  let subView;
  let width;
  let height;
  let top;
  let left;
  let constrainTo = viewConfig.layouts[current.format].constrainTo.split('.');

  if(viewConfig.layouts[current.format].constrainTo[0] == 'viewport' || !(constrainTo[0] in constraints)){
    viewConfig.view.setSize(window.innerWidth, window.innerHeight);
  } else {
    
    let constrainToViewName = constrainTo[0];
    let constrainToViewKey = constrainTo[1];
    
    //Need to determine if borders have been set on parent view and adjust obtain the innerWidth/Height
    let style = constraints[constrainToViewName][constrainToViewKey].style;
    let borderWidth = borders[constrainToViewName][constrainToViewKey].borderWidth;
    let borderHeight = borders[constrainToViewName][constrainToViewKey].borderHeight;

    if(('format' in  borders[constrainToViewName][constrainToViewKey]) &&
      current.format in borders[constrainToViewName][constrainToViewKey].format){
      
      borderWidth = borders[constrainToViewName][constrainToViewKey].format[current.format].borderWidth;
      borderHeight = borders[constrainToViewName][constrainToViewKey].format[current.format].borderHeight;      
    }
    
    viewConfig.view.setSize(style.width - borderWidth, style.height - borderHeight);
  }

  layoutConstraints[viewConfig.viewName] = {};
  layoutConstraints[viewConfig.viewName].currentFormat = current.format;
  
  for (let subViewKey in viewConfig.view.subViews) {
    let temp;
    if(viewConfig.view.subViews.hasOwnProperty(subViewKey) && subViewKey[0] !== "_"){

      subView = viewConfig.view.subViews[subViewKey];
      width = subView.width;
      height = subView.height;
      top = subView.top;
      left = subView.left;

      temp = {
        width: width, 
        height: height,
        transform: `translate3d(${left}px, ${top}px, 0)`,
        position: 'absolute',
        padding: 0,
        margin: 0
      };

      layoutConstraints[viewConfig.viewName][subViewKey] = merge({
        style: temp, 
        parentView: viewConfig.viewName,
        _top: top, 
        _left: left,
        format: current.format,
        view: subViewKey});
    }

  };
  return layoutConstraints;
}

function updateLayout(e, viewName, applyStyle) {

  let current; 

  for (let i = 0, l = configArr.length; i < l; i++) {
    current = configArr[i].query(constraints, configArr[i].currentFormat); 

    if(configArr[i].currentFormat !== current.format){
      configArr[i].view = new AutoLayout.View();
      configArr[i].view.addConstraints(configArr[i].layouts[current.format].constraints);
    }
    configArr[i].currentFormat = current.format;
    constraints = merge(constraints, updateContraints(configArr[i], current));
  };

  for(let k3 in listeners){
    if(listeners.hasOwnProperty(k3)){
      listeners[k3]();
    }
  }
}

function captureBorderDimensions(style, defaultWidth, defaultHeight){
  let border, width = defaultWidth || 0, height = defaultHeight || 0;
    
  if('border' in style){
    border = style.border.match(pxRegex);
    width = border[0] * 2;
    height = border[0] * 2;
  }
  return { width, height };
}

function addVisualFormat(component, vfDescriptor){
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
  
    if('style' in child.props){
      let {width, height} = captureBorderDimensions(child.props.style);
      borders[viewName][child.props.viewKey].borderWidth = width;
      borders[viewName][child.props.viewKey].borderHeight = height;
    }
  
    if('formatStyle' in child.props){
      borders[viewName][child.props.viewKey].format = borders[viewName][child.props.viewKey].format || {};
      for(let k in child.props.formatStyle){
        if(child.props.formatStyle.hasOwnProperty(k)){
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

  config[viewName] = {};
  config[viewName].query = vfDescriptor.query;
  config[viewName].layouts = vfDescriptor.layouts;
  config[viewName].viewName = viewName;
  config[viewName].view = new AutoLayout.View();

  current = vfDescriptor.query(constraints);
  config[viewName].currentFormat = current.format;  

  for(let k in vfDescriptor.layouts){
    if(vfDescriptor.layouts.hasOwnProperty(k)){
      config[viewName].layouts[k].constraints = AutoLayout.VisualFormat.parse(vfDescriptor.layouts[k].format, {extended: true});
    }
  }

  config[viewName].view.addConstraints(config[viewName].layouts[current.format].constraints);
  constraints = merge(constraints, updateContraints(config[viewName], current));

  configArr.push(config[viewName]);

  for (let i = 0, l = configArr.length; i < l; i++) {
    constraints = merge(constraints, updateContraints(configArr[i], {
      format: configArr[i].currentFormat
    }));
  };

  updateLayout();
  
}

function removeVisualFormat(viewName){

  if(viewName in listeners){
    delete listeners[viewName];
  }

  if(viewName in constraints){
    delete constraints[viewName];
  }

  if(viewName in config){
    config[viewName].view = null;
    delete config[viewName];
  }

  configArr = configArr.filter((config)=>{
    return config.viewName !== viewName
  });

  updateLayout();
  
}

function getContraints(viewName, view){
  let viewKey = !!viewName && !!view ? view.props.viewKey : void(0);
  if(viewKey === void(0) ||
    !(viewName in constraints) || 
    !(viewKey in constraints[viewName])){
    return void(0);
  }
  return constraints[viewName][viewKey].style;
}

function getCurrentFormat(viewName){ 
  if(viewName === void(0) || 
    viewName === null || 
    !(viewName in constraints)){
    return void(0);
  }
  return constraints[viewName].currentFormat;
}

window.addEventListener('resize', updateLayout);

export default class Layout extends React.Component {
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
    let tag = this.props.tag || 'div';
    let newChildren = React.Children.map(this.props.children, function(child) {
      let constraints = getContraints(viewName, child);
      //check to see if the element was specified in the layout.
      if(constraints === void(0)) {
        return child;
      }      
      if('formatStyle' in child.props){
        let currentFormat = getCurrentFormat(viewName);
        if(currentFormat !== void(0) && (currentFormat in child.props.formatStyle)){
          return React.cloneElement(child, { 
            style: merge(child.props.style, child.props.formatStyle[currentFormat], constraints) 
          });
        }
      }
      return React.cloneElement(child, { style: merge(child.props.style, constraints) });
    });
    return React.createElement(tag, null, newChildren);
  }
}