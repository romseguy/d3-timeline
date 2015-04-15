define([
  'durandal/app',
  'helpers/objects', 'helpers/datasourcegroups',
  'navigation/shell',
  'state', 'helpers/notifications', 'settings',
  'forms/timeline'
], function (app, objects, dataSourceGroupsHelper, sh, state, snot, settings, TimelineForm) {

  var formCtor = {
    'timeline': TimelineForm
  };

  ko.validation.init({
    insertMessages: false
  }, true);

  /**
   * @class ChartConfigurationVM
   */
  var ChartConfigurationVM = {
    constructor: function () {
      var vm = this;
      vm.chartType = '';

      /**
       * @property {Boolean}
       */
      vm.isLoggedIn = settings.isLoggedIn();

      /**
       * @property {Boolean}
       */
      vm.isLoading = ko.observable(false);

      /**
       * @property {Project}
       */
      vm.currentProject = state.currentProject;

      /**
       * @property {String}
       * Observes CRUD choice
       */
      vm.selectedAction = ko.observable().extend({
        required: { message: 'Select an action.' }
      });

      /**
       * @property {Function}
       * Listens to the action selection
       * and change the validation model accordingly
       */
      vm.selectedAction.subscribe(function (newAction) {
        vm.showForm(false);

        if (_.isEmpty(newAction)) {
          vm.validationModel = ko.validatedObservable({
            selectedAction: vm.selectedAction
          });
        } else if (newAction === 'load' || newAction === 'delete') {
          vm.validationModel = ko.validatedObservable({
            selectedChart: vm.selectedChart
          });
        }
      });

      /**
       * @property {TimelineForm}
       * Observes the Chart form VM
       */
      vm.chartForm = ko.observable(null);

      /**
       * Observes a set of observables for validation
       */
      vm.validationModel = ko.validatedObservable({
        selectedAction: vm.selectedAction
      });
    },

    canActivate: function () {
      return this.isLoggedIn;
    },

    activate: function (type) {
      var vm = this;
      vm.chartType = type;
      vm.parent = 'charts/' + vm.chartType;

      /**
       * @property {String}
       */
      vm.displayName = _.capitalize(type) + ' Configurations';

      /**
       * @property {Chart}
       */
      vm.selectedChart = ko.observable(vm.currentProject()[vm.chartType].length >  0 ? vm.currentProject()[vm.chartType][0] : {}).extend({
        required: { message: 'Select a Chart.' }
      });
      vm.selectedChart.subscribe(function (newValue) {
        if (_.isEmpty(newValue)) {
          vm.chartForm(null);
        }
      });

      /**
       * @property {Boolean}
       * Sometimes we just want to hide the form
       */
      vm.showForm = ko.observable(vm.currentProject()[vm.chartType].length === 0);

      if (this.currentProject()[vm.chartType].length === 0) {
        this.selectedAction('new');
        this.proceed();
      }
    },

    compositionComplete: function () {
      var pos_top = document.body.scrollTop;
      var $sticky = $('#sticky');

      window.addEventListener('scroll', function(evt) {
        pos_top = document.body.scrollTop;

        if(pos_top == 0){
          $sticky.css('position','static');
        }

        else if(pos_top > 0){
          $sticky
            .css('position','fixed')
            .css('top', 0)
            .css('z-index', 999)
            .css('background', 'white');
        }
      });
    },

    /**
     * Called when the user chooses and validates one of the three options:
     * - create a new configuration
     * - load an existing one
     * - delete an existing one
     */
    proceed: function () {
      var vm = this;
      snot.closeAll();

      if (!vm.validationModel.isValid()) {
        vm.validationModel.errors.showAllMessages();
        snot.notify(vm.validationModel.errors(), { timeout: 5, type: 'error' });
        return;
      }

      var ctor = formCtor[vm.chartType];

      switch (vm.selectedAction()) {
        case 'new':
          //win.log('charts/configuration/proceed', 'create new configuration');
          vm.chartForm(new ctor());
          break;
        case 'load':
          //win.log('charts/configuration/proceed/load', vm.selectedChart());
          vm.chartForm(new ctor(vm.selectedChart()));
          break;
        case 'delete':
          //win.log('charts/configuration/proceed/delete', vm.selectedChart());
          vm.remove(vm.selectedChart());
          return;
      }

      vm.showForm(true);
    },

    /**
     * Saves the Chart configuration to the project configuration file
     * and into the application's memory
     */
    save: function () {
      var vm = this;
      vm.isLoading(true);
      snot.closeAll();

      var chartForm = vm.chartForm();

      if (_.isNull(chartForm) || !chartForm.isValid()) {
        vm.isLoading(false);
        return;
      }

      // the loaded chart's name has been changed => remove the old configuration
      if (!_.isUndefined(chartForm.oldName) && chartForm.oldName !== chartForm.chartName()) {
        vm.remove(vm.selectedChart(), false);
      }

      var existingCfg = vm.currentProject().getChartCfg(vm.chartType, chartForm.chartName());

      if (!_.isUndefined(existingCfg)) {
        app.showMessage('Are you sure you want to overwrite the ' + existingCfg.name + ' Chart configuration?', 'Overwrite Chart ' + existingCfg.name + '?', ['Yes', 'No']).then(function (selectedOption) {
          if (selectedOption === 'Yes') {
            write();
          } else {
            vm.isLoading(false);
          }
        });
      } else {
        write();
      }

      function write() {
        var chartCfgToAdd = {
          name: chartForm.chartName(),
          dataSourceGroupNames: _.map(chartForm.selectedDataSourceGroups(), 'name'),
          orderedBy: dataSourceGroupsHelper.getVmName(chartForm.selectedDateField()),
          startDate: chartForm.startDate(),
          endDate: chartForm.endDate()
        };

        if (!_.isUndefined(chartForm.colors)) {
          chartCfgToAdd.colors = chartForm.colors().map(function (color) {
            color.start = _.isString(color.start()) ? parseInt(color.start()) : color.start();
            color.end = _.isString(color.end()) ? parseInt(color.end()) : color.end();
            color.hex = color.hex();
            return color;
          });
        }

        if (!_.isUndefined(chartForm.minimumDuration)) {
          chartCfgToAdd.minimumDuration = _.isString(chartForm.minimumDuration()) ? parseInt(chartForm.minimumDuration()) : chartForm.minimumDuration();
        }

        if (!_.isUndefined(chartForm.weeksPadding)) {
          chartCfgToAdd.weeksPadding = _.isString(chartForm.weeksPadding) ? parseInt(chartForm.weeksPadding) : chartForm.weeksPadding;
        }

        vm.currentProject().addChartCfg(vm.chartType, chartCfgToAdd);

        vm.currentProject().save()
          .then(function () {
            vm.showForm(false);
            vm.selectedChart(null);

            sh.refresh(true).then(function () {
              if (vm.selectedAction() === 'new') {
                snot.notify('The new chart configuration has been saved into the project configuration', { position: 'top-center', timeout: 5 });
              } else {
                snot.notify('The chart configuration ' + chartCfgToAdd.name + ' has been updated', { position: 'top-center', timeout: 5 });
              }
            });
          }, function (err) {
            snot.notify('The project configuration could not be saved. ' + err, { type: 'error' });
          })
          .finally(function () {
            vm.isLoading(false);
            //win.log('chart/configuration/save', 'updated chart configurations', vm.currentProject()[vm.chartType]);
          });
      }
    },

    /**
     * remove the chart configuration to from the current project
     * and update the config file on disk
     * and refresh the shell's routes
     * @param {Chart} cfg
     * @param {Boolean} [notify]
     */
    remove: function (cfg, notify) {
      var vm = this;
      notify = _.isUndefined(notify);

      if (vm.currentProject().removeChartCfg(vm.chartType, cfg.name)) {
        vm.currentProject().save().then(function () {
          sh.refresh(true).then(function () {
            if (notify) {
              snot.notify('The chart configuration has been removed', { position: 'top-center', timeout: 5 });
            }
          });
        }, function (err) {
          if (notify) {
            snot.notify('The project configuration could not be removed. ' + err, { type: 'error' });
          }
        });
      }
    },

    reset: function () {
      if (this.currentProject()[this.chartType].length === 0) {
        this.selectedAction('new');
        this.proceed();
      } else {
        this.selectedAction('');
        this.selectedChart(null);
      }
    },

    /**
     * Helper method for the router
     * @return {String}
     */
    setTitle: function () {
      return _.capitalize(this.chartType) + ' > Configuration';
    }
  };

  return objects.defclass(ChartConfigurationVM);
});