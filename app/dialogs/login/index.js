define([
  'durandal/app', 'navigation/shell',
  'models/form',
  'helpers/notifications', 'settings',
  'helpers/objects'
], function (app, sh, Form, snot, settings, objects) {
  var bcrypt = requireNode('bcrypt-nodejs');

  ko.validation.rules['confirmPasswordMatches'] = {
    validator: function (val, otherValue) {
      return val === ko.validation.utils.getValue(otherValue);
    },
    message: 'Passwords do not match.'
  };

  ko.validation.registerExtenders();

  /**
   * @class LoginForm
   * @extends Form
   */
  var LoginForm = {
    constructor: function () {
      var vm = this;
      Form.call(vm);

      vm.password = ko.observable().extend({
        required: true,
        minLength: 4
      });

      vm.confirmPassword = ko.observable().extend({
        required: true,
        confirmPasswordMatches: vm.password
      });

      vm.question = ko.observable().extend({
        required: true,
        minLength: 4
      });

      vm.answer = ko.observable().extend({
        required: true,
        minLength: 3
      });

      vm.formTemplate = ko.observable(!_.isEmpty(settings.appConfiguration.adminPassword) ? 'existingPasswordTemplate' : 'createPasswordTemplate');

      vm.validationModel = {
        password: vm.password
      };

      if (vm.formTemplate() === 'createPasswordTemplate') {
        vm.validationModel.confirmPassword = vm.confirmPassword;
        vm.validationModel.question = vm.question;
        vm.validationModel.answer = vm.answer;
      }
    },

    compositionComplete: function () {
      setTimeout(function () {
        $('input[id=password]').focus();
      }, 500);
    },

    closeDialog: function () {
      app.closeDialog(this);
    },

    create: function () {
      var vm = this;
      snot.closeAll();

      if (!vm.isValid(false)) {
        return;
      }

      settings.appConfiguration.adminPassword = bcrypt.hashSync(vm.password());
      settings.appConfiguration.question = vm.question();
      settings.appConfiguration.answer = bcrypt.hashSync(vm.answer());

      settings.appConfiguration.save().then(function () {
        settings.isLoggedIn(true);
        vm.loggedInConfirmation();
      }, function (err) {
        snot.notify(err, { type: 'error' });
      });
    },

    login: function () {
      var vm = this;
      snot.closeAll();

      if (!vm.isValid(false)) {
        return;
      }

      if (bcrypt.compareSync(vm.password(), settings.appConfiguration.adminPassword)) {
          settings.isLoggedIn(true);

        // did not login from the splash so we have to refresh routes for the menu
        if (!_.isNull(sh.router.activeItem())) {
          sh.refresh(true, true);
        }

        vm.loggedInConfirmation();
      } else {
        vm.password.setError('Incorrect password.');
      }
    },

    loggedInConfirmation: function () {
      snot.notify('You are logged in as the administrator', { timeout: 5, position: 'top-center' });
      this.closeDialog();
    },

    reset: function () {
      var vm = this;
      app.showDialog('dialogs/login/answercheck', {}, 'app').then(function (success) {
        if (success) {
          vm.closeDialog();
        }
      });
    }
  };

  return objects.extend(Form, LoginForm);
});