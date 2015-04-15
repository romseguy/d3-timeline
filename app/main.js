pjson = requireNode('./package.json');
path = requireNode('path');
osenv = requireNode('osenv');
fs = requireNode('fs-extra');
RSVP = requireNode('rsvp');
_ = requireNode('lodash-node');
moment = requireNode('moment-range');
win = gui.Window.get();
uw = ko.utils.unwrapObservable;

require.config({
  urlArgs: pjson.dev_mode ? "bust=" + (new Date()).getTime() : '',
  paths: {
    'text': '../lib/require/text',
    'durandal': '../lib/durandal/js',
    'plugins': '../lib/durandal/js/plugins',
    'appPlugins': '../lib/app/plugins',
    'transitions': '../lib/durandal/js/transitions',
    'bootstrap': '../lib/bootstrap/js/bootstrap.min',
    'bootstrap-datepicker': '../lib/bootstrap/plugins/bootstrap-datetimepicker-3.1.3/js/bootstrap-datetimepicker.min',
    'bootstrap-bootbox': '../lib/bootstrap/plugins/bootstrap-bootbox-4.3.0/bootbox.min',
    'jquery': '../lib/jquery/js/jquery-2.1.1.min',
    'jquery-ui': '../lib/jquery/js/jquery-ui-1.10.4.custom.min',
    'jquery-toastr': '../lib/jquery/plugins/jquery-toastr-2.0.3/js/toastr.min',
    'jquery-contextMenu': '../lib/jquery/plugins/jquery-contextMenu/js/contextMenu',
    'd3': '../lib/d3/d3.min',
    'd3-tip': '../lib/d3/d3-tip',
    'rgbcolor': '../lib/svgenie/rgbcolor',
    'canvg': '../lib/svgenie/canvg',
    'svgenie': '../lib/svgenie/svgenie'
  },
  shim: {
    'bootstrap': ['jquery', 'jquery-ui'],
    'jquery-ui': ['jquery'],
    'jquery-toastr': ['jquery'],
    'jquery-contextMenu': ['bootstrap'],
    'bootstrap-datepicker': ['bootstrap'],
    'bootstrap-bootbox': ['bootstrap'],
    'svgenie': ['rgbcolor', 'canvg']
  }
});

define('knockout', function () {
  ko.validation.init({
    decorateInputElement: false,
    errorElementClass: 'has-error',
    messagesOnModified: true,
    insertMessages: true,
    parseInputAttributes: false,
    messageTemplate: null
  });

  return ko;
});

define('moment', function () {
  return moment;
});

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

_.mixin({ 'capitalize': capitalize });

define([
  'durandal/system',
  'boot', 'settings',
  'backend/json',
  'helpers/notifications', 'helpers/beforeExit'
], function (system, boot, settings, json, snot, beforeExit) {
  system.debug(settings.devMode);

  win.log = function () {
    if (!settings.devMode) {
      return;
    }
    var params = Array.prototype.slice.call(arguments, 1);
    params.unshift('%c[%cDEBUG%c] %c' + arguments[0], 'color: black;', 'color: green;', 'color: black;', 'color: blue;');
    console.debug.apply(console, params);
  };

  win.error = function () {
    var params = Array.prototype.slice.call(arguments, 1);
    params.unshift('%c[%cERROR%c] ' + arguments[0], 'color: black;', 'color: red;', 'color: black;');
    console.error.apply(console, params);
    snot.notify('A system error has occured - please contact the developer', { type: 'error' });
  };

  win.on('close', beforeExit);

  if (fs.existsSync(settings.appConfigurationPath)) {
    boot();
  } else {
    json.write(settings.appConfigurationPath, { 'dateFormat': 'MM/DD/YYYY' })
      .then(boot)
      .catch(function (err) {
        snot.notify('Cannot initialize application.<br>' + err, { type: 'error', position: 'top-center' });
      });
  }
});
