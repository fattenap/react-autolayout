React-Autolayout
=====

Auto layout for React using Apple's Visual Format Language. React-Autolayout is a wrapper around the [AutoLayout.js](http://ijzerenhein.github.io/autolayout.js/) library.

NPM:
`npm install react-autolayout`

Bower:
`bower install react-autolayout`

Script Tag:
`<script src="path/to/react-autolayout/build/react-autolayout.js"></script>`
(Module exposed as `ReactAutoLayout`)

## API

### Sample Usage

```js
class Demo extends React.Component {

  query(constraints) {
    if('demo' in constraints){
      if(constraints.demo.page.width < 600){
        return 'narrow';
      } else {
        return 'default';
      }
    }
    return 'default';
  }

  render() {
    return (
      <AutoLayout name="demo" query={this.query}
        layout={[
          { 
            name: 'default',
            constrainTo: 'viewport',
            format: ['|~[page(90%)]~|',
                    'V:|-15%-[page]-150-|']
          },
          { 
            name: 'narrow',
            constrainTo: 'viewport',
            format: ['|~[page(60%)]~|',
                    'V:|-15%-[page]-150-|']
          }
        ]}>
        <div viewKey="page" >
          ...
        </div>
      </AutoLayout>
    );
  }
}
```

### &lt;AutoLayout /> props

#### `name: string`
The `name` prop defines a region that will have auto layout applied and is used to identify the region. It is  **required and must be unique**.

#### `layout: array[object]`
`layout` holds an array of layout configuration objects. The different configurations get applied in response to `query` changes (see next). Each configuration object **must** have the following 3 properties:

- `name: string` is used to identify the configuration.
- `constrainTo: string | array` specifies which view the layout region should be contrained to. There are three possible values:
    - `'viewport'` contrain to the window
    - `'${name}.${viewKey}'` constrain to another view
    - `[width, height]` constrain to a fixed width and height in `px`. Width and height are specified as a **number** without the `px` suffix
- `format: array[string]` takes an array of string specified by the Visual Format Language. Please refer to [AutoLayout.js](http://ijzerenhein.github.io/autolayout.js/) documentation for usage.

#### `query: function -> string`

```js
query(constraints, currentFormat){
    if('demo' in constraints){
      if(constraints.demo.page.width < 600){
        return 'narrow';
      } else {
        return 'default';
      }
    }
    return 'default';
}
```

The `query` prop takes a function that returns a string representing the name of the layout to be applied. It can be thought of as a custom media query in which you specify the break points based on the criteria you determine.

The query function will receive two parameters.

The first is `constraints`. `constraints` holds the current state of all autolayout objects. You are able to reference view styles to determine breack points. The shape of `constraints` is ${name}.${viewKey}.width|height

The second is `currentFormat`. This is a string that stores the current format applied to the region.

#### `htmlTag: string`

This is an optional prop that allows you to specify the type of html element to use for the region.


### child element props

```js
<AutoLayout>
    <div viewKey="child1" >
      ...
    </div>
    <div viewKey="child2" >
      ...
    </div>
    <div viewKey="child3" >
      ...
    </div>
</AutoLayout>
```
Child elements define the view to be laid out. You can have as many child views as required. Child elements cannot be React Components and must be the first level element within AutoLayout. A view has the following props:

- `viewKey: string` The `viewKey` is used within the Visual Format to identify the view. `viewKey`'s must be unique within a Component and is a required prop.
- `formatStyle: object` is an optional prop that specifies styles to be applied to certain layouts. You do not need to specify every layout, only the ones that you would like a style aplied to. The format style is then merge with any existing styles set on the view. 

An example of a `formatStyle` prop within a view is:

```js
<div 
    viewKey="child2" 
    formatStyle={{
        narrow: {
            backgroundColor: 'black',
            zIndex: 10
        }
    }}>
    <div>child2 Text</div>
</div>
```

## Caveats

- Setting the following styles on child elements have no effect as they are overridden. Default values are displayed.
    + top: dynamically set
    + left: dynamically set
    + width: dynamically set
    + height: dynamically set
    + margin: 0
    + padding: 0
    + position: absolute
    + transform: dynamically set
- box-sizing: border-box; is the default
- Visual Format `Z` property is not available

## ToDo

- More Example Code
- Tests

## Author
Frank Panetta  - [Follow @fattenap](https://twitter.com/intent/follow?screen_name=fattenap)

## License
### The MIT License (MIT)

Copyright (c) 2015 Frank Panetta

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.