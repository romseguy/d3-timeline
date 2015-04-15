define(['helpers/objects', 'state'], function (objects, state) {
  /**
   * @property {Timeline}
   */
  var cfg = null;

  /**
   * @private
   * @property {Entry[]}
   * Common output for all our filters
   */
  var filteredEntries = ko.observableArray();

  /**
   * @class DataSourceGroupVM
   * @private
   * @param dataSourceGroup
   */
  function DataSourceGroupVM(dataSourceGroup) {
    this.name = dataSourceGroup.name;
  }

  /**
   * @private
   * @param {String} pattern
   * @returns {String}
   */
  function process(pattern) {
    // escape unwanted reserved symbols
    pattern = pattern.replace(/([.+?{}()|\[\]\/\\])/g, "\\$1");

    // replace * with .
    pattern = pattern.replace(/\*/g, '.');

    //win.log('charts/filter/form/process/pattern', pattern);
    return pattern;
  }

  /**
   * @class FilterForm
   * @param {Object} settings
   * @param {String} settings.chartName
   * @param {String} settings.chartType
   * @param {String} [settings.savedFilterName]
   */
  var FilterForm = {
    constructor: function (settings) {
      var vm = this;
      cfg = state.currentProject().getChartCfg(settings.chartType, settings.chartName);
      filteredEntries(cfg.data);

      /**
       * @property {String}
       */
      this.name = ko.observable('');

      /**
       * @property {Entry[]}
       * List the entries the user can select
       */
      this.entries = ko.computed(function () {
        return filteredEntries();
      });

      /**
       * @property {Entry[]}
       * User selected entries
       */
      this.selectedEntries = ko.observableArray(cfg.data);

      /**
       * @event
       * Every time we get a new filter result we select the corresponding entries
       */
      filteredEntries.subscribe(function (data) {
        vm.selectedEntries(data);
      });

      // DATA SOURCE GROUPS FILTER //

      /**
       * @property {DataSourceGroupVM[]}
       * List the data source groups the user can select
       */
      this.dataSourceGroups = cfg.dataSourceGroups.map(function (dataSourceGroup) {
        return new DataSourceGroupVM(dataSourceGroup);
      });

      /**
       * @property {DataSourceGroupVM[]}
       * User selected data source groups VMs
       */
      this.selectedDataSourceGroups = ko.observableArray();

      this.selectedDataSourceGroups.subscribe(function (sdsgs) {
        vm.filterEntries();
      });

      // ENTRIES FILTERS //

      /**
       * Filter by entry id
       */
      this.byId = ko.observable();

      /**
       * @property {Number}
       */
      this.entryIdLength = _.max(cfg.data.map(function (entry) {
        return entry.id.length;
      }));

      /**
       * @property {Array}
       */
      this.entryIdChars = ko.observableArray(_.range(this.entryIdLength).map(function () {
        return ko.observable('*');
      }));

      /**
       * Filter by description
       */
      this.byName = ko.observable();
      this.byName.subscribe(vm.filterEntries.bind(this));

      this.byName.starts = ko.observable(false);
      this.byName.starts.subscribe(vm.filterEntries.bind(this));

      this.byName.ends = ko.observable(false);
      this.byName.ends.subscribe(vm.filterEntries.bind(this));

      this.byName.caseSensitive = ko.observable(false);
      this.byName.caseSensitive.subscribe(vm.filterEntries.bind(this));

      /**
       * Load filter data from saved previously saved filter
       */
      if (!_.isEmpty(settings.savedFilterName)) {
        this.name(settings.savedFilterName);

        var savedFilter = _.find(cfg.filters, { name: settings.savedFilterName });

        if (!_.isUndefined(savedFilter)) {
          this.selectedDataSourceGroups(_.filter(this.dataSourceGroups, function (dsg) {
            return _.contains(savedFilter.selectedDataSourceGroups, dsg.name);
          }));

          this.updateByIdFilter({ pattern: savedFilter.byId });
          this.byName(savedFilter.byName);

          this.selectedEntries(_.filter(this.entries(), function (entry) {
            return _.contains(savedFilter.selectedEntries, entry.id);
          }))
        }
      }

      this.selectAllDataSourceGroups = function () {
        this.selectedDataSourceGroups(this.dataSourceGroups);
      }.bind(vm);

      this.selectAllEntries = function () {
        this.selectedEntries(this.entries());
      }.bind(vm);
    },

    compositionComplete: function () {
      $("[data-toggle='tooltip']").tooltip();
    },

    filterEntries: function () {
      var vm = this;
      var pattern = vm.byName();

      if (!_.isEmpty(vm.byName())) {
        if (vm.byName.starts() || vm.byName.ends()) {
          if (vm.byName.starts()) {
            pattern = '^' + pattern;
          }

          if (vm.byName.ends()) {
            pattern += '$';
          }
        }

        vm.byName.regex = new RegExp(process(pattern), !vm.byName.caseSensitive() ? 'i' : '');
      }

      filteredEntries(_.filter(cfg.data, function (entry) {
        if (!_.isEmpty(vm.selectedDataSourceGroups())) {
          if (!_.contains(vm.selectedDataSourceGroups().map(function (sdsg) {
              return sdsg.name;
            }), entry.dataSourceGroup.name)) {
            return false;
          }
        }

        if (!_.isEmpty(vm.byId())) {
          if (!vm.byId.regex.test(entry.id)) {
            return false;
          }
        }

        if (!_.isEmpty(vm.byName())) {
          if (!vm.byName.regex.test(entry.name)) {
            return false;
          }
        }

        return true;
      }));
    },

    /**
     * Called every time a character is changed from the entry number filter
     * @param {Object} data
     * @param {String} [data.value]
     * @param {Number} [data.index]
     * @param {String} [data.pattern]
     */
    updateByIdFilter: function (data) {
      if (_.isUndefined(data.pattern)) {
        if (_.isEmpty(data.value) && data.index > 0) {
          if (!_.isEmpty(this.entryIdChars()[data.index - 1]())) {
            data.value = '*';
          }
        }

        var obs = this.entryIdChars()[data.index];
        obs(data.value);
        obs.valueHasMutated();
        data.pattern = this.entryIdChars().map(function (entryIdChar) {
          return entryIdChar();
        }).join('');
      } else {
        this.entryIdChars(data.pattern.split('').map(function (char) {
          return ko.observable(char);
        }));
      }

      this.byId(data.pattern);
      this.byId.regex = new RegExp(process(data.pattern));
      this.filterEntries();
    },

    sortById: function (a, b) {
      return a.id == b.id ? 0 : (a.id < b.id ? -1 : 1);
    }
  };

  return objects.defclass(FilterForm);
});