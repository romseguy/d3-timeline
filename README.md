# What is it?

This is an adaptation of a [NW.js](http://nwjs.io) application that was originally developed for a French corporation.

# Why?

The purpose was to make the application as generic as possible, stripped off the corporate-specific features and data.

# How does it work?

*Binaries for Linux and Windows are on the way.*

Until then, download and install node-webkit 0.8.6 available [here](https://github.com/nwjs/nw.js).

Launch the application like this: ``` /path/to/nw /path/to/d3-timeline ```.

## Walkthrough

* Create an ```Administrator``` password
* Create a ```New Project```
* ```Append Data Source``` and select ```Excel```
* ```Choose File``` below ```Entries.xlsx``` and provide one of the Excel files located in ```/path/to/d3-timeline/samples```
* ```Save``` the project configuration
* ```Load``` it
* Open the ```Timeline``` dropdown men in the top navigation bar and select ```Configuration``` to create a chart
* ```Save``` the chart configuration
* Select it under the ```Timeline``` dropdown menu

## Technology stack

* [D3.js](http://d3js.org)
* [Durandal](http://durandaljs.com)
* [Bootstrap](http://getbootstrap.com)
* [NW.js](http://nwjs.io)
* and more...