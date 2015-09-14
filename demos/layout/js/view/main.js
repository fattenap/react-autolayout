import React from 'react';
import SubPage from './subpage';
import AutoLayout from 'react-autolayout';

class Main extends React.Component {
  constructor(props){
    super(props);
  }

  query(constraints) {
    if('main' in constraints){
      if(constraints.main.page.width < 600){
        return 'narrow';
      } else {
        return 'default';
      }
    }
    return 'default';
  }

  render(){
    return (        
        <AutoLayout 
          name="main"
          query={this.query}
          layout={[
            { 
              name: 'default',
              constrainTo: 'viewport',
              format: ['|~[page(90%)]~|',
                'V:|-20%-[page]-20%-|']
            },
            { 
              name: 'narrow',
              constrainTo: 'viewport',
              format: ['|~[page(60%)]~|',
                      'V:|-5%-[page]-5%-|']
            }
          ]}>
          <div viewKey="page" className="page" >
            <SubPage constrainTo="main.page" />
          </div>
        </AutoLayout>
    );
  }
}

export default Main;