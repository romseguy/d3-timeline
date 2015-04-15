define(['durandal/system', 'durandal/app', 'plugins/dialog', 'helpers/objects'], function (system, app, dialog, objects) {

  /**
   * Base context
   */
  var appBaseDialogContext = {
    keyboard: false,
    fixedHeader: false,
    blockoutOpacity: 0.3,
    removeDelay: 100,

    addHost: function (theDialog) {
      var body = $('body');
      body.addClass('modal-open');

      var blockout = $('<div class="modalBlockout"></div>')
        .css({ 'z-index': dialog.getNextZIndex(), 'opacity': this.blockoutOpacity })
        .appendTo(body);

      var html = '<div tabindex="-1" role="dialog" class="modalHost app-modal-host';
      if (this.fixedHeader) {
        html += ' fixedHeader';
      }
      html += '"></div>';

      var host = $(html)
        .css({ 'z-index': dialog.getNextZIndex() })
        .appendTo(body);

      theDialog.host = host.get(0);
      theDialog.blockout = blockout.get(0);
    },

    removeHost: function (theDialog) {
      var body = $('body');
      body.removeClass('modal-open');

      $(theDialog.host).css('opacity', 0);
      $(theDialog.blockout).css('opacity', 0);

      setTimeout(function () {
        ko.removeNode(theDialog.host);
        ko.removeNode(theDialog.blockout);
      }, this.removeDelay);
    },

    compositionComplete: function (child, parent, context) {
      var theDialog = dialog.getDialog(context.model);
      var $host = $(theDialog.host);
      var $blockout = $(theDialog.blockout);

      $host.css('opacity', 1);

      if (theDialog.context.keyboard) {
        $host.on("keyup", function (e) {
          if (e.which === 27) {
            theDialog.close();
          }
        });
      }

      $('.app-modal-host').on('ui.toggleDialog', function (e) {
        if ($host.hasClass('invisible')) {
          $host.css('overflow-y', 'auto');
        } else {
          $host.css('overflow-y', 'hidden');
        }

        // model-header will stay visible thanks to .preview
        $host.toggleClass('invisible');

        // hide the blockout so we can interact with the chart
        $blockout.toggle();
      });
    },

    binding: function (child, generator) {
      var result = generator(child.outerHTML);
      objects.clearAttributes(child);
      child.innerHTML = result;
    }
  };

  /**
   * Child contexts
   */
  var appDefaultDialogContext = {
    keyboard: appBaseDialogContext.keyboard,
    fixedHeader: appBaseDialogContext.fixedHeader,
    blockoutOpacity: appBaseDialogContext.blockoutOpacity,
    removeDelay: appBaseDialogContext.removeDelay,
    addHost: appBaseDialogContext.addHost,
    removeHost: appBaseDialogContext.removeHost,
    compositionComplete: appBaseDialogContext.compositionComplete,

    binding: function (child, parent, settings) {
      appBaseDialogContext.binding(child, function (content) {
        return content;
      });
    }
  };

  dialog.addContext('app', appDefaultDialogContext);
  dialog.addContext('defaultDialog', appDefaultDialogContext);
});