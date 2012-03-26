/*
* Slider Transition Effects with CSS3 Shim 
*
* @package tEffects
* @author $Author: sheiko $
* @version $Id: jquery.t-effects.js, v 0.9 $
* @license GNU
* @copyright (c) Dmitry Sheiko http://www.dsheiko.com
*/
(function( $ ) {

var NEXT = "next", PREV = "prev", VERTICAL = "vartical", HORIZONTAL = "horizontal";

Util = {
    ucfirst : function(str) {
       str += '';
       return str.charAt(0).toUpperCase() + (str.substr(1).toLowerCase());
    },
    isPropertySupported: function(prop) {
        var _prop = Util.ucfirst(prop);
        return (('Webkit' + _prop) in document.body.style
            || ('Moz' + _prop) in document.body.style
            || ('O' + _prop) in document.body.style
            || ('Ms' + _prop) in document.body.style
            || prop in document.body.style);
    }      
}

$.fn.css3 = function(prop, val) {
    var map = {};
    map[prop] = 
    map['-moz-' + prop] = 
    map['-ms-' + prop] = 
    map['-o-' + prop] = 
    map['-webkit-' + prop] = val;
    return $(this).css(map); 
}

$.tEffects = function(settings) {
    var _manager = new function() {
        return {
            node : {
                boundingBox : settings.boundingBox,
                overlay : null,
                slider : null,
                images: settings.boundingBox.find("img"),
                ceils: [] // Elements (divs) representing columns/rows of the grid
            },
            index: 0,
            canvas: {
                width: 0,
                height: 0
            },
            ceil: {
                width: 0,
                height: 0
            },
            listLength: 0,
            driver: null,
            duration: 1, // sec
            delay: 50, // ms
            cols: 10,
            rows: 10,
            direction: VERTICAL,
            init: function() {
                this.listLength = this.node.images.length;
                // Settings
                this.duration = settings.transitionDuration || this.duration;
                this.delay = settings.transitionDelay || this.delay;
                this.cols = settings.cols || this.cols;
                this.rows = settings.rows || this.rows;
                this.direction = settings.direction || this.direction;
                
                this.checkEntryConditions();                
                this.render(function() {
                    this.driver = new $.tEffects[settings.effect](this);
                    this.driver.init();                    
                    this.syncUI();
                });
            },
            checkEntryConditions: function() {
                if (!this.listLength) {
                    throw "No images found";
                }
                if (typeof $.tEffects[settings.effect] === "undefined") {
                    throw "Given effect function not found";
                }
            },
            render : function(callback) {                   
                   this.updateTriggersState();
                   // Workaround for image load event binding with IE bug
                   $(this.node.images[0]).attr('src', function(i, val) {
                      return val + "?v=" + (new Date()).getTime()
                    }).bind("load", this, function(e){
                       var manager = e.data;
                       manager.canvas = {
                           'width' : $(this).width(),
                           'height': $(this).height()
                       };
                       manager.ceil = {
                           'width' : manager.direction === HORIZONTAL
                               ? $(this).width()  // Horizontal transition
                               : Math.ceil($(this).width() / manager.cols), // Vertical one
                           'height' : manager.direction === HORIZONTAL
                               ? Math.ceil($(this).height() / manager.rows) 
                               : $(this).height()
                       };
                       manager.node.boundingBox.css({
                           "width": manager.canvas.width,
                           "height": manager.canvas.height
                       });                       
                       if (manager.driver === null) {
                            callback.apply(manager, arguments);
                       }
                   });
                   
            },
            isset : function(val) {
                return (typeof val !== "undefined");
            },
            updateTriggersState: function() {
                if (this.isset(settings.triggerNext)) {
                    $(settings.triggerNext.node)[(this.getImage(NEXT).length 
                            ? "removeClass" : "addClass")]("te-trigger-inactive");
                }
                if (this.isset(settings.triggerPrev)) {                    
                    $(settings.triggerPrev.node)[(this.getImage(PREV).length 
                            ? "removeClass" : "addClass")]("te-trigger-inactive");
                }
            },
            invoke: function(index) {
                var method = "apply" + (Util.isPropertySupported('transition') ? 'Css' : 'Js');
                if (typeof this[method] !== "undefined") {
                    this[method](index, function(){
                        $(document).trigger('apply.t-effect', [index]);
                    });    
                }
            },
            syncUI : function() {
                if (typeof settings.triggerNext !== "undefined") {
                    $(settings.triggerNext.node).bind(settings.triggerNext.event, this, function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("te-trigger-inactive")) { return false; }
                        var manager = e.data;                        
                        manager.invoke.apply(manager.driver, [manager.index + 1]);                   
                        manager.index ++;
                        manager.updateTriggersState();
                    });
                }
                 if (typeof settings.triggerPrev !== "undefined") {
                    $(settings.triggerPrev.node).bind(settings.triggerPrev.event, this, function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("te-trigger-inactive")) { return false; }
                        var manager = e.data;
                        manager.invoke.apply(manager.driver, [manager.index - 1]);
                        manager.index --;
                        manager.updateTriggersState();
                    });
                }
            },
            getImage: function(key) {
                if (typeof key === "string") {
                    switch (key) {
                        case "next":
                            return $(this.node.images[this.index + 1]);
                        case "prev":
                            return $(this.node.images[this.index - 1]);
                        default:
                            throw "Insufficient key";
                    }
                }                
                return $(this.node.images[typeof key !== "undefined" ? key : this.index]);                
            },
            getLinearGrid: function() {
                var html = '<div class="te-grid">';
                for (var i = 0; i < this.cols; i++) {
                    html += '<div><!-- --></div>';
                }
                return html + '</div>';
            }            
        }
    }
    _manager.init();
};

