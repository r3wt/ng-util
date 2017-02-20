angular
.module('ng-utils',[])
.factory('$utils',['$q',function($q){
	
	function $utils(){}
	
	var Utils = {
		
		// void async( Array items, Function eachFn, Function callbackFn )
		async: function( items, eachFn, callbackFn ){
			var itemsLength = items.length,
				i=0,
				returned = new Array(itemsLength).fill(0),
				results = new Array(itemsLength).fill(null),
				errors = new Array(itemsLength).fill(null);
			
			function loop(i,item){
				function next( error, result ){
					if(error){
						errors[i] = error;
					} 
					if(result){
						results[i] = result;
					}
					returned[i] = 1;
					if(returned.indexOf(0) == -1){
						callbackFn(errors,results);
					}
				}
				eachFn(item,next);
			}
			
			for(i;i<itemsLength;i++){
				loop(i,items[i]);
			}
		},
		
		// void sync( Array items, Function eachFn, Function callbackFn )
		sync: function( items, eachFn, callbackFn ){
	
			var results = [], 
				errors = [];
				
			function next(error,result){
				if(error != null) {
					errors.push(error);
				}
				if(result != undefined) {
					results.push(result);
				}
				if(items.length == 0){
					return callbackFn(errors,results);
				}else{
					//pop first item, pass it to eachCb with the next function
					eachFn(items.shift(),next);
				}
			};
			
			eachFn(items.shift(),next);
			
		},
		
		// void loadOne( String type, String url, Function cb, Function err )
		loadOne: function( type, url, cb, err ) {
			
			if(!cb){
				cb = function(){};
			}
			if(!err){
				err = function(){};
			}
			
			var types = ['script','link'];
			if(types.indexOf(type) == -1){
				throw new Error('only scripts and links supported');
			}
			
			var id = url.replace(/\W+/g, "");
			
			if(!$('#'+id).length){
				var el = document.createElement(type);
				if(type == 'link'){
					el.rel = 'stylesheet';
					el.href = url;
					el.id = id;
					document.head.appendChild(el);
				}
				else if(type == 'script'){
					el.id = id;
					el.src = url;
					listenOnce(el,'load',cb);
					listenOnce(el,'error',err);
					document.body.appendChild(el);
				}
				
				document.head.appendChild(el);
			}else{
				cb();
			}
		},
		
		// Promise load( Array files )
		load: function (){
			
			if(arguments.length > 1){
				var items = arguments;
			}else{
				var items = arguments[0];
			}
			
			var _self = this;

			return $q(function(resolve,reject){
				if(items.length == 0){
					return resolve();
				}
				_self.async( items, function(item,next){
					if(item.indexOf('.js') != -1){
						_self.loadOne('script',item,next,next);	
					}
					else if(item.indexOf('.css') != -1){
						_self.loadOne('link',items);
						next();
					}else{
						console.log('unknown load type for file %s. skipping.',item);
						next();
					}
				},function(errors,results){
					if(errors.length){
						reject(errors);
					}else{
						resolve();
					}
				});
			});
			
		}
		
	};
	
	$utils.prototype = Utils;
	
	return new $utils();
	
}]);