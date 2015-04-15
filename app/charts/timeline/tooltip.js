define([
  'd3', 'd3-tip'
], function (d3) {
  return function () {
    var vm = this;

    vm.tip = d3.tip()
      .attr('class', 'd3-tip')
      .html(function (d) {
        var dataColumnToHtml = {
          'name': function () {
            return '<h2>' + d.name + '</h2>';
          },
          'progress': function () {
            return '<p>Progress: ' + d.progress + '%</p>';
          }
        };

        var tip = '<h1>' + d.id + '</h1>';

        d.dataSourceGroup.dataColumns.forEach(function (dataColumn) {
          if (_.contains(['id'], dataColumn.nameVM) || dataColumn.disabled) {
            return;
          }

          if (!_.isUndefined(dataColumnToHtml[dataColumn.nameVM])) {
            tip += dataColumnToHtml[dataColumn.nameVM](dataColumn);
          } else {
            tip += '<p>' + dataColumn.name + ': ';
            tip += !_.isUndefined(d[dataColumn.nameVM].value) ? d[dataColumn.nameVM].value : d[dataColumn.nameVM];
            tip += '</p>';
          }
        });

        tip += '<p class="text-right">Data Source: ' + d.dataSourceGroup.name + '</p>';

        return tip;
      })
      .direction('custom')
      .offset([25, -5]);

    vm.svg.call(vm.tip);
  };
});