$.tEffects.FadeInOut = function(manager) {
    var _node = manager.node;
    return {
        init: function() {
            this.manager = manager;
            this.render();
        },
        render: function() {            
            _node.boundingBox.css('backgroundImage', 'url(' + this.manager.getImage().attr('src') + ')')
                .addClass('te-boundingBox')
                .css3('transition-duration', manager.duration + "s");
            _node.overlay = $('<div class="te-overlay te-transition te-opacity-min"><!-- --></div>')
                .appendTo(_node.boundingBox);
        },        
        applyCss: function(index, callback) {            
            var isSolid = _node.overlay.css('opacity'), 
                img = manager.getImage(index);
                
            if (isSolid === "0") {
                _node.overlay.css('backgroundImage', 'url(' + img.attr('src') + ')');                 
            } else {
                _node.boundingBox.css('backgroundImage', 'url(' + img.attr('src') + ')');           
            }
            _node.overlay.css('opacity', (isSolid === "0") ? '1.0' : '0');
            window.setTimeout(callback, manager.duration * 1000);
        },
        applyJs: function(index, callback) {
            var img = manager.getImage(index);
            _node.overlay.hide();
            _node.overlay.css('backgroundImage', 'url(' + img.attr('src') + ')');
            _node.overlay.fadeIn('slow', function() {
                _node.boundingBox.css('backgroundImage', 'url(' + img.attr('src')  + ')');
                callback(); 
            });
        }
    }
}

$.tEffects.Scroll = function(manager) {
    var _node = manager.node;
    return {
        init: function() {
            this.isHorizontal = (manager.direction === HORIZONTAL);
            this.render();
        },
        render: function() {            
            _node.boundingBox
                .addClass('te-boundingBox')
                .css('overflow', "hidden")
                .css3('transition-duration', manager.duration + "s")
                .html('');
            _node.slider = $('<div class="te-slider te-transition"><!-- --></div>')
                .appendTo(_node.boundingBox);
            _node.slider
                .append(_node.images)
                .css("width", manager.canvas.width * manager.listLength)
                .find("img").css({
                    "display": (this.isHorizontal ? "inline" : "block"),
                    "visibility": "visible"
                });   
        },
        applyCss: function(index, callback) {
            _node.slider.css3("transform", "translate" + (this.isHorizontal 
                ? "X" : "Y") + "(-" + (index * (this.isHorizontal 
                ? manager.canvas.width : manager.canvas.height)) + "px)");
            window.setTimeout(callback, manager.duration * 1000);
        },
        applyJs: function(index, callback) {
             var initX = manager.index * manager.canvas.width, 
                 offsetX = (index * manager.canvas.width - initX),
                 initY = manager.index * manager.canvas.height, 
                 offsetY = (index * manager.canvas.height - initY),
                 isHorizontal = this.isHorizontal;
                 
             $.aQueue.add({
                startedCallback: function(){},
                iteratedCallback: function(i){                    
                    if (isHorizontal) {
                        _node.boundingBox.scrollLeft(initX + Math.ceil(offsetX / 10 * i));
                    } else {
                        _node.boundingBox.scrollTop(initY + Math.ceil(offsetY / 10 * i));
                    }
                },
                completedCallback: callback,
                iterations: (isHorizontal ? manager.rows : manager.cols),
                delay: manager.delay,
                scope: this}).run();
        }
    }
}


