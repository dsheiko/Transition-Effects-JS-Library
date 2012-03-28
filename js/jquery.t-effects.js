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

var NEXT = "next", PREV = "prev", VERTICAL = "vertical", HORIZONTAL = "horizontal", 
    DEFAULT = 'default';

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
    // Obtain an instance of the manager
    var _manager = new function() {
        return {
            node : {
                boundingBox : settings.boundingBox,
                overlay : null,
                slider : null,
                images: [],
                ceils: [], // Elements (divs) representing columns/rows of the grid
                controls: [] // 
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
            settings: {
                effect: null,
                triggerNext : function(){},
                triggerPrev : function(){},
                transitionDuration : 1, // sec
                transitionDelay : 50, // ms
                cols: 10,
                rows: 10,
                initalIndex: 0,
                dimension: 10,
                method: DEFAULT, // can be random, diagonal (for now used only on Matrix)
                controls: {
                    template: null,
                    appendTo: null
                },
                images: []
            },
            init: function() {                
                // Settings
                $.extend(this.settings, settings);
                this.node.images = this.node.boundingBox.find("img");
                this.index = this.settings.initalIndex;
                this.checkEntryConditions();
                this.updateTriggersState();
                // Driver will be available as soon as the first image of the prpvided list loaded 
                this.render(function(){
                    // Obtain an instance of driver
                    this.driver = new $.tEffects[settings.effect](this);
                    this.driver.init();
                    this.syncUI();
                });                
            },
            checkEntryConditions: function() {
                if (!this.node.images.length) {
                    throw "No images found";
                }
                if (typeof $.tEffects[settings.effect] === "undefined") {
                    throw "Given effect function not found";
                }
            },
            render : function(callback) {                   
                   // Workaround for image load event binding with IE bug
                   $(this.node.images[this.index]).attr('src', function(i, val) {
                      return val + "?v=" + (new Date()).getTime()
                    }).bind("load", this, function(e){
                       var manager = e.data;
                       // Now since we know the real size of the image (that is supposed 
                       // to be size of every enlisted image), we can specify relative vars.
                       manager.canvas = {
                           'width' : $(this).width(),
                           'height': $(this).height()
                       };                       
                       manager.node.boundingBox.css({
                           "width": manager.canvas.width,
                           "height": manager.canvas.height
                       }); 
                       if (manager.settings.controls.template !== null) {
                           manager.renderControls();
                       }
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
                var image;
                if (typeof key === "string") {
                    switch (key) {
                        case "next":
                            image = $(this.node.images[this.index + 1]);
                            break;
                        case "prev":
                            image = $(this.node.images[this.index - 1]);
                            break;
                        default:
                            throw "Insufficient key";
                    }
                } else {
                    image = $(this.node.images[typeof key !== "undefined" ? key : this.index]);
                }
                $(document).trigger("image.t-effect", [image]);
                return image;
            },
            getLinearGrid: function() {
                var html = '<div class="te-grid">';
                for (var i = 0, limit = (this.settings.direction === HORIZONTAL 
                    ? this.settings.rows : this.settings.cols); i < limit; i++) {
                    html += '<div><!-- --></div>';
                }
                return html + '</div>';
            },
            getMatrixGrid: function() {
                var html = '<div class="te-grid">';
                for (var i = 0, limit = (this.settings.dimension * this.settings.dimension); 
                    i < limit; i++) {
                    html += '<div><!-- --></div>';
                }
                return html + '</div>';
            },
            renderControls: function() {                            
                for(var i = 0, limit = this.node.images.length; i < limit; i++) {                    
                    this.node.controls[i] = $(this.settings.controls.template)
                        .appendTo(this.settings.controls.appendTo);
                    $(this.node.controls[this.index]).addClass('te-trigger-inactive');    
                    this.node.controls[i].data("index", i).bind('click.t-effect', this, function(e){                        
                        var manager = e.data, index = $(this).data("index");
                        e.preventDefault();
                        if ($(this).hasClass("te-trigger-inactive")) { return false; }                        
                        manager.invoke.apply(manager.driver, [index]);
                        manager.index = index;
                        manager.updateTriggersState();                        
                        $.each(manager.node.controls, function(){ $(this).removeClass('te-trigger-inactive');})
                        $(manager.node.controls[index]).addClass('te-trigger-inactive');
                    });
                };                
            }
        }
    }
    _manager.init();
    return _manager;
};

$.tEffects.None = function(manager) {
    var _manager = manager;
    return {
        init: function() {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + this.manager.getImage().attr('src') + ')')
                .html('');
        },        
        applyCss: function(index, callback) {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + this.manager.getImage(index).attr('src') + ')');
            callback();
        },
        applyJs: function(index, callback) {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + this.manager.getImage(index).attr('src') + ')');
            callback();
        }
    }
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
                .html('');
            _node.overlay = $('<div class="te-overlay te-transition te-opacity-min"><!-- --></div>')
                .appendTo(_node.boundingBox);
            _node.overlay
                .css3('transition-duration', manager.settings.transitionDuration + "s")
                .css3('transition-property', "opacity")
        },
        applyCss: function(index, callback) {
            var isSolid = _node.overlay.css('opacity'),
                img = manager.getImage(index);

            if (isSolid === "0") {
                _node.overlay.css('backgroundImage', 'url(' + img.attr('src') + ')');
            } else {
                _node.boundingBox.css('backgroundImage', 'url(' + img.attr('src') + ')');
            }
            _node.overlay.css3('opacity', (isSolid === "0") ? '1.0' : '0');
            window.setTimeout(callback, manager.settings.transitionDuration * 1000);
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
    var _node = manager.node, _ceil;
    return {
        init: function() {
            _cell = {
                'width' : manager.settings.direction === HORIZONTAL
                    ? manager.canvas.width  // Horizontal transition
                    : Math.ceil(manager.canvas.width / manager.settings.cols), // Vertical one
                'height' : manager.settings.direction === HORIZONTAL
                    ? Math.ceil(manager.canvas.height / manager.settings.rows)
                    : manager.canvas.height
            };
            this.isHorizontal = (manager.settings.direction === HORIZONTAL);
            this.render();
        },
        render: function() {
            _node.boundingBox
                .addClass('te-boundingBox')
                .css('overflow', "hidden")
                .css3('transition-duration', manager.settings.transitionDuration + "s")
                .html('');
            _node.slider = $('<div class="te-slider te-transition"><!-- --></div>')
                .appendTo(_node.boundingBox);
            _node.slider
                .append(_node.images)
                .css("width", manager.canvas.width * manager.node.images.length)
                .find("img").css({
                    "display": (this.isHorizontal ? "inline" : "block"),
                    "visibility": "visible"
                });
        },
        applyCss: function(index, callback) {
            _node.slider.css3("transform", "translate" + (this.isHorizontal
                ? "X" : "Y") + "(-" + (index * (this.isHorizontal
                ? manager.canvas.width : manager.canvas.height)) + "px)");
            window.setTimeout(callback, manager.settings.transitionDuration * 1000);
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
                iterations: (isHorizontal ? manager.settings.rows : manager.settings.cols),
                delay: manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Ladder = function(manager) {
    var _node = manager.node, _cell = {};
    return {
        init: function() {
            _cell = {
                'width' : manager.settings.direction === HORIZONTAL
                    ? manager.canvas.width  // Horizontal transition
                    : Math.ceil(manager.canvas.width / manager.settings.cols), // Vertical one
                'height' : manager.settings.direction === HORIZONTAL
                    ? Math.ceil(manager.canvas.height / manager.settings.rows)
                    : manager.canvas.height
            };
            this.isHorizontal = (manager.settings.direction === HORIZONTAL);
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
                "width": _cell.width * manager.settings.cols,
                "display": "block"
            });
        },
        renderCss: function() {
            var offset = 0, delay = 0, isHorizontal = this.isHorizontal
            _node.ceils.css({
                'width': isHorizontal ? 0 : _cell.width,
                'height' : isHorizontal ? _cell.height : 0
                })
                .addClass('te-transition')
                .css3('transition-duration', manager.settings.transitionDuration + "s")
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + manager.getImage().attr('src') + ')',
                        'backgroundPosition': (isHorizontal
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'
                    }).css3('transition-delay', delay + 'ms')
                    delay += manager.settings.transitionDelay;
                    offset -= (isHorizontal ? _cell.height : _cell.width);
            });
        },
        renderJs: function() {
            _node.ceils.css({
                'width': _cell.width,
                'height' : _cell.height
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
            window.setTimeout(callback, manager.settings.transitionDuration * 1000);
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
                            'backgroundPosition': (isHorizontal
                                ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                            'backgroundRepeat': 'no-repeat'
                        });
                        offset -= (isHorizontal ? _cell.height : _cell.width);
                    });
                },
                iteratedCallback: function(i){                    
                    var offsetFading = 0, offsetX = 0, offsetY = 0,
                        factor = isHorizontal 
                            ? Math.ceil(manager.canvas.width / manager.settings.rows)
                            : Math.ceil(manager.canvas.height / manager.settings.cols);
                    _node.ceils.each(function(){
                        if (isHorizontal) {
                            offsetX = (manager.canvas.width - (i * factor) - offsetFading);
                            $(this).css('backgroundPosition', (offsetX < 0 ? 0 : offsetX) + 'px '
                                + offsetY + 'px');
                            offsetY -= _cell.height;
                            offsetFading += factor;
                        } else {                            
                            offsetY = (manager.canvas.height - (i * factor) - offsetFading);
                            $(this).css('backgroundPosition', offsetX + 'px '
                                + (offsetY < 0 ? 0 : offsetY) + 'px');
                            offsetX -= _cell.width;
                            offsetFading += factor;
                        }                        
                    });
                },
                completedCallback: callback,
                iterations: (isHorizontal ? manager.settings.rows : manager.settings.cols),
                delay: manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Jalousie = function(manager) {
    var _node = manager.node, _cell= {};
    return {
        init: function() {
            _cell = {
                'width' : manager.settings.direction === HORIZONTAL
                    ? manager.canvas.width  // Horizontal transition
                    : Math.ceil(manager.canvas.width / manager.settings.cols), // Vertical one
                'height' : manager.settings.direction === HORIZONTAL
                    ? Math.ceil(manager.canvas.height / manager.settings.rows)
                    : manager.canvas.height
            };
            this.isHorizontal = (manager.settings.direction === HORIZONTAL);
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

            _node.overlay.find('div.te-grid').css({
                "width": (this.isHorizontal ? manager.canvas.width : (_cell.width * manager.settings.cols) + _cell.width),
                "height": (this.isHorizontal ? (_cell.height * manager.settings.rows) + _cell.height: manager.canvas.height),
                "display": "block"
            });
        },
        renderCss: function() {
            var offset = 0, isHorizontal = this.isHorizontal

            _node.ceils.css({
                'width': _cell.width,
                'height' : _cell.height
                })
                .addClass('te-transition')
                .css3('transition-duration', manager.settings.transitionDuration + "s")
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + manager.getImage().attr('src') + ')',
                        'backgroundPosition': (isHorizontal
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'
                    });
                    offset -= (isHorizontal ? _cell.height : _cell.width);
            });

        },
        renderJs: function() {
            _node.ceils.css(this.isHorizontal
            ? {
                'margin-top': _cell.height + "px",
                'width': manager.canvas.width,
                'height' : "0px"
            } : {
                'margin-left': _cell.width + "px",
                'width': "0px",
                'height' : manager.canvas.height
            }
            );
        },
        applyCss: function(index, callback) {
            var isOdd = _node.overlay.hasClass("te-odd"),
            origImg = manager.getImage(), newImg = manager.getImage(index);

            _node.boundingBox.css('backgroundImage',
                'url(' + (isOdd ? newImg.attr('src') : origImg.attr('src')) + ')');
            _node.ceils.css({
                  'backgroundImage': 'url(' +
                      (!isOdd ? newImg.attr('src') : origImg.attr('src'))  + ')'
            });

            // Make the transition
            if (this.isHorizontal) {
                _node.ceils.css3("transform", "scaleY(" + (isOdd ? 0 : 1) + ")");
            } else {
                _node.ceils.css3("transform", "scaleX(" + (isOdd ? 0 : 1) + ")");
            }

            _node.overlay.toggleClass("te-odd");
            window.setTimeout(callback, manager.settings.transitionDuration * 1000);
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
                            'backgroundPosition': (isHorizontal
                                ? '0px ' + offset + 'px' :
                                offset + 'px 0px'
                                ),
                            'backgroundRepeat': 'no-repeat'
                        });
                        offset -= (isHorizontal ? _cell.height : _cell.width);
                    });
                },
                iteratedCallback: function(i){
                    var progress = isHorizontal
                        ? Math.ceil(i * _cell.height / manager.settings.rows)
                        : Math.ceil(i * _cell.width / manager.settings.cols);

                    _node.ceils.each(function(){
                        $(this).css(
                        isHorizontal
                        ? {
                            "height": (progress) + "px",
                            "margin": (_cell.height - progress)  + "px 0px 0px 0px"
                        }
                        : {
                            "width": (progress) + "px",
                            "margin": "0px 0px 0px " + (_cell.width - progress)  + "px"
                        });
                    });
                },
                completedCallback: callback,
                iterations: (isHorizontal ? manager.settings.rows : manager.settings.cols),
                delay: manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Matrix = function(manager) {
    var _node = manager.node, _cell = {}, _dimension = manager.settings.dimension, _map = [];
    return {
        init: function() {
            _cell = {
                'width' : Math.ceil(manager.canvas.width / _dimension),
                'height' : Math.ceil(manager.canvas.height / _dimension)
            };
            this.render();
            var method = 'render' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method]();
        },
        render: function() {
            _node.boundingBox.css('backgroundImage', 'url(' + manager.getImage().attr('src') + ')')
                .addClass('te-boundingBox')
                .html('');

            _node.overlay = $('<div class="te-overlay te-vertical-linear-grid te-odd">' 
                + manager.getMatrixGrid() + '</div>')
                .appendTo(_node.boundingBox);
            _node.ceils = _node.overlay.find('div.te-grid > div');
            _node.ceils.css({
                "width": _cell.width,
                "height": _cell.height,
                "display": "inline-block"
            });
            // Maybe some common function
            _node.overlay.find('div.te-grid').css({
                "width": _cell.width * manager.settings.cols,
                "height": _cell.height * manager.settings.rows,
                "display": "block"
            });
        },
        renderCss: function() {
            var delay, i = 0;
            _node.ceils
                .addClass('te-transition')
                .addClass('te-opacity-min')
                .css({
                        'backgroundImage': 'url(' + manager.getImage().attr('src') + ')',
                        'backgroundRepeat': 'no-repeat'
                })
                .css3('transition-duration', manager.settings.transitionDuration + "s")
                .css3('transition-property', "opacity");
                
                for (var r = 0; r < _dimension; r++) {
                    for (var c = 0; c < _dimension; c++) {
                        if (manager.settings.method === DEFAULT) {
                            delay = Math.max(c, r)  * (manager.settings.transitionDelay * 2);
                        } else {
                            delay = Math.floor(Math.random() * _dimension * manager.settings.transitionDelay);
                        }
                        $(_node.ceils[i++]).css('backgroundPosition', "-" + (c * _cell.width) + "px " 
                            + "-" + (r * _cell.height) + "px")
                        .css3('transition-delay', delay + 'ms');
                    }
                }
        },
        renderJs: function() {
           var step, i = 0;
            _node.ceils.css({
                        'backgroundImage': 'url(' + manager.getImage().attr('src') + ')',
                        'backgroundRepeat': 'no-repeat',
                        'visibility': 'hidden'
                });
                
                for (var r = 0; r < _dimension; r++) {
                    for (var c = 0; c < _dimension; c++) {
                        if (manager.settings.method === DEFAULT) {
                            step = Math.max(c, r);
                        } else {
                            step = Math.floor(Math.random() * _dimension);
                        }
                        _map[i] = step;
                        $(_node.ceils[i++]).css('backgroundPosition', "-" + (c * _cell.width) + "px " 
                            + "-" + (r * _cell.height) + "px");
                    }
                }
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
            _node.ceils.css3('opacity', isOdd ? '1.0' : '0');
            _node.overlay.toggleClass("te-odd");
            window.setTimeout(callback, manager.settings.transitionDuration * 1000);
        },
        applyJs: function(index, callback) {
             var origImg = manager.getImage(), newImg = manager.getImage(index);
             $.aQueue.add({
                startedCallback: function(){
                    _node.boundingBox.css('backgroundImage', 'url(' + origImg.attr('src') + ')');
                    _node.ceils.each(function(){
                        $(this).css({
                            'backgroundImage': 'url(' + newImg.attr('src') + ')',
                            'visibility': 'hidden'
                        });
                    });
                },
                iteratedCallback: function(step){
                    _node.ceils.each(function(inx){
                        if (_map[inx] == (step - 1)) {
                            $(this).css('visibility', 'visible');
                        }
                    });
                },
                completedCallback: callback,
                iterations: manager.settings.dimension,
                delay: (manager.settings.transitionDelay),
                scope: this}).run();
        }
    }
}

})( jQuery );