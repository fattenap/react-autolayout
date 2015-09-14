import React from 'react';
import SubChild from './subchild';
import AutoLayout from '../../../index.js';

class SubPage extends React.Component {
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
            name:'default',
            constrainTo: `${this.props.constrainTo}`,
            format: ['|-[child1(child3)]-[child3]-|',
                  '|-[child2(child4)]-[child4]-|',
                  '[child5(child4)]-|',
                  'V:|-[child1(child2)]-[child2]-|',
                  'V:|-[child3(child4,child5)]-[child4]-[child5]-|']
          },
          { 
            name: 'other',
            constrainTo: `${this.props.constrainTo}`,
            format: ['|-[child5(child3*2)]-[child3]-|',
                  '|-[child2(child5)]->[child4(child3/2)]-|',
                  '[child1(child3)]-|',
                  'V:|-[child5(child2)]-[child2]-|',
                  'V:|-[child3(child4,child1)]-[child4]-[child1]-|']
          }
        ];

    let baseStyle = { 
          backgroundColor: '#cc6600',
          color: '#ffffff',
          border: "2px solid #DDDDDD",
          borderRadius: "8px",
          fontSize: "1em",
          textAlign: 'center'
        };
    
    return (
      <div className="subpage">
        <AutoLayout 
        name="subpage"
        htmlTag='span'
        query={this.query}
        layout={layoutConfig}>
          <div
            viewKey = "child1"
            style={{ 
              backgroundColor: 'blue',
              color: '#ffffff',
              border: "4px solid #DDDDDD",
              borderRadius: "8px",
              fontSize: "1em",
              textAlign: 'center'
            }} >
            <div>child1</div>
          </div>
          <div 
            viewKey="child2" 
            formatStyle={{
              other: {
                backgroundColor: 'navy',
                zIndex: 10
              }
            }} 
            style={{
              backgroundColor: 'green',
              color: '#ffffff',
              border: "8px solid powderblue",
              borderRadius: "18px",
              fontSize: "1em",
              textAlign: 'center',
            }} >
            <SubChild constrainTo="subpage.child2"/>
          </div>
          <div 
            viewKey="child3" 
            style={baseStyle}
            formatStyle={{
              default: {
                backgroundColor: 'purple',
              }
            }}>
            <div>Child 3</div>
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
      </div>
    );
  }
}

export default SubPage;