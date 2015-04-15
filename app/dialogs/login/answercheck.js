define([
  'durandal/app',
  'models/form',
  'helpers/notifications', 'settings',
  'helpers/objects'
], function (app, Form, snot, settings, objects) {
  var bcrypt = requireNode('bcrypt-nodejs');

  /**
   * @class AnswerCheckForm
   * @extends Form
   */
  var AnswerCheckForm = {
    constructor: function () {
      var vm = this;
      Form.call(vm);

      vm.question = settings.appConfiguration.question;

      vm.answer = ko.observable().extend({
        required: true,
        minLength: 3
      });
    },

    compositionComplete: function () {
      setTimeout(function () {
        $('input[id=answer]').focus();
      }, 500);
    },

    closeDialog: function () {
      app.closeDialog(this);
    },

    check: function () {
      var vm = this;
      snot.closeAll();

      if (!vm.isValid(false)) {
        return;
      }

      if (!bcrypt.compareSync(vm.answer(), settings.appConfiguration.answer)) {
        vm.answer.setError('Wrong answer.');
        return;
      }

      settings.appConfiguration.resetPassword();

      settings.appConfiguration.save().then(function () {
        snot.notify('The administrator password has been reset successfully.');
        app.closeDialog(vm, true);
      }, function (err) {
        snot.notify(err, { type: 'error' });
      });
    }
  };

  return objects.extend(Form, AnswerCheckForm);
});