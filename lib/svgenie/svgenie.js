/*
 * svgenie
 * https://github.com/Causata/svgenie
 *
 * Copyright (c) 2013 Causata Ltd
 * Licensed under the MIT license.
 *
 * Improved and adapted by Romain Séguy
 * rom.seguy@gmail.com
 */

!function () {
    var svgenie = {
    };

    svgenie.save = function (id, options, callback) {
        this.toDataURL(id, options, function (data, canvas) {
            _saveToFile({
                data: data,
                canvas: canvas,
                filePath: options.filePath
            }, callback);
        });
    };

    function _saveToFile(conf, callback) {
        var base64Data = conf.data.replace(/^data:image\/png;base64,/, "");
        fs.writeFile(conf.filePath, base64Data, 'base64', function (err) {
            if (err) {
                callback(err);
            } else {
                callback();
            }
        })
    }

    svgenie.toDataURL = function (id, options, callback) {
        this.toCanvas(id, options, function (canvas) {
            callback(canvas.toDataURL("image/png"), canvas);
        });
    };

    svgenie.toCanvas = function (svg, options, callback) {
        if (typeof svg === "string") {
            if (svg.substr(0, 1) === "#") {
                svg = svg.substr(1);
            }
            svg = document.getElementById(svg);
        }

        var canvas = document.createElement("canvas");
        canvas.setAttribute("height", svg.offsetHeight);
        canvas.setAttribute("width", svg.offsetWidth);

        canvg(canvas, _serializeXmlNode(svg), {
            ignoreMouse: true,
            ignoreAnimation: true,
            renderCallback: function () {
                callback(canvas);
            }
        });
    };

    function _serializeXmlNode(xmlNode) {
        if (typeof window.XMLSerializer != "undefined") {
            return (new window.XMLSerializer()).serializeToString(xmlNode);
        } else if (typeof xmlNode.xml != "undefined") {
            return xmlNode.xml;
        }
        return "";
    }

    if (typeof define === "function" && define.amd) {
        define(svgenie);
    } else if (typeof module === "object" && module.exports) {
        module.exports = svgenie;
    } else {
        this.svgenie = svgenie;
    }
}();