define(['durandal/app'], function (app) {
  return function beforeExit() {
    var self = this;
    var options = ['Yes', 'No'];
    var msg = 'Press yes to exit or no to get back to where you were.';

    app.showMessage(msg, 'Are you sure you want to exit CommDaB?', options).then(function (selectedOption) {
      switch (selectedOption) {
        case 'Yes':
          self.close(true);
          break;
      }
    });
  }
});