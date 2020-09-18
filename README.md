# Previous work for french corporation Total (early 2014)

Because of intellectual property law I stripped out business data from this [NW.js](http://nwjs.io) app.

Now the application is generic as possible, stripped off the corporate-specific features and data, and is used to show off my previous work.

# Linux

[Download and run Linux x64 binaries](https://github.com/romseguy/d3-timeline/raw/master/bin/d3-timeline-20150418-linux-x64.zip)

You might need to `sudo apt install libudev0` if you get this error:

```./d3-timeline: error while loading shared libraries: libudev.so.0: cannot open shared object file: No such file or directory```

[Download and run Windows x64 binaries](https://github.com/romseguy/d3-timeline/raw/master/bin/d3-timeline-20150417-windows-x64.zip)

For Mac (sorry) download and install node-webkit 0.8.6 available [here](https://github.com/nwjs/nw.js).

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
