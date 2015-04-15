define([
  'durandal/app',
  'helpers/objects',
  'helpers/notifications', 'state',
  'charts/filter/form'
], function (app, objects, snot, state, FilterForm) {
  /**
   * @property {Timeline}
   */
  var cfg = null;

  /**
   * @class FilterDialog
   */
  var FilterDialog = {
    constructor: function () {

    },

    /**
     * @param {Object} data
     * @param {String} data.chartName
     * @param {String} data.chartType
     * @param {Function} data.doFilter the chart's filter function to call after the user completes the filter
     * @param {FilterForm} [data.currentFilter]
     */
    canActivate: function (data) {
      if (!data.chartName || !_.isString(data.chartName)) {
        win.error('charts/filter/canActivate', 'chartName is missing or not a string');
        return false;
      }

      if (!data.chartType || !_.isString(data.chartType)) {
        win.error('charts/filter/canActivate', 'chartType is missing or not a string');
        return false;
      }

      if (!data.doFilter || !_.isFunction(data.doFilter)) {
        win.error('charts/filter/canActivate', 'doFilter is missing or not a function');
        return false;
      }

      // prevent accidental double click that opens duplicated dialogs
      return $('.app-modal-host').length === 0;
    },

    activate: function (data) {
      this.canPreview = true;
      this.previewText('Preview');

      cfg = state.currentProject().getChartCfg(data.chartType, data.chartName);
      this.doFilter = data.doFilter;

      if (_.isUndefined(data.currentFilter)) {
        this.filter = new FilterForm({ chartName: data.chartName, chartType: data.chartType });
      } else {
        this.filter = data.currentFilter;
      }
    },

    closeDialog: function () {
      app.closeDialog(this);
    },

    cancel: function () {
      this.doFilter();
      this.closeDialog();
    },

    previewText: ko.observable('Preview'),

    preview: function () {
      if (this.canPreview) {
        this.doFilter({ filter: this.filter, inPreview: true });
        this.previewText('Back');
      } else {
        this.previewText('Preview');
      }

      $('.app-modal-host').trigger('ui.toggleDialog');
      this.canPreview = !this.canPreview;
    },

    apply: function () {
      this.doFilter({ filter: this.filter, inPreview: false });
      this.closeDialog();
    },

    save: function () {
      var vm = this;
      $('.app-modal-host').trigger('ui.toggleDialog');

      snot.prompt('Please enter a name for the filter to save', {
        ok: 'Save',
        value: vm.filter.name()
      }).then(function (filterName) {
        if (_.isEmpty(filterName)) {
          snot.notify('Please enter a name for the filter.', { type: 'error', position: 'top-center' });
          return;
        }

        if (_.isUndefined(cfg.getFilter(filterName))) {
          proceed();
        } else {
          app.showMessage('A filter already exists with the name ' + filterName + '.', 'Do you really want to overwrite the existing filter?', ['Yes', 'No']).then(function (selectedOption) {
            if (selectedOption === 'Yes') {
              if (cfg.removeFilter(filterName)) {
                proceed();
              } else {
                snot.notify('The filter ' + filterName + ' could not be removed.', { type: 'error' });
              }
            }
          });
        }

        function proceed() {
          vm.filter.name(filterName);

          cfg.addFilter({
            name: vm.filter.name(),
            byId: vm.filter.byId(),
            byName: vm.filter.byName(),
            selectedDataSourceGroups: vm.filter.selectedDataSourceGroups().map(function (sdsg) {
              return sdsg.name;
            }),
            selectedEntries: vm.filter.selectedEntries().map(function (entry) {
              return entry.id;
            })
          });

          state.currentProject().save().then(function () {
            snot.notify('Filter ' + vm.filter.name() + ' has been saved to the chart configuration.', { timeout: 5, position: 'top-center' });
          }, function (err) {
            snot.notify('Filter ' + vm.filter.name() + ' could not be saved to the project configuration file. ' + err, { type: 'error', position: 'top-center' });
          });
        }
      }).finally(function () {
        $('.app-modal-host').trigger('ui.toggleDialog');
      });
    },

    remove: function () {
      var vm = this;
      var filterName = vm.filter.name();

      app.showMessage('Are you sure?', 'Do you really want to remove this filter?', ['Yes', 'No']).then(function (selectedOption) {
        if (selectedOption === 'Yes') {
          if (cfg.removeFilter(filterName)) {
            state.currentProject().save().then(function () {
              vm.closeDialog();
              snot.notify('Filter ' + filterName + ' has been removed from the chart configuration.', { timeout: 5, position: 'top-center' });
              vm.doFilter();
            }, function (err) {
              snot.notify('Filter ' + filterName + ' could not be removed from the project configuration file. ' + err, { type: 'error', position: 'top-center' });
            });
          } else {
            snot.notify('The filter ' +  + ' could not be removed.', { type: 'error' });
          }
        }
      });
    }
  };

  return objects.defclass(FilterDialog);
});
