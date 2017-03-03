### ng-util
------
Small utility library for angular.js

### installing
------
`bower install ng-util --save`

### usage
------
1. include the script in page.
`<script src="bower_components/ng-util/dist/util.min.js"></script>`

2. add module as dependency to app

`angular.module('myApp',['ng-util'])`;

3. usage in controller.
------
```js
angular.module('myApp').controller('FooCtrl',['$util',function($util){

	$util.async([1,2,3],function(item,next){
		next(null,item * 3);
	},function(errors,results){
		if(errors) 
			console.log(errors);
		else
			console.log(results);
	});
	
	$util.sync([1,2,3],function(item,next){
		next(null,item * 3);
	},function(errors,results){
		if(errors) 
			console.log(errors);
		else
			console.log(results);
	});
	
	$util.load('/path/to/somefile.css','/path/to/somefile.js').then(function(){
		//do something
	})
	.catch(function(errors){
	
	});
	

}]);

```

4. usage in router as module loader (ui-router is shown).
------
```js

angular.module('myApp').config(['$stateProvider',function($stateProvider){
	$stateProvider
		.state({
			name: 'foo',
			controller: 'FooCtrl',
			url: '/',
			templateUrl: 'templates/app.html',
			resolve: {
				'loadDeps': ['$util',function($util){
					return $util.load('/path/to/myModule.js','/path/to/myModule.css'); //simply return the promise.
				}]
			}
		})
});

```

### configuration `$utilProvider`
------
> You can configure the module at run time like so:

```js

var app = angular.module('myApp',['$util']);

app.config(['$utilProvider',function($utilProvider){

	$utilProvider.config({
		cacheBust: true, // cache busting when loading modules
		extend: function($util){
			//extend the service
			$util.foo = function(){
				console.log('hello world!');
			};
		}
	});
	
}]);

# options list
--
- `cacheBust` Boolean
- `extend` Function




### factory `$util`
------
1. `async` - void async( Array items, Function( item, next(error,result) ), Function( errors,results ) ) 
	> async execution, guaranteed return order

2. `sync` - void sync( Array items, Function( item, next(error,result) ), Function( errors,results ) )
	> sync execution, guaranteed return order
	
3. `load` - Promise load( Mixed|Array files )
	> loads dependencies. returns promise. can be used anywhere $utils can be injected. pass file path's as array or individual arguments.
	> arguments are extracted and flattened so you can choose whichever syntax is most readable to you. 
	> first argument can optionally make function behave async or sync. default is async. example:
	>
	> $util.load(true,['somefile.js','someotherfile.js']);//result = scripts loaded synchronously, one at a time.
	> $util.load('sync','somefile.js','someotherfile.js');//result = same as above.
	> $util.load([false,'somefile.js','someotherfile.js']);//result = scripts loaded async, which is default.
	> $util.load('async','somefile.js',['someMoreFiles.js','anotherfile.js']); //result = same as above.
	
4. `uuid_v4` - String uuid_v4()
	> generates an RFC 4122 (v4) compliant uuid and returns it as a string
	
5. `flatten` - Array flatten( Array arr )
	> flattens nested arrays.

	
### directives
------

1. `ng-filechange` 
	> adds ng-filechange which is curiously missing from angular.js allows you to react to a filechange 
	> usage `<input type="file" ng-filechange="someFunc(files)" />`
	
### filters
------

1. `uc_words` 
	> same as the uc_words() function in php. it capitalized every word in a string and returns the resultant string.
	> usage `<span>{{ title|uc_words }}`