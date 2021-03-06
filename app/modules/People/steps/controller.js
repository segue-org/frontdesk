(function() {
  "use strict";

  angular
    .module('segue.frontdesk.people.steps', [
      'segue.frontdesk.flash',
      'segue.frontdesk.people.steps.controller',
      'segue.frontdesk.people.controller',
      'segue.frontdesk.people.service',

      'segue.frontdesk.authenticate.service',
      'ui.keypress',
    ])
    .config(function($stateProvider) {
      function viewsFor(stepName, customTemplateName) {
        var templateName = customTemplateName || stepName.toLowerCase();
        return {
          "header": { controller: 'PersonNameController', templateUrl: 'modules/People/person.header.html' },
          "data":   { controller: 'PersonNameController', templateUrl: 'modules/People/person.data.html' },
          "step":   { controller: 'Person'+stepName+'Controller', templateUrl: 'modules/People/steps/'+templateName+'.html' }
        };
      }
      function resolves(otherResolves) {
        var defaults = { person: function(People, $stateParams) { return People.getOne($stateParams.xid); } };
        return _.extend(defaults, otherResolves);
      }

      $stateProvider
        .state('people.person.email', {
          url: '/email',
          views: viewsFor('Email'),
          resolve: resolves({})
        })
        .state('people.person.name', {
          url: '/name',
          views: viewsFor('Name'),
          resolve: resolves({})
        })
        .state('people.person.document', {
          url: '/document',
          views: viewsFor('Document'),
          resolve: resolves({})
        })
        .state('people.person.country', {
          url: '/country',
          views: viewsFor('Country'),
          resolve: resolves({})
        })
        .state('people.person.city', {
          url: '/city',
          views: viewsFor('City'),
          resolve: resolves({})
        })
        .state('people.person.product', {
          url: '/product',
          views: viewsFor('Product'),
          resolve: resolves({ products: function(person) { return person.follow('eligible'); } })
        })
        .state('people.person.promocode', {
          url: '/promocode',
          views: viewsFor('Promocode'),
          resolve: resolves({})
        })
        .state('people.person.payment', {
          url: '/payment',
          views: viewsFor('Payment'),
          resolve: resolves({})
        })
        .state('people.person.badge_name', {
          url: '/badge-name',
          views: viewsFor('BadgeName', 'badge_name'),
          resolve: resolves({})
        })
        .state('people.person.badge_corp', {
          url: '/badge-corp',
          views: viewsFor('BadgeCorp', 'badge_corp'),
          resolve: resolves({})
        })
        .state('people.person.print', {
          url: '/print-badge',
          views: viewsFor('Print'),
          resolve: resolves({})
        })
        .state('people.person.give_badge', {
          url: '/give-badge',
          views: viewsFor('GiveBadge', 'give_badge'),
          resolve: resolves({})
        })
        .state('people.person.done', {
          url: '/done',
          views: viewsFor('Done'),
          resolve: resolves({})
        });
    });

  angular
    .module('segue.frontdesk.people.steps.controller', [])
    .controller('PersonEmailController', function($scope, $state, People, focusOn, person, lazyCommit) {
      $scope.step = { email: person.email };
      $scope.keypress = {
        enter: lazyCommit(People.patch, person.id, 'people.person.name', person, $scope, 'email')
      };
      focusOn('step.email');
    })
    .controller('PersonNameController', function($scope, $state, People, focusOn, person, lazyCommit) {
      $scope.step = { name: person.name };
      $scope.keypress = {
        enter: lazyCommit(People.patch, person.id, 'people.person.document', person, $scope, 'name')
      };
      focusOn('step.name');
    })
    .controller('PersonDocumentController', function($scope, $state, People, focusOn, person, lazyCommit) {
      $scope.step = { "document": person.document };
      $scope.keypress = {
        enter: lazyCommit(People.patch, person.id, 'people.person.country', person, $scope, 'document')
      };
      focusOn('step.document');
    })
    .controller('PersonCountryController', function($scope, $state, Config, People, focusOn, person, lazyCommit) {
      $scope.options = Config.DEFAULT_COUNTRIES;
      $scope.step = { country: person.country };
      $scope.commitCountry = lazyCommit(People.patch, person.id, 'people.person.city', person, $scope, 'country');

      $scope.selectOption = function(index) {
        var options = $scope.options.concat($scope.enteredOption);

        $scope.step.country = options[index];
        $scope.commitCountry();
      };

      $scope.keypress = function($index) {
        return {
          up:    _.partial($scope.focusOption, $scope.options.length, $index-1),
          down:  _.partial($scope.focusOption, $scope.options.length, $index+1),
          enter: function() { if ($index == $scope.options.length) { $scope.selectOption($index); } }
        };
      };

      $scope.autoFocusOption($scope.options, person.country);

    })
    .controller('PersonCityController', function($scope, $state, People, focusOn, person, lazyCommit) {
      $scope.step = { city: person.city };
      $scope.keypress = {
        enter: lazyCommit(People.patch, person.id, 'people.person.product', person, $scope, 'city')
      };
      focusOn('step.city');
    })
    .controller('PersonProductController', function($scope, $state, Auth, Config, People, focusOn, person, products, lazyCommit) {
      $scope.is_cashier = Auth.isCashier();
      $scope.options = products;
      $scope.step = { product: person.product };
      $scope.commitProduct = lazyCommit(People.setProduct, person.id, 'people.person.payment', person, $scope, 'product');

      $scope.backToSearch  = function() { $scope.reload('people.person.done'); };
      $scope.goToPayment   = function() { $scope.reload('people.person.payment'); };
      $scope.goToPromocode = function() { $scope.reload('people.person.promocode'); };

      $scope.selectOption = function(index) {
        if (index == $scope.options.length) {
          $scope.goToPromocode();
        } else {
          $scope.step.product = products[index];
          $scope.commitProduct();
        }
      };

      $scope.keypress = function($index) {
        return {
          up:    _.partial($scope.focusOption, $scope.options.length+1, $index-1),
          down:  _.partial($scope.focusOption, $scope.options.length+1, $index+1),
        };
      };

      $scope.autoFocusOption($scope.options, person.product, function(x) { return x.id == person.product.id; });
    })
    .controller('PersonPromocodeController', function($scope, $state, People, FormErrors, focusOn, person, lazyCommit) {
      $scope.step = { hash_code: '' };
      $scope.tryPromocode = function() {
        People.applyPromo(person.id, $scope.step)
              .then($scope.restart)
              .catch(FormErrors.set);
      };
      $scope.giveUp = $scope.restart;
      $scope.keypress = { enter: $scope.tryPromocode, esc: $scope.giveUp };

      focusOn('step.hash_code');
    })
    .controller('PersonPaymentController', function($scope, $state, Auth, People, FormErrors, focusOn, person, lazyCommit) {
      $scope.is_cashier = Auth.isCashier();
      if (person.has_valid_ticket) { $scope.restart(); }

      $scope.didNotReceive = function() {
        $state.go('people.search', { query: person.name });
      };
      $scope.receivedCash = function() {
        People.receivedPayment(person.id, 'cash')
              .then(_.partial($state.reload, 'people.person'))
              .catch(FormErrors.set);
      };
      $scope.receivedCard = function() {
        People.receivedPayment(person.id, 'card')
              .then(_.partial($state.reload, 'people.person'))
              .catch(FormErrors.set);
      };

      $scope.goToPromocode = function() { $scope.reload('people.person.promocode'); };

      $scope.keypress = function($index) {
        return {
          up:    _.partial($scope.focusOption, 4, $index-1),
          down:  _.partial($scope.focusOption, 4, $index+1),
        };
      };

      focusOn('option-0');
    })
    .controller('PersonBadgeNameController', function($scope, $state, People, focusOn, person, lazyCommit) {
      if (!person.has_valid_ticket) { $scope.restart(); return; }
      $scope.step = { badge_name: person.badge_name };
      $scope.keypress = {
        enter: lazyCommit(People.patch, person.id, 'people.person.badge_corp', person, $scope, 'badge_name')
      };
      focusOn('step.badge_name');
    })
    .controller('PersonBadgeCorpController', function($scope, $state, People, focusOn, person, lazyCommit) {
      if (!person.has_valid_ticket) { $scope.restart(); return; }
      $scope.step = { badge_corp: person.badge_corp };
      $scope.keypress = {
        enter: lazyCommit(People.patch, person.id, 'people.person.print', person, $scope, 'badge_corp')
      };
      if (person.can_change_badge_corp) {
        focusOn('step.badge_corp');
      } else {
        focusOn('option-0');
      }
    })
    .controller('PersonPrintController', function($scope, $state, People, Flash, focusOn, person, lazyCommit) {
      if (!person.has_valid_ticket) { $scope.restart(); return; }

      function nextPage() {
        $state.go('people.person.give_badge', $state.params);
      }
      console.log("in controller print");

      $scope.print = function() {
        console.log("in print()");
        People.printBadge(person.id)
              .then(nextPage)
              .catch(Flash.set)
              .then(nextPage);
      };

      $scope.print();
    })
    .controller('PersonGiveBadgeController', function($scope, $state, People, FormErrors, focusOn, person, lazyCommit) {
      if (!person.last_badge)       { $scope.restart(); return; }
      if (!person.has_valid_ticket) { $scope.restart(); return; }

      $scope.given = function() {
        People.giveBadge(person.last_badge.id)
              .then(_.partial($scope.fastForward, 'people.person.done'))
              .catch(FormErrors.set);
      };

      $scope.reprint = function() {
        $scope.fastForward('people.person.print');
      };
      $scope.editBadge = function() {
        $scope.fastForward('people.person.badge_name');
      };

      $scope.keypress = function($index) {
        return {
          up:    _.partial($scope.focusOption, 3, $index-1),
          down:  _.partial($scope.focusOption, 3, $index+1),
        };
      };
      focusOn("option-0");
    })
    .controller('PersonDoneController', function($scope, $state, $timeout) {
      $timeout(function() {
        $state.go('people.search');
      },1500);
    });

})();
