### ng-utils
------
Small utility library for angular.js

### installing
------
`bower install ng-utils --save`

### usage
------
1. include the script in page.
`<script src="bower_components/ng-utils/dist/utils.min.js"></script>`

2. add module as dependency to app

`angular.module('myApp',['ng-utils'])`;

3. usage in controller.

```js
angular.module('myApp').controller('FooCtrl',['$utils',function($utils){

	$utils.async([1,2,3],function(item,next){
		next(null,item * 3);
	},function(errors,results){
		if(errors) 
			console.log(errors);
		else
			console.log(results);
	});
	
	$utils.sync([1,2,3],function(item,next){
		next(null,item * 3);
	},function(errors,results){
		if(errors) 
			console.log(errors);
		else
			console.log(results);
	});
	
	$utils.load('/path/to/somefile.css','/path/to/somefile.js').then(function(){
		//do something
	})
	.catch(function(errors){
	
	});
	

}]);

```

4. usage in router as module loader (ui-router is shown).

```js

angular.module('myApp').config(['$stateProvider',function($stateProvider){
		$stateProvider
		.state({
			name: 'foo',
			controller: 'FooCtrl',
			url: '/',
			templateUrl: 'templates/app.html',
			resolve: {
				'loadDeps': ['$utils',function($utils){
					return $utils.load('/path/to/myModule.js','/path/to/myModule.css'); //simply return the promise.
				}]
			}
		})
});

```

5. spec

1. `async` - void async( Array items, Function( item, next(error,result) ), Function( errors,results ) ) 
	> async execution, guaranteed return order

2. `sync` - void sync( Array items, Function( item, next(error,result) ), Function( errors,results ) )
	> sync execution, guaranteed return order
	
3. `load` - Promise load( Array files )
	> async load dependencies. returns promise. can be used anywhere $utils can be injected. pass file path's as array or individual arguments.
	
	