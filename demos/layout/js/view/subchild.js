import React from 'react';
import AutoLayout from '../../../index.js';

class SubChild extends React.Component {
  constructor(props){
    super(props);
  }

  query = (constraints, currentLayout) => {
    if('main' in constraints){
      if(constraints.main.page.width < 700){
        return 'other';
      } else {
        return 'default';
      }
    }
    return 'default';
  }

  render() {

    let layoutConfig = [
      { 
        name: 'default',
        constrainTo: `${this.props.constrainTo}`,
        format: ['|-[childA1(child3)]-[child3]-|',
              '|-[child2(child4)]-[child4]-|',
              '[child5(child4)]-|',
              'V:|-[childA1(child2)]-[child2]-|',
              'V:|-[child3(child4,child5)]-[child4]-[child5]-|']
      },
      {
        name: 'other',
        constrainTo: `${this.props.constrainTo}`,
        format: ['|-[child5(child3*2)]-[child3]-|',
              '|-[child2(child5)]-[child4(child3/2)]-|',
              '[childA1(child3)]-|',
              'V:|-[child5(child2)]-[child2]-|',
              'V:|-[child3(child4,childA1)]-[child4]-[childA1]-|']
      }
    ];

    let baseStyle = { 
          backgroundColor: '#cc6600',
          color: '#ffffff',
          border: "1px solid #DDDDDD",
          borderRadius: "8px",
          fontSize: "1em",
          textAlign: 'center'
        };
    
    return (
      <AutoLayout 
      name="subchild"
      htmlTag='span'
      query={this.query}
      layout={layoutConfig}>
        <div
          viewKey = "childA1"
          style={{
            backgroundColor: 'green',
            color: '#ffffff',
            border: "1px solid #DDDDDD",
            borderRadius: "8px",
            fontSize: "1em",
            textAlign: 'center'
          }} >
          <div>childA1</div>
        </div>
        <div 
          viewKey="child2" 
          formatStyle={{
            other: {
              backgroundColor: 'olive',
              zIndex: 10
            }
          }} 
          style={baseStyle} >
          <div>child2</div>
        </div>
        <div 
          viewKey="child3" 
          style={baseStyle}
          formatStyle={{
            default: {
              backgroundColor: 'purple',
            }
          }}>
          <div>child3</div>
        </div>
        <div 
          viewKey="child4" 
          style={baseStyle} >
          <div>child4</div>
        </div>
        <div
          viewKey="child5" 
          style={baseStyle} >
          <div>child5</div>
        </div>
      </AutoLayout>
    );
  }
}

export default SubChild;