$.tEffects.Ladder = function(manager) {
    var _node = manager.node;
    return {
        init: function() {
            this.isHorizontal = (manager.direction === HORIZONTAL);            
            this.render();
            var method = 'render' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method]();
        },
        render: function() {
            _node.boundingBox.css('backgroundImage', 'url(' + manager.getImage().attr('src') + ')')
                .addClass('te-boundingBox')
                .html('');
                
            _node.overlay = $('<div class="te-overlay te-' 
                + (this.isHorizontal ? 'horizontal' : 'vertical')
                + '-linear-grid te-odd">' + manager.getLinearGrid() + '</div>')
                .appendTo(_node.boundingBox);            
            _node.ceils = _node.overlay.find('div.te-grid > div');
                        
            // Ceils wrapper guarantees that when column width * columns number != overlay width
            // columns are still in line
            _node.overlay.find('div.te-grid').css({
                "width": manager.ceil.width * manager.cols,
                "display": "block"
            });                        
        },
        renderCss: function() {
            var offset = 0, delay = 0, isHorizontal = this.isHorizontal
            _node.ceils.css({
                'width': isHorizontal ? 0 : manager.ceil.width,
                'height' : isHorizontal ? manager.ceil.height : 0
                })
                .addClass('te-transition')
                .css3('transition-duration', manager.duration + "s")                
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + manager.getImage().attr('src') + ')',
                        'backgroundPosition': (isHorizontal 
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'                          
                    }).css3('transition-delay', delay + 'ms')
                    delay += manager.delay;
                    offset -= (isHorizontal ? manager.ceil.height : manager.ceil.width);
            });
        },
        renderJs: function() {
            _node.ceils.css({
                'width': manager.ceil.width,
                'height' : manager.canvas.height
            });
        },        
        applyCss: function(index, callback) {
            var isOdd = _node.overlay.hasClass("te-odd"),
            origImg = manager.getImage(), newImg = manager.getImage(index);
            
            _node.boundingBox.css('backgroundImage', 
                'url(' + (isOdd ? origImg.attr('src') : newImg.attr('src')) + ')');
            _node.ceils.css({
                  'backgroundImage': 'url(' + 
                      (!isOdd ? origImg.attr('src') : newImg.attr('src'))  + ')'
            });
            // Make the transition
            if (this.isHorizontal) {
                _node.ceils.css("width", (isOdd ? manager.canvas.width : "1px"));
            } else {                
                _node.ceils.css("height", (isOdd ? manager.canvas.height : "1px"));
            }
            _node.overlay.toggleClass("te-odd");
            window.setTimeout(callback, manager.duration * 1000);
        },
        applyJs: function(index, callback) {
             var origImg = manager.getImage(), newImg = manager.getImage(index),
             isHorizontal = this.isHorizontal;
             $.aQueue.add({
                startedCallback: function(){
                    var offset = 0;
                    _node.boundingBox.css('backgroundImage', 'url(' + origImg.attr('src') + ')');
                    _node.ceils.each(function(){
                        $(this).css({
                            'backgroundImage': 'url(' + newImg.attr('src') + ')',
                            'backgroundPosition': offset + 'px ' + manager.canvas.height + 'px',
                            'backgroundRepeat': 'no-repeat'                          
                        });
                        offset -= manager.ceil.width;                
                    });
                },
                iteratedCallback: function(i){                    
                    var offsetFading = 0, offsetX = 0, offsetY = 0, 
                        factor = Math.ceil(manager.canvas.height / manager.cols);
                    
                    _node.ceils.each(function(){
                        offsetY = (manager.canvas.height - (i * factor) - offsetFading);
                        $(this).css('backgroundPosition', offsetX + 'px ' 
                            + (offsetY < 0 ? 0 : offsetY) + 'px');    
                        offsetX -= manager.ceil.width;
                        offsetFading += factor;
                    });                    
                },
                completedCallback: callback,
                iterations: (isHorizontal ? manager.rows : manager.cols),
                delay: manager.delay,
                scope: this}).run();
        }
    }
}

})( jQuery );