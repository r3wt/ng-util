/**
 * @package ng-util
 * @author Garrett Morris <gmorris_89@outlook.com>
 * @license MIT
 * @version 1.0.10
 */
!function(angular,document){
    
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
                    //overriding the angular functions with our proxies.
                    app[type] = function(){
                        c.apply(this,arguments);
                        return this;//return the app instance for chaining.
                    }.bind(app);    
                }   
                bootStrapped.push(arguments[0]);//mark this instance as properly monkey patched
            }
            
            return app;
            
        }.bind(angular);    
        
    }]);

    mod.provider('$util',function(){
        
        var _config = {
            cacheBust: false,
            extend: function(){},
            version: false,//if not false, set a version to be appended to files. useful for updating production deployments.
        };
        
        var _date = (new Date()).getTime();
        
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
                _deps[dependency] = {};
                for(var prop in _dependencyDefaults){
                    if(dependencies[dependency].hasOwnProperty(prop)){
                        _deps[dependency][prop] = dependencies[dependency][prop];
                    }else{
                        _deps[dependency][prop] = _dependencyDefaults[prop];
                    }
                }
            }
            
        };
        
        
        //taken from https://stackoverflow.com/a/5505137/2401804
        var qs = function(obj) {
            var parts = [];
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
                }
            }
            var str = parts.join("&");
            if(str.length) str = '?'+str;
            return str;
        };
        //end accreditation
        
        //tiny time parser
        var timeParse = function(t) {
            if(typeof t == 'string'){
                t=t.replace(/\s+/g,'');
                t=t.replace(/min(utes|ute|s)?/i,'m');
                t=t.replace(/day(s)?/i,'d');
                t=t.replace(/sec(onds|ond|s)?/i,'s');
                t=t.replace(/hour(s)?/i,'h');
                t=t.replace(/y(ea)?r(s)?/i,'y');
                var m = t.match(/^(\d+)(ms|s|m|h|d|y)$/i);
                if(m instanceof Array && m.length == 3){
                    var a = ~~m[1],
                        b = m[2].toLowerCase(),
                        c = {
                            ms: 1,
                            s : 1000,
                            m : 60000,
                            h : 3.6e+6,
                            d : 3.6e+6 * 24,
                            y : (3.6e+6 * 24) * 364.25
                        };
                    t = a * c[b];
                }else{
                    t = -1;
                }
            }
            if(typeof t != 'number'){
                t = -1;
            }
            return t;
        };
        
        var cookie = function(){};//no hoisting
        cookie.prototype = {
            set: function(name,value,expires) {
              if(typeof expires === 'string'){
                  expires = timeParse(expires);
              }
              document.cookie = name+"="+value+expires+"; path=/";
            },
            get: function( name ){
                var ca = document.cookie.split(';');
                var ob = {};
                for(var i=0;i<ca.length;i++){
                    var c = ca[i];
                    var j = 0;
                    while(c[j] != '='){
                        j++;
                    }
                    var cb = c.substr(0,j-1);
                    ob[ cb ] = c.substr(j+1,c.length);
                    
                    if(name && cb == name){
                        return ob[cb];
                    }
                }
                return ob;
            },
            remove: function(name) {
              this.set(name,"",-1);
            }
        };
        
        this.$get = ['$q',function($q,$util){
        
            function $util(){
                
                if(typeof _config.extend == 'function'){
                    _config.extend(this);
                }
                
            }
            
            $util.prototype = {
                
                // void async( Array items, Function eachFn, Function callbackFn )
                async: function( items, eachFn, callbackFn ){
                    var itemsLength = items.length,
                        i=0,
                        returned = new Array(itemsLength).fill(0),
                        results = new Array(itemsLength).fill(null),
                        errors = new Array(itemsLength).fill(null);
                    
                    var loop = function(i,item){
                        var next = function( error, result ){
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
                        };
                        eachFn(item,next);
                    };
                    
                    for(i;i<itemsLength;i++){
                        loop(i,items[i]);
                    }
                },
                
                // void sync( Array items, Function eachFn, Function callbackFn )
                sync: function( items, eachFn, callbackFn ){
            
                    var results = [], 
                        errors = [];
                        
                    var next = function (error,result){
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
                    
                    cb = cb || function(){};
                    err = err || function(){};
                    
                    var params = {};
                    
                    if(_config.version) params.v = _config.version;
                    
                    if(_config.cacheBust) params._v = _date;
                    
                    url += qs(params);//add query string.
                    
                    if(angular.element(document.querySelectorAll('script[src="'+url+'"],link[href="'+url+'"]')).length){
                        //already loaded.
                        cb();
                    }else{
                        
                        var el = document.createElement(type);
                        if(type == 'link'){
                            
                            el.rel = 'stylesheet';
                            el.href = url;
                            document.head.appendChild(el);
                            cb();
                            
                        }else if(type == 'script'){
                            
                            el.src = url;
                            el.addEventListener('load',function(){
                                cb();
                            },false);
                            el.addEventListener('error',function(){ err(arguments); },false);
                            document.body.appendChild(el);
                            
                        }else{
                            throw new Error('only scripts and links supported');
                        }
                    }
                },
                
                // Promise load( Array files )
                load: function (){
                    
                    var items = this.flatten(
                        Array.prototype.slice.call(arguments)
                    );

                    //if first argument is sync or async or true false, treat is an instruction.
                    var first = items[0];
                    
                    if([true,false,'sync','async'].indexOf(items[0]) != -1){
                        items.shift();//remove first item
                    }
                    
                    var iteratorType = ( (first == true || first == 'sync') ? 'sync' : 'async' );

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
                    
                    var items = this.flatten(
                        Array.prototype.slice.call(arguments)
                    );
                    
                    var _self = this;
                    
                    return $q(function(resolve,reject){
                        
                        _self.async(items,function(dependency,next){
                        
                            var dep = _deps[dependency] || false;
                            
                            if(!dep){
                                console.log('bad dependency `'+dependency+'` skipping loading');
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
                },
                
                // query_str( Obj queryParams )
                query_str: qs, //expose objToQueryString
                
                // simple cookie functions
                cookie: cookie,
                
                //parse time in milliseconds from string
                // time_str( String time )
                time_str: timeParse,
                
                //listen for plain events on elements and proxy the event to scope function.
                // proxy_event( angular.Element element, String event, angular.Scope scope, String fn )
                proxy_event: function( element, event, scope, fn ){
                    element[0].addEventListener(event,function(e) {
                      if(fn){
                          $parse(attrs[fn])(scope,{ e: e });//event is fully delegated. target function responsible for its lifecycle.
                      }
                    });
                }
                
            };
            
            return new $util();
            
        }];
        
    })

    //directives
    
    //allows user to define proxied events on the given element
    // <input ng-proxied-events="configObject" />
    .directive('ngProxiedEvents',function($util){
        return {
            restrict: 'A',
            link: function(scope,element, attrs){
                var config = scope.ngProxiedEvents;
                /* config = {
                    'eventName':'functionName',
                    'eventName2':['function1','function2','function3']
                } */
                
                for(var event in config){
                    if(!(config[event] instanceof Array)){
                        config[event] = [config[event]];
                    }
                    for(var i=0;i<config[event].length;i++){
                        $util.proxy_event(element,event,scope,config[event][i]);
                    }
                }
            }
        };
    })

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
    
    
    // adds simple drag and drop file api listeners.
    // <input ng-file-dropped="someFunc(files)" ng-file-over="someFunc(e)" ng-file-enter="someFunc(e)" ng-file-leave="someFunc(e)" >
    .directive('ngFileDropped',function($parse,$util) {
        return {
            restrict: 'A',
            link: function(scope,element,attrs){
                
                $util.proxy_event(element, 'dragover', scope, attr.ngFileOver ? 'ngFileOver' : false );
                $util.proxy_event(element, 'dragenter', scope, attr.ngFileOver ? 'ngFileEnter' : false );
                $util.proxy_event(element, 'dragleave', scope, attr.ngFileOver ? 'ngFileLeave' : false );

                element[0].addEventListener('drop', function(e){
                    e.preventDefault();
                    try{

                        // If dropped items aren't files, reject them
                        var dt = e.dataTransfer;
                        var files = [];
                        if (dt.items) {
                            // Use DataTransferItemList interface to access the file(s)
                            for (var i=0; i < dt.items.length; i++) {
                                if (dt.items[i].kind == "file") {
                                    files.push(dt.items[i].getAsFile());
                                }
                            }
                        } else {
                            files = dt.files.slice();
                        }
                        if(files && files.length){
                            scope.$apply(function(){
                                var fn = $parse(attrs.ngFiledropped);
                                fn(scope,{ files: files });
                            });
                        }

                    }
                    catch(err){
                        console.log(err);
                    }
                    return false;
                });
            }
        };
    })

    // filters

    // same as php uc_words() function. capitalizes every word in string.
    // <span> {{ someProperty|uc_words }} </span> 
    .filter('uc_words', function() {
        return function(input) {
            if(typeof input != string)
                return input;
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
        return $util.approximate_count;
    }]);
    
    
}(angular,document);