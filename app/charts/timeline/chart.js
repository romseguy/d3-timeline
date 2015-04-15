define([
  'durandal/app',
  'd3', 'svgenie',
  'charts/timeline/menu', 'charts/timeline/tooltip',
  'helpers/objects', 'helpers/strings',
  'helpers/notifications', 'settings', 'state'
], function (app, d3, svgenie, TimelineMenu, TimelineTooltip, objects, strings, snot, settings, state) {

  /**
   * @class TimelineChart
   */
  var TimelineChart = {
    /**
     * @param {String} chartName
     * @param {Object} options
     * @param {DOMElement} options.container
     * @param {Number} options.miniHeight
     * @param {Object} options.margin
     * @param {Number} options.margin.top
     * @param {Number} options.margin.right
     * @param {Number} options.margin.left
     * @param {Number} options.margin.bottom
     * @param {Entry[]} [options.data]
     * @param {Number} [options.mainHeight]
     * @param {Date[]} [options.initialExtent]
     * @param {FilterForm} [options.currentFilter]
     */
    constructor: function (chartName, options) {
      this.cfg = state.currentProject().getChartCfg('timeline', chartName);

      this.settings = options;
      this.settings.margin.left += this.yAxisWidth = 30;
      this.exportDirectory = osenv.home();

      this.previousExtent = null;
      this.newExtent = ko.observableArray();

      this.data = options.data || [];
      this.mainHeight = options.mainHeight || win.height;
      this.initialExtent = options.initialExtent || [];

      /**
       * @property {FilterForm}
       */
      this.currentFilter = ko.observable(options.currentFilter || null);
    },

    /**
     * Computes the dimensions of the chart on initialization, resize and full screen
     */
    refreshChartSize: function () {
      var vm = this;

      vm.cx = $(window).width() - 10;
      vm.cy = $(window).height() - 80;

      if (settings.fullscreen()) {
        vm.cy += 50;
      }

      vm.width = vm.cx - vm.settings.margin.left - vm.settings.margin.right;
      vm.height = vm.cy - vm.settings.margin.top - vm.settings.margin.bottom;
      vm.mainHeight = vm.height - vm.settings.miniHeight - 60;
    },

    /**
     * Process the data
     * @param {Entry[]} data
     * @returns {Entry[]}
     */
    loadData: function (data) {
      return data.sort(function (a, b) {
        return d3.ascending(a.date.raw, b.date.raw);
      });
    },

    /**
     * Create and initialize the basic components of the chart depending on the rendering mode
     * @param {String} [mode={default, screen, full}]
     */
    init: function (mode) {
      var vm = this;
      mode = mode || 'default';

      if (_.isEmpty(vm.data) && _.isEmpty(vm.cfg.data)) {
        snot.notify('Cannot initialize Timeline: no data supplied', { type: 'error' });
        return;
      }

      var sdsgs = '', byId = '', byName = '';

      // stringify current filter settings so we can render them on the charts
      if (_.isNull(vm.currentFilter())) {
        sdsgs = vm.cfg.dataSourceGroupNames.join(', ');
      } else {
        sdsgs = vm.currentFilter().selectedDataSourceGroups();
        byId = vm.currentFilter().byId();
        byName = vm.currentFilter().byName();

        if (_.isEmpty(sdsgs)) {
          sdsgs = vm.cfg.dataSourceGroupNames;
        } else {
          sdsgs = sdsgs.map(function (sdsg) {
            return sdsg.name;
          }).join(', ');
        }
      }

      var initMode = {
        'default': function () {
          vm.refreshChartSize();

          /**
           * @event
           */
          $(window).on('resize.render', function () {
            vm.render({ recalc: true });
          });

          /**
           * @event
           */
          vm.fullscreenSubscription = settings.fullscreen.subscribe(function () {
            vm.render({ recalc: true });
          });

          // main scales
          vm.xMain = d3.time.scale().range([0, vm.width]);
          vm.yMain = d3.scale.linear().range([vm.mainHeight, 0]);

          // main axis
          vm.xAxisMain = d3.svg.axis().scale(vm.xMain).orient('bottom');
          vm.x1AxisMain = d3.svg.axis().scale(vm.xMain).orient('top');
          vm.yAxisMain = d3.svg.axis().scale(vm.yMain).orient('left');

          // mini scales
          vm.xMini = d3.time.scale().range([0, vm.width]);

          // mini axis
          vm.xAxisMini = d3.svg.axis().scale(vm.xMini).orient('bottom').ticks(d3.time.months).tickFormat(d3.time.format('%b')).tickSize(3, 0, 0);
          vm.x1AxisMini = d3.svg.axis().scale(vm.xMini).orient('top').ticks(d3.time.years).tickFormat(d3.time.format('%Y')).tickSize(0);

          // append containers
          vm.svg = vm.settings.container.append('svg')
            .attr('id', 'timelineChart')
            .attr('width', vm.cx)
            .attr('height', vm.cy)
            .style('shape-rendering', 'crispEdges');

          vm.defs = vm.svg.append('defs');

          vm.clipPath = vm.defs.append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', vm.width + 1)
            .attr('height', vm.mainHeight);

          for (var i = 0; i < vm.cfg.colors.length; i++) {
            var color = vm.cfg.colors[i];
            var pattern = vm.defs.append('pattern')
              .attr('id', 'partialPattern' + color.hex)
              .attr('patternUnits', 'userSpaceOnUse')
              .attr('width', 8)
              .attr('height', 8);
            pattern.append('rect')
              .attr('width', 8)
              .attr('height', 8)
              .style('fill', color.hex);
            pattern.append('path')
              .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
              .attr('stroke', strings.getIdealTextColor(color.hex) === '#000000' ? '#FFFFFF' : '#000000')
              .attr('stroke-width', 2);
          }

          vm.main = vm.svg.append('g')
            .attr('id', 'main')
            .attr('transform', 'translate(' + vm.settings.margin.left + ',' + (vm.settings.margin.top + vm.settings.miniHeight + 10) + ')');

          vm.entries = vm.main.append('g')
            .attr('clip-path', 'url(#clip)')
            .attr('class', 'items');

          vm.mini = vm.svg.append('g')
            .attr('id', 'mini')
            .attr('transform', 'translate(' + vm.settings.margin.left + ',' + vm.settings.margin.top + ')');

          // append main axis
          vm.xAxisContainerMain = vm.main.append('g')
            .attr('class', 'main x axis')
            .attr('transform', 'translate(0,' + vm.mainHeight + ')');

          vm.x1AxisContainerMain = vm.main.append('g')
            .attr('class', 'main x1 axis')
            .attr('transform', 'translate(0,' + (vm.mainHeight + 40) + ')');

          vm.yAxisContainerMain = vm.main.append('g')
            .attr('class', 'main y axis');

          // append mini axis
          vm.xAxisContainerMini = vm.mini.append('g')
            .attr('class', 'mini x axis')
            .attr('transform', 'translate(0, 0)');

          vm.x1AxisContainerMini = vm.mini.append('g')
            .attr('class', 'mini x1 axis')
            .attr('transform', 'translate(0, ' + (vm.settings.miniHeight - 1) + ')');

          vm.initMenu();
          vm.initTooltip();

          vm.preRender();
        },
        'full': function () {
          vm.visibleData = _.filter(vm.data, function (entry) {
            return vm.canDisplay(entry, vm.initialExtent[0], vm.initialExtent[1]);
          });

          if (_.isEmpty(vm.visibleData)) {
            win.error('Failed to export chart with empty data', vm.initialExtent);
            return;
          }

          // compute chart width taking into account the minimal required rectWidth to read entries numbers
          vm.rectWidth = 8 * _.max(_.map(vm.visibleData, function (entry) {
            return entry.id.length;
          }));
          vm.width = vm.rectWidth * moment.duration(vm.initialExtent[1] - vm.initialExtent[0]).as('weeks');
          var svgWidth = vm.width < 1024 ? 1024 : vm.width + 80; // TODO make this user configurable

          // same for chart height
          vm.maxEntryCountByWeek = _.max(_.values(_.countBy(_.map(vm.visibleData, function (entry) {
            var m = moment(entry.date.raw);
            return m.year() + '.' + m.isoWeek();
          }))));
          vm.maxEntryCountByWeek = vm.maxEntryCountByWeek < 15 ? 15 : vm.maxEntryCountByWeek;
          vm.rectHeight = 11;
          vm.mainHeight = vm.rectHeight * vm.maxEntryCountByWeek;
          var svgHeight = vm.mainHeight + 200;

          // main scales
          vm.xMain = d3.time.scale().range([0, vm.width]);
          vm.yMain = d3.scale.linear().range([vm.mainHeight, 0]);

          // main axis
          vm.xAxisMain = d3.svg.axis().scale(vm.xMain).orient('bottom');
          vm.x1AxisMain = d3.svg.axis().scale(vm.xMain).orient('top');
          vm.yAxisMain = d3.svg.axis().scale(vm.yMain).orient('left');

          // append containers
          vm.svg = vm.settings.container.append('svg')
            .attr('id', 'timelineChartToPrint')
            .attr('width', svgWidth)
            .attr('height', svgHeight);

          // main area
          vm.clipPath = vm.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', vm.width + 1)
            .attr('height', vm.mainHeight);

          vm.main = vm.svg.append('g')
            .attr('transform', 'translate(' + vm.settings.margin.left + ', 150)');

          vm.entries = vm.main.append('g')
            .attr('clip-path', 'url(#clip)')
            .attr('class', 'items');

          // append main axis
          vm.xAxisContainerMain = vm.main.append('g')
            .attr('class', 'main x axis')
            .attr('transform', 'translate(0,' + vm.mainHeight + ')');

          vm.x1AxisContainerMain = vm.main.append('g')
            .attr('class', 'main x1 axis')
            .attr('transform', 'translate(0,' + (vm.mainHeight + 40) + ')');

          vm.yAxisContainerMain = vm.main.append('g')
            .attr('class', 'main y axis');

          // header
          var header = vm.svg.append('g')
            .attr('transform', 'translate(' + vm.settings.margin.left + ',' + vm.settings.margin.top + ')');
          renderHeader(header, svgWidth);

          vm.render({ mode: 'full' });
        },
        'screen': function () {
          vm.refreshChartSize();

          // main scales
          vm.xMain = d3.time.scale().range([0, vm.width]);
          vm.yMain = d3.scale.linear().range([vm.mainHeight, 0]);

          // main axis
          vm.xAxisMain = d3.svg.axis().scale(vm.xMain).orient('bottom');
          vm.x1AxisMain = d3.svg.axis().scale(vm.xMain).orient('top');
          vm.yAxisMain = d3.svg.axis().scale(vm.yMain).orient('left');

          // append containers
          vm.svg = vm.settings.container.append('svg')
            .attr('id', 'timelineChartToPrint')
            .attr('width', vm.cx)
            .attr('height', vm.cy + 150)
            .style('shape-rendering', 'crispEdges');

          // main area
          vm.clipPath = vm.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', vm.width + 1)
            .attr('height', vm.mainHeight);

          vm.main = vm.svg.append('g')
            .attr('transform', 'translate(' + vm.settings.margin.left + ', 150)');

          vm.entries = vm.main.append('g')
            .attr('clip-path', 'url(#clip)')
            .attr('class', 'items');

          // append main axis
          vm.xAxisContainerMain = vm.main.append('g')
            .attr('class', 'main x axis')
            .attr('transform', 'translate(0,' + vm.mainHeight + ')');

          vm.x1AxisContainerMain = vm.main.append('g')
            .attr('class', 'main x1 axis')
            .attr('transform', 'translate(0,' + (vm.mainHeight + 40) + ')');

          vm.yAxisContainerMain = vm.main.append('g')
            .attr('class', 'main y axis');

          // header
          var header = vm.svg.append('g')
            .attr('transform', 'translate(' + vm.settings.margin.left + ',' + vm.settings.margin.top + ')');
          renderHeader(header, vm.width);

          vm.render({ mode: 'screen' });
        }
      };

      initMode[mode]();

      /**
       * Draws a header for the exported to file charts
       * @param header
       * @param svgWidth
       */
      function renderHeader (header, svgWidth) {
        var currentY = 25;

        var title = header.append('text')
          .attr('class', 'title')
          .text('Timeline ' + vm.cfg.name + ' for project ' + state.currentProject().name)
          .attr('y', currentY)
          .style('font-size', '25');

        // center title
        var titleWidth = header.select('text.title')[0][0].clientWidth;
        title.attr('x', (svgWidth / 2) - titleWidth / 2);

        header.append('text')
          .text('Period: from ' + moment(vm.initialExtent[0]).format('ll') + ' to ' + moment(vm.initialExtent[1]).format('ll'))
          .attr('y', currentY)
          .style('font-size', '14');

        newLine();

        header.append('text')
          .text('Export Date: ' + moment().format('lll'))
          .attr('y', currentY)
          .style('font-size', '14');

        newLine();

        header.append('text')
          .text('Data Sources: ' + sdsgs)
          .attr('y', currentY)
          .style('font-size', '14');

        newLine();

        header.append('text')
          .text('Filter: ')
          .attr('y', currentY)
          .style('font-size', '14');

        if (_.isNull(vm.currentFilter())) {
          header.append('text')
            .text('N/A')
            .attr('x', 40)
            .attr('y', currentY)
            .style('font-size', '14');
        } else {
          if (!_.isEmpty(byId)) {
            header.append('text')
              .text('Entry number: ' + byId)
              .attr('x', 40)
              .attr('y', currentY)
              .style('font-size', '14');
            newLine();
          }

          if (!_.isEmpty(byName)) {
            header.append('text')
              .text('Entry name: ' + byName)
              .attr('x', 40)
              .attr('y', currentY)
              .style('font-size', '14');
            newLine();
          }
        }

        function newLine () {
          currentY += 20;
        }
      }
    },

    preRender: function (renderSettings) {
      var vm = this;
      var debug = 'timeline/chart/preRender';

      renderSettings = renderSettings || {};
      renderSettings.mode = renderSettings.mode || false;
      renderSettings.dataReloadOnly = renderSettings.dataReloadOnly || false;

      vm.data = vm.loadData(vm.cfg.data);

      if (!renderSettings.dataReloadOnly) {
        vm.initialExtent = d3.extent(vm.data, function (entry) {
          return entry.date.raw;
        }).map(function (date) {
          return moment(date).startOf('isoweek').toDate(); // monday
        });

        vm.initialExtent[1] = moment(vm.initialExtent[1]).add('week', 1).toDate();

        if (vm.cfg.weeksPadding > 0) {
          vm.initialExtent[0] = moment(vm.initialExtent[0]).subtract('week', vm.cfg.weeksPadding).toDate();
          vm.initialExtent[1] = moment(vm.initialExtent[1]).add('week', vm.cfg.weeksPadding).toDate();
        }

        // update mini axis
        vm.xMini.domain(vm.initialExtent);

        // update brush
        vm.brush = d3.svg.brush()
          .x(vm.xMini)
          .extent(vm.initialExtent);

        // append brush
        var brushContainer = vm.mini.append('g')
          .attr('class', 'brush')
          .call(vm.brush);
        brushContainer.selectAll('rect')
          .attr('y', 0)
          .attr('height', vm.settings.miniHeight);
        brushContainer.select('rect.extent')
          .attr('height', vm.settings.miniHeight - 1)
          .style('fill', 'blue')
          .style('fill-opacity', '.165');
      }

      vm.render(renderSettings);
    },

    /**
     * Choose a time interval (e.g weeks) to display the chart with
     * @param {Object} [renderSettings]
     * @param {Boolean} [renderSettings.recalc]
     * true if we want to resize the chart components dimensions again
     * @param {Boolean} [renderSettings.force]
     * true to force render even if the display range did not change
     * @param {String} [renderSettings.mode]
     */
    render: function (renderSettings) {
      var vm = this;
      var debug = 'timeline/chart/render';

      renderSettings = renderSettings || {};
      renderSettings.recalc = renderSettings.recalc || false;
      renderSettings.force = renderSettings.force || false;
      renderSettings.mode = renderSettings.mode || 'default';

      if (renderSettings.recalc) {
        vm.refreshChartSize();
        vm.resize();
      }

      vm.newExtent(renderSettings.mode === 'default' ? vm.brush.extent() : vm.initialExtent);

      // we don't want to render the chart if the selected time period is the same as before
      if (!renderSettings.recalc && !renderSettings.force
        && !_.isNull(vm.previousExtent)
        && moment(vm.previousExtent[0]).isSame(vm.newExtent()[0])
        && moment(vm.previousExtent[1]).isSame(vm.newExtent()[1])) {
        return;
      }

      vm.previousExtent = vm.newExtent();
      vm.xMain.domain(vm.newExtent());

      vm.visibleData = _.filter(vm.data, function (entry) {
        return vm.canDisplay(entry,
          !_.isEmpty(vm.newExtent()) ? vm.newExtent()[0] : vm.initialExtent[0],
          !_.isEmpty(vm.newExtent()) ? vm.newExtent()[1] : vm.initialExtent[1]
        );
      });

      win.log(debug, vm.visibleData.length, 'entries');

      if (renderSettings.mode === 'default') {
        vm.brush.on('brush', brushWeeks);
      }

      vm.displayByWeek(renderSettings);

      /**
       * Converts the date boundaries selected by the brush into mondays
       * and handles the edge cases
       * @private
       */
      function brushWeeks() {
        var mextent = vm.brush.extent().map(function (date) {
          return moment(date).startOf('isoweek').hour(0).minute(0).second(0).millisecond(0);
        });

        if (d3.event.mode === 'move') {
          mextent[1] = moment(mextent[0]).add('weeks', mextent[1].diff(mextent[0], 'weeks', true /* DST */));
        }

        var miniDuration = moment.duration(vm.cfg.minimumDuration, 'weeks');

        if (moment().range(mextent[0], mextent[1]) < miniDuration) {
          var newMonday = moment(mextent[0]).add(miniDuration);

          if (newMonday.isAfter(vm.xMini.domain()[1])) {
            mextent[0] = moment(mextent[1]).subtract(miniDuration);
          } else {
            mextent[1] = newMonday;
          }
        }

        d3.select(this).call(vm.brush.extent([
          mextent[0].toDate(),
          mextent[1].toDate()
        ]));

        vm.render();
      }
    },

    /**
     * Whether or not the entry can be displayed according to cfg date range and user filter
     * @private
     * @param {Entry} entry
     * @param {Date} minDate
     * @param {Date} maxDate
     * @return {Boolean}
     */
    canDisplay: function (entry, minDate, maxDate) {
      var vm = this;

      // from monday to sunday
      if (!moment(entry.date.raw).within(moment().range(minDate, moment(maxDate).subtract('days', 1)))) {
        return false;
      }

      if (_.isNull(vm.currentFilter())) {
        return true;
      }

      var sdsgs = vm.currentFilter().selectedDataSourceGroups();

      if (!_.isEmpty(sdsgs) && _.isUndefined(_.find(sdsgs, { name: entry.dataSourceGroup.name }))) {
        return false;
      }

      var sentries = vm.currentFilter().selectedEntries();

      if (!_.isEmpty(sentries) && _.isUndefined(_.find(sentries, { id: entry.id }))) {
        return false;
      }

      return true;
    },

    /**
     * Update axis to match the interval and compute the labels and rectangles settings
     */
    displayByWeek: function (renderSettings) {
      renderSettings = renderSettings || {};

      var vm = this;
      var debug = 'timeline/chart/displayByWeek';

      var maxEntryCountByWeek;

      if (_.isUndefined(vm.maxEntryCountByWeek)) {
        maxEntryCountByWeek = _.max(_.values(_.countBy(_.map(vm.visibleData, function (entry) {
          var m = moment(entry.date.raw);
          return m.year() + '.' + m.isoWeek();
        }))));
        maxEntryCountByWeek = maxEntryCountByWeek < 15 ? 15 : maxEntryCountByWeek;
      } else {
        maxEntryCountByWeek = vm.maxEntryCountByWeek;
      }

      var rectWidth = _.isUndefined(vm.rectWidth) ? vm.xMain(moment().add('days', 7)) - vm.xMain(moment().toDate()) : vm.rectWidth;
      var rectHeight = _.isUndefined(vm.rectHeight) ? vm.mainHeight / maxEntryCountByWeek : vm.rectHeight;
      vm.xAxisMain.ticks(d3.time.mondays);

      // config main x axis
      if (renderSettings.mode == 'full' || rectWidth < 17) {
        vm.xAxisMain.tickFormat('');
      } else {
        vm.xAxisMain.tickFormat(function (date) {
          var curWeek = moment(date).week();
          var curYear = moment(date).year();

          if (moment().week() === curWeek && moment().year() === curYear) {
            d3.select(this).style('fill', 'red');
          }

          return curWeek;
        });
      }

      vm.x1AxisMain.ticks(d3.time.months).tickFormat(function (date) {
        return d3.time.format(moment(date).month() === 0 ? '%y %b' : '%b')(date);
      }).tickSize(10, 0, 0);

      // config main y axis
      vm.yMain.domain([0, maxEntryCountByWeek]);
      vm.yAxisMain.ticks(maxEntryCountByWeek > 30 ? maxEntryCountByWeek / 10 : maxEntryCountByWeek);

      var params = {
        rectWidth: rectWidth,
        rectHeight: rectHeight,
        x: function (date) {
          if (!moment.isMoment(date)) {
            date = moment(date);
          }
          return vm.xMain(date.startOf('isoweek').toDate());
        },
        y: vm.yMain,
        nextInterval: function (d0, d1) {
          if (!moment.isMoment(d0)) {
            d0 = moment(d0);
          }
          if (!moment.isMoment(d1)) {
            d1 = moment(d1);
          }
          return d0.isoWeek() !== d1.isoWeek();
        },
        mode: renderSettings.mode
      };

      vm.updateScene(params);
    },

    /**
     * Update the scene i.e rectangles and labels
     * @param {Object} params
     * @param {Number} params.rectWidth
     * @param {Number} params.rectHeight
     * @param {Function} params.x
     * @param {Function} params.y
     * @param {Function} params.nextInterval
     * returns true when the iteration can get over the next interval i.e the next day or next monday
     */
    updateScene: function (params) {
      var vm = this;
      var debug = 'timeline/chart/updateScene';

      // draw main x axis
      vm.xAxisContainerMain
        .call(vm.xAxisMain)
        .selectAll('text')
        .style('font-size', 'small')
        .attr('dx', params.rectWidth / 2);

      vm.x1AxisContainerMain
        .call(vm.x1AxisMain)
        .selectAll('text')
        .style('font-size', 'small')
        .attr('dx', (params.rectWidth * 4) / 2)
        .attr('dy', 8);

      // draw mini x axis
      if (params.mode === 'default') {
        vm.xAxisContainerMini.call(vm.xAxisMini).selectAll('text').style('font-size', '10px');
        vm.x1AxisContainerMini.call(vm.x1AxisMini).selectAll('text').style('font-size', '10px');
      }

      // draw main y axis
      vm.yAxisContainerMain.call(vm.yAxisMain);

      // update axis styles
      vm.svg
        .selectAll('.domain')
        .style('fill', 'none')
        .style('stroke', '#000');
      vm.svg
        .selectAll('line')
        .style('stroke', '#000');

      if (_.isEmpty(vm.visibleData)) {
        vm.entries.selectAll('g').data(vm.visibleData).exit().remove();
        return;
      }

      // display algorithm initialization
      var currentDate = moment(vm.visibleData[0].date.raw);
      var yIndex = 0;

      vm.visibleData = _.map(vm.visibleData, function (entry) {
        var date = moment(entry.date.raw);

        if (params.nextInterval(date, currentDate)) {
          currentDate = date;
          yIndex = 1;
        } else {
          yIndex++;
        }

        entry.x = params.x(date);
        entry.y = params.y(yIndex);
        entry.color = getColor(entry);
        entry.textColor = strings.getIdealTextColor(entry.color);

        return entry;
      });

      var grp = vm.entries.selectAll('g')
        .data(vm.visibleData, function (d) {
          return vm.visibleData.indexOf(d);
        });

      // append new elements
      var item = grp.enter().append('g')
        .on('mouseover', function (d) {
          d3.select(this).select('rect').style('fill-opacity', '0.5');
          vm.tip.show(d);
        })
        .on('mouseout', function (d) {
          d3.select(this).select('rect').style('fill-opacity', '1');
          vm.tip.hide(d);
        });

      item.append('rect')
        .style('fill', function (d) {
          return d.color;
        })
        .style('stroke', '#000')
        .style('stroke-width', 1);

      item.append('text')
        .attr('y', 9)
        .attr('x', 2)
        .style('fill', function (d) {
          return d.textColor;
        })
        .style('font-size', '10px');

      // update new/previously displayed elements
      grp.attr('transform', function (d) {
        return 'translate(' + d.x + ', ' + d.y + ')';
      });

      vm.entries.selectAll('rect')
        .attr('width', params.rectWidth)
        .attr('height', params.rectHeight);

      vm.entries.selectAll('text')
        .text(function (d) {
          return d.id.length * 6 < params.rectWidth ? d.id : '';
        });

      // clean up old groups
      grp.exit().remove();

      /**
       * @private
       * @param entry
       * @return {String} Hexadecimal color code matching entry progress
       */
      function getColor(entry) {
        if (entry.progress === 100) {
          return _.find(vm.cfg.colors, { name: 'Progress 100%' }).hex;
        } else if (entry.progress === 0) {
          return _.find(vm.cfg.colors, { name: 'Progress 0%' }).hex;
        } else {
          for (var i = 0; i < vm.cfg.colors.length; i++) {
            var color = vm.cfg.colors[i];

            if (entry.progress > color.start && entry.progress <= color.end) {
              return color.hex;
            }
          }
        }

        return '#000000';
      }
    },

    /**
     * @param {Object} [data]
     * @param {Boolean} data.inPreview
     * @param {FilterForm} data.filter
     */
    filter: function (data) {
      var vm = this;
      var debug = 'timeline/chart/filter';

      var container = $(vm.settings.container[0]);

      // reset filter
      if (_.isUndefined(data)) {
        vm.currentFilter(null);
      } else {
        vm.currentFilter(data.filter);
      }

      try {
        container.contextMenu('destroy');
      } catch (err) {}

      if (!data || !data.inPreview) {
        vm.initMenu();
      }

      vm.preRender({ dataReloadOnly: true, force: true });
    },

    /**
     * Resizes the chart with the new dimensions computed on window resize or full screen
     */
    resize: function () {
      var vm = this;

      // main scales
      vm.xMain.range([0, vm.width]);
      vm.yMain.range([vm.mainHeight, 0]);

      // mini scales
      vm.xMini.range([0, vm.width]);

      // containers
      vm.svg.attr('width', vm.cx).attr('height', vm.cy);
      vm.clipPath.attr('width', vm.width + 1).attr('height', vm.mainHeight);
      vm.mini.attr('transform', 'translate(' + vm.settings.margin.left + ',' + vm.settings.margin.top + ')');

      // axis containers
      vm.xAxisContainerMain.attr('transform', 'translate(0, ' + vm.mainHeight + ')');
      vm.x1AxisContainerMain.attr('transform', 'translate(0,' + (vm.mainHeight + 40) + ')');

      // brush
      vm.brush.extent(vm.brush.extent());
      vm.mini.select('.brush').call(vm.brush);
    },

    cleanUp: function () {
      var vm = this;

      vm.tip.remove();
      $(vm.settings.container[0]).contextMenu('destroy');
      $(window).off('resize.render');
      vm.fullscreenSubscription.dispose();
    },

    /**
     * @param {Object} options
     * @param {String} options.filePath
     */
    save: function (options) {
      var vm = this;

      svgenie.save(vm.svg.node(), options, function (err) {
        if (err) {
          snot.notify('The chart could not be exported. ' + err, { type: 'error' });
        } else {
          snot.notify('The chart has been exported to ' + options.filePath, {
            onClick: function () {
              gui.Window.open('file:///' + options.filePath, {
                position: 'center',
                width: $(window).width(),
                height: $(window).height()
              });
            }
          });
        }

        $('#timelineChartToPrint').remove();
      });
    }
  };

  TimelineChart.initTooltip = TimelineTooltip;
  TimelineChart.initMenu = TimelineMenu;

  return objects.defclass(TimelineChart);
});
