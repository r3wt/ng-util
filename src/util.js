/**
 * @package ng-util
 * @author Garrett Morris <gmorris_89@outlook.com>
 * @license MIT
 * @version 1.0.10
 */
!function(angular){
    
    var mod = angular.module('ng-util',[]);

    mod.config(['$controllerProvider','$compileProvider','$filterProvider','$provide',function($controllerProvider,$compileProvider,$filterProvider,$provide){
        
        mod.$controllerProvider = $controllerProvider;
        mod.$filterProvider = $filterProvider;
        mod.$provide = $provide;
        mod.$compileProvider = $compileProvider;
        
        var map = {
            controller: ['$controllerProvider','register'],
            filter: ['$filterProvider','register'],
            service: ['$provide','service'],
            factory: ['$provide','factory'],
            value: ['$provide','value'],
            constant: ['$provide','constant'],
            directive: ['$compileProvider','directive'],
            component: ['$compileProvider','component']
        };
        
        var bootStrapped = [];
        
        var mFunc = angular.module;

        angular.module = function(){
            
            var app = mFunc.apply(this,arguments);
            
            //only override properties once.
            if(bootStrapped.indexOf(arguments[0]) == -1){
                for(var type in map){
                    
                    var c = mod;
                    
                    var d = map[type];
                    
                    for(var i=0;i<d.length;i++){
                        c = c[d[i]];// recurse until reaching the function
                    }
                    //now inject the function into an IIFE so we ensure its scoped properly
                    //im not sure this is actually needed but i'm wary of for loops.
                    !function(app,type,c){
                        app[type] = function(){
                            c.apply(this,arguments);
                            return this;//return the app instance for chaining.
                        }.bind(app);    
                    }(app,type,c);
                }   
                bootStrapped.push(arguments[0]);//mark this instance as properly monkey patched
            }
            
            return app;
            
        }.bind(angular);    
        
    }]);

    mod.provider('$util',function(){
        
        var _config = {
            cacheBust: false,
            extend: function(){}
        };
        
        var _deps = {};
        
        var _dependencyDefaults = {
            series: false,
            files: []
        };
        
        this.config = function(config){
            for(var key in config){
                _config[key] = config[key];
            }
        };
        
        //adds a dependency to the dependencies, so its file(s) can be loaded by key.
        this.dependencies = function( dependencies ) {

            for(var dependency in dependencies){
                for(var prop in _dependencyDefaults){
                    if(dependencies[dependency].hasOwnProperty(prop)){
                        _deps[dependency][prop] = dependencies[dependency][prop];
                    }else{
                        _deps[dependency][prop] = _dependencyDefaults[prop];
                    }
                }
            }
            
        };
        
        this.$get = ['$q',function($q){
        
            function $util(){
                
                if(typeof _config.extend == 'function'){
                    _config.extend(this);
                }
                
            }
            
            var Util = {
                
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
                                if(errors.toString().replace(/,/g,'') == ''){
                                    errors = null;
                                }else{
                                    errors.join("\r\n----------\r\n");
                                }
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
                            if(errors.toString().replace(/,/g,'') == ''){
                                errors = null;
                            }else{
                                errors.join("\r\n----------\r\n");
                            }
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
                    
                    if(_config.cacheBust){
                        url +='?_v='+(new Date()).getTime();
                    }
                    
                    if(!angular.element(document.getElementById(id)).length){
                        var el = document.createElement(type);
                        if(type == 'link'){
                            
                            el.rel = 'stylesheet';
                            el.href = url;
                            el.id = id;
                            document.head.appendChild(el);
                            cb();
                        }
                        else if(type == 'script'){
                            
                            el.id = id;
                            el.src = url;
                            el.addEventListener('load',function(){
                                cb();
                            },false);
                            el.addEventListener('error',function(){ err(arguments); },false);
                            document.body.appendChild(el);
                        }
                    }else{
                        
                        cb();
                    }
                },
                
                // Promise load( Array files )
                load: function (){
                    
                    args = Array.prototype.slice.call(arguments);
                    
                    args = this.flatten(args);//flatten args
                    
                    var iteratorType = 'async';
                    
                    var items = args;
                    //if first argument is sync or async or true false, treat is an instruction.
                    var first = items[0];
                    if([true,false,'sync','async'].indexOf(first) != -1){
                        items.shift();//remove first item
                        iteratorType = first == true ? 'sync' : first == 'sync' ? 'sync' : 'async';
                    }

                    var _self = this;

                    return $q(function(resolve,reject){
                        if(items.length == 0){
                            return resolve();
                        }
                        _self[iteratorType]( items, function(item,next){
                            if(item.indexOf('.js') != -1){
                                _self.loadOne('script',item,next,function(err){
                                    next(err);
                                }); 
                            }
                            else if(item.indexOf('.css') != -1){
                                _self.loadOne('link',item,next);
                            }else{
                                
                                next();
                            }
                        },function(errors,results){
                            if(errors){
                                reject(errors);
                            }else{
                                resolve();
                            }
                        });
                    });
                    
                },
                
                // Promise loadDeps( Array dependencies )
                loadDeps: function(){
                    
                    args = Array.prototype.slice.call(arguments);
                    args = this.flatten(args);//flatten args
                    
                    var _self = this;
                    
                    return $q(function(resolve,reject){
                        
                        _self.async(args,function(dependency,next){
                        
                            var dep = _deps[dependency] || false;
                            
                            if(!dep){
                                $log.warn('bad dependency `'+dependency+'` skipping loading');
                            }
                            
                            _self.load(dep.series,dep.files)
                                .then(function(){ next(); })
                                .catch(function(err){ next(err); });
                            
                        },function(errors,results){
                            if(errors){
                                reject(errors);
                            }else{
                                resolve();
                            }
                        });
                        
                    });
                    
                },

                // String uuid_v4()
                // Taken from: http://stackoverflow.com/a/2117523/2401804
                uuid_v4 : function() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                        return v.toString(16);
                    });
                },
                
                // flatten( Array arr )
                // Taken from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Flatten_an_array_of_arrays
                flatten: function( arr ){
                    var _self = this;
                    return arr.reduce(function(acc, val){ 
                        return acc.concat( Array.isArray(val) ? _self.flatten(val) : val );
                    },[]);
                },
                
                // random_int( Number min, Number max )
                // Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#Getting_a_random_integer_between_two_values_inclusive
                random_int: function( min, max ){
                    min = Math.ceil(min);
                    max = Math.floor(max);
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                },
                
                // slugify( String text )
                slugify: function( text ){
                    return text.toString().toLowerCase().trim()
                    .replace(/&/g, '-and-')
                    .replace(/[\s\W-]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                },
                
                // approximate_count( Number number )
                // taken from http://stackoverflow.com/a/3177857/2401804 (modified)
                approximate_count: function getRepString( number )
                {
                    var formatted;
    
                    if (number < 1000) {
                        formatted = number;
                    }
                    else if (number < 10000) {
                        formatted = number.charAt(0) + ',' + number.substring(1);
                    }
                    else if (number < 1000000) {
                        formatted = (Math.round((number / 1000) * 10) / 10)+'k';
                    }
                    else{
                        formatted = (Math.round((number / 1000) * 10) / 10)+'m';
                    }

                    return formatted.toString();
                }
                
            };
            
            $util.prototype = Util;
            
            return new $util();
            
        }];
        
    })

    //directives

    // adds filechange listener to file elements, curiously missing from angularjs
    // <input ng-filechange="someFunc(files)" />
    .directive('ngFilechange', function() {
        return {
            restrict: 'A',
            scope: {
                ngFilechange: '&'
            },
            link: function (scope, element, attrs) {
                element.bind('change', function() {
                    scope.$apply(function() {
                        var files = element[0].files;
                        if (files) {
                            scope.ngFilechange({ files: files });
                        }
                    });
                });
            }
        };
    })

    // filters

    // same as php uc_words() function. capitalizes every word in string.
    // <span> {{ someProperty|uc_words }} </span> 
    .filter('uc_words', function() {
        return function(input) {
            var str = [];
            var a = input.split(' ');
            for(var i=0;i<a.length;i++){
                if(!!a[i]) str.push(a[i].charAt(0).toUpperCase() + a[i].substr(1).toLowerCase());
            }
            return str.join(' ');
        };
    })
    
    // approximate_count similar to way twitter and stackoverflow format followers/reputation
    // <span> {{ someNumber|approximate_count }} followers </span>
    .filter('approximate_count',['$util',function($util){
        return function(input){
            return $util.approximate_count(input);
        };
    }]);
    
    
}(angular);