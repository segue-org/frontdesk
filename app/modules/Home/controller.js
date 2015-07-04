(function() {
  "use strict";

  angular
    .module('segue.frontdesk.home', [
      'segue.frontdesk.authenticate.service',
      'segue.frontdesk.home.controller'
    ])
    .config(function($stateProvider) {
      $stateProvider
        .state('home', {
          url: '^/',
          views: {
            query:   { },
            content: { templateUrl: 'modules/Home/home.html', controller: 'HomeController' }
          }
        });
    });

  angular
    .module('segue.frontdesk.home.controller', [])
    .controller('HomeController', function($rootScope, $scope, $state, $window, Auth) {
      $scope.enforceAuth();
    });
})();
