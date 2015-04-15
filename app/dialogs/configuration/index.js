define([
  'durandal/app', 'navigation/shell',
  'backend/json',
  'models/form',
  'helpers/notifications', 'settings',
  'helpers/objects'
], function (app, sh, json, Form, snot, settings, objects) {
  var AdmZip = requireNode('adm-zip');

  /**
   * @class ConfigurationForm
   * @extends Form
   */
  var ConfigurationForm = {
    constructor: function () {
      var vm = this;
      Form.call(vm);

      vm.exportDirectory = osenv.home();
    },

    closeDialog: function () {
      app.closeDialog(this);
    },

    exportCfg: function () {
      var vm = this;

      var chooser = document.createElement('input');
      chooser.id = 'fileDialog';
      chooser.type = 'file';
      chooser.nwsaveas = vm.exportDirectory + '/backup_' + moment().format('DD-MM-YYYY @ HH\\hmm') + '.zip';

      $(chooser).change(function (evt) {
        var options = {
          filePath: evt.target.value
        };

        try {
          var zip = new AdmZip();
          zip.addLocalFolder(settings.configDirectoryPath);
          zip.writeZip(options.filePath);
        } catch (e) {
          snot.notify('An exception has occured: ' + e, { type: 'error' });
          return;
        }

        snot.notify('The backup archive has been saved to: ' + options.filePath, { onClick: function () {
          gui.Shell.showItemInFolder(options.filePath);
        }});
      });

      $(chooser).trigger('click');
    },

    importCfg: function () {
      var vm = this;

      var chooser = document.createElement('input');
      chooser.id = 'fileDialog';
      chooser.type = 'file';

      $(chooser).change(function (evt) {
        var options = {
          filePath: evt.target.value
        };

        app.showMessage('Are you sure you want to continue?', 'All previous configurations will be erased as the new configuration is imported', ['Yes', 'No']).then(function (selectedOption) {
          if (selectedOption === 'Yes') {
            try {
              var zip = new AdmZip(options.filePath);
              zip.extractAllTo(settings.configDirectoryPath);
              app.showMessage('The application will now restart').then(sh.reboot);
            } catch (e) {
              snot.notify('An exception has occured: ' + e, { type: 'error' });
              return;
            }

            snot.notify('The configuration has been imported and the existing configuration overwritten');
          }
        });
      });

      $(chooser).trigger('click');
    }
  };

  return objects.extend(Form, ConfigurationForm);
});