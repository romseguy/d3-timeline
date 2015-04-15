define(['durandal/app', 'jquery-toastr', 'bootstrap-bootbox'], function (app, toastr, bootbox) {

  /**
   * @param {String} message
   * @param {Object} [settings]
   * @param {Number} [settings.timeout]
   * @param {String} [settings.type]
   * @param {Boolean} [settings.newestOnTop]
   * @param {String} [settings.position]
   * @param {Function} [settings.onClick]
   */
  function notify(message, settings) {
    toastr.options = {
      'newestOnTop': settings.newestOnTop,
      'closeButton': true,
      'debug': false,
      'positionClass': 'toast-' + settings.position,
      'onclick': settings.onClick,
      'showDuration': 0,
      'hideDuration': 0,
      'timeOut': settings.timeout * 1000,
      'extendedTimeOut': 0,
      'showEasing': 'swing',
      'hideEasing': 'linear',
      'showMethod': 'fadeIn',
      'hideMethod': 'fadeOut'
    };

    var toast;

    switch (settings.type) {
      case 'success':
        toast = toastr.success;
        break;
      case 'error':
        toast = toastr.error;
        break;
      case 'info':
        toast = toastr.info;
        break;
      case 'warning':
        toast = toastr.warning;
        break;
    }

    toast(message);
  }

  return {
    /**
     * @param {Error|Error[]|String} error
     * @param {Object} [settings]
     * @param {Number} [settings.timeout]
     * @param {String} [settings.type]
     * @param {Boolean} [settings.newestOnTop]
     * @param {String} [settings.position]
     * @param {Function} [settings.onClick]
     */
    notify: function (error, settings) {
      if (_.isUndefined(settings)) {
        settings = {};
      }

      settings.timeout = settings.timeout || false;
      settings.type = settings.type || 'success';
      settings.newestOnTop = settings.newestOnTop || true;
      settings.position = settings.position || 'top-right';

      if (_.isString(error)) {
        notify(error, settings);
      } else if (_.isArray(error)) {
        error.forEach(function (e) {
          if (typeof e === 'object') {
            notify(e.message, settings)
          } else if (typeof e === 'string') {
            notify(e, settings);
          }
        });
      } else {
        notify(error.message, settings);
      }
    },

    closeAll: function () {
      toastr.clear();
    },

    /**
     * @param {String} id
     */
    focus: function (id) {
      process.nextTick(function () {
        $('input[id=' + id + ']').focus();
      });
    },

    alert: function (msg) {
      return new RSVP.Promise(function (resolve, reject) {
        bootbox.alert({
          message: msg,
          callback: function (result) {
            if (!_.isNull(result)) {
              resolve(result);
            } else {
              reject();
            }
          }
        });
      });
    },

    /**
     *
     * @param {String} msg
     * @param {Object} [settings]
     * @param {String} [settings.ok]
     * @param {String} [settings.cancel]
     * @param {String} [settings.value]
     * @returns {RSVP.Promise}
     */
    prompt: function (msg, settings) {
      settings = settings || {};
      return new RSVP.Promise(function (resolve, reject) {
        bootbox.prompt({
          title: msg,
          callback: function (result) {
            if (!_.isNull(result)) {
              resolve(result);
            } else {
              reject();
            }
          },
          value: settings.value || '',
          buttons: {
            confirm: {
              label: settings.ok || 'OK'
            },
            cancel: {
              label: settings.cancel || 'Cancel'
            }
          }
        });
      });
    },

    /**
     *
     * @param {String} msg
     * @param {Object} [settings]
     * @param {String} [settings.ok]
     * @param {String} [settings.cancel]
     * @param {String} [settings.value]
     * @returns {RSVP.Promise}
     */
    confirm: function (msg, settings) {
      settings = settings || {};
      return new RSVP.Promise(function (resolve, reject) {
        bootbox.confirm({
          message: msg,
          callback: function (result) {
            if (!_.isNull(result)) {
              resolve(result);
            } else {
              reject();
            }
          },
          buttons: {
            confirm: {
              label: settings.ok || 'Yes'
            },
            cancel: {
              label: settings.cancel || 'No'
            }
          }
        })
      });
    }
  };
});