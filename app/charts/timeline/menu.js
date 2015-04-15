define([
  'durandal/app',
  'helpers/objects',
  'charts/filter/form',
  'helpers/notifications', 'settings', 'state',
  'jquery-contextMenu'
], function (app, objects, FilterForm, snot, settings, state) {
  return function () {
    var vm = this;
    var container = $(vm.settings.container[0]);

    var filtersSubMenu = [];

    if (vm.cfg.filters.length === 0) {
      filtersSubMenu.push({
        name: 'Empty'
      });
    } else {
      vm.cfg.filters.forEach(function (filter) {
        filtersSubMenu.push({
          name: filter.name,
          fun: function () {
            vm.currentFilter(new FilterForm({
              chartName: vm.cfg.name,
              chartType: 'timeline',
              savedFilterName: filter.name
            }));
            vm.render({ force: true, recalc: true });
          }
        });
      });
    }

    var menu = [
      {
        name: 'Show full duration',
        title: '',
        fun: function () {
          vm.brush.extent(vm.xMini.domain());
          vm.mini.select('.brush').call(vm.brush);
          vm.render();
        }
      },
      {
        name: 'Filter',
        title: '',
        fun: function () {
          var activationData = {
            chartName: vm.cfg.name,
            chartType: 'timeline',
            doFilter: vm.filter.bind(vm)
          };

          if (!_.isNull(vm.currentFilter())) {
            activationData.currentFilter = vm.currentFilter();
          }

          app.showDialog('charts/filter/dialog', activationData, 'app', { fixedHeader: true });
        }
      },
      {
        name: 'Select Filter...',
        title: '',
        subMenu: filtersSubMenu
      },
      {
        name: 'Reset filter',
        title: '',
        fun: function () {
          vm.currentFilter(null);
          vm.preRender({ dataReloadOnly: true, force: true });
          snot.notify('Filter has been reset: all entries are now displayed', {
            timeout: 3,
            position: 'top-center'
          });
        }
      },
      {
        name: 'Export visible data',
        title: '',
        fun: function () {
          app.showDialog('dialogs/entries', {
            action: 'showVisibleData',
            dataSource: {
              data: vm.visibleData,
              multiple: true
            },
            dataSourceGroups: vm.cfg.dataSourceGroups
          }, 'app', {
            fixedHeader: true,
            keyboard: true
          });
        }
      },
      {
        name: 'Export chart screenshot',
        title: '',
        fun: function () {
          var settings = _.cloneDeep(vm.settings);
          settings.container = vm.settings.container; // cloneDeep ignore DOM elements
          settings.data = vm.data;
          settings.initialExtent = vm.newExtent();
          settings.currentFilter = vm.currentFilter();
          exportChart('screen', settings);
        }
      },
      {
        name: 'Export full chart',
        title: '',
        fun: function () {
          var settings = _.cloneDeep(vm.settings);
          settings.container = vm.settings.container; // cloneDeep ignore DOM elements
          settings.data = vm.data;
          settings.mainHeight = vm.cy - 60;
          settings.initialExtent = vm.initialExtent;
          settings.currentFilter = vm.currentFilter();
          exportChart('full', settings);
        }
      }
    ];

    container.contextMenu(menu, {
      triggerOn: 'click',
      mouseClick: 'right',
      closeOnClick: true
    });

    /**
     * @private
     * @param {String} mode
     * @param {Object} settings
     */
    function exportChart (mode, settings) {
      var chooser = document.createElement('input');
      chooser.id = 'fileDialog';
      chooser.type = 'file';
      chooser.nwsaveas = vm.exportDirectory + '/' + state.currentProject().name + '_timeline_' + vm.cfg.name + '_' + moment().format('DD-MM-YYYY @ HH\\hmm') + '.png';

      $(chooser).change(function (evt) {
        var options = {
          filePath: evt.target.value
        };

        // remember chosen dir path for later exports
        vm.exportDirectory = options.filePath.substring(0, options.filePath.lastIndexOf(path.sep) + 1);

        var ChartToPrint = new (objects.defclass(vm))(vm.cfg.name, settings);
        ChartToPrint.init(mode);
        ChartToPrint.save(options);
      });

      $(chooser).trigger('click');
    }
  };
});
