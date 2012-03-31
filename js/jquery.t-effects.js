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
    DEFAULT = 'default', LEFT_ARROW_CODE = 37, RIGHT_ARROW_CODE = 39;

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
    var map = {}, css = typeof prop === "object" ? prop : {prop: val};
    $.each(css, function(prop, val){
        map[prop] =
        map['-moz-' + prop] =
        map['-ms-' + prop] =
        map['-o-' + prop] =
        map['-webkit-' + prop] = val;
    });    
    return $(this).css(map);
}

$.tEffects = function(settings) {
    var _handler = {
        pressKey : function(e) {
            if (e.which === LEFT_ARROW_CODE) {
                _handler.goPrev(e);
            }
            if (e.which === RIGHT_ARROW_CODE) {
                _handler.goNext(e);
            }
        },
        goNext : function(e) {
            e.preventDefault();
            if ($(this).hasClass("te-trigger-inactive")) {return false;}
            var manager = e.data;
            manager.invoke.apply(_implementor, [manager.index + 1]);
            manager.index ++;
            manager.updateTriggersState();
        },
        goPrev : function(e) {
            e.preventDefault();
            if ($(this).hasClass("te-trigger-inactive")) {return false;}
            var manager = e.data;
            manager.invoke.apply(_implementor, [manager.index - 1]);
            manager.index --;
            manager.updateTriggersState();
        },
        goChosen : function(e){
            var manager = e.data, index = $(this).data("index");
            e.preventDefault();
            if ($(this).hasClass("te-trigger-inactive")) {return false;}
            manager.invoke.apply(_implementor, [index]);
            manager.index = index;
            manager.updateTriggersState();
        }
    }
    _implementor = null,
    // Obtain an instance of the manager
    _manager = new function() {
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
                this.node.boundingBox.addClass('te-boundingBox'); 
                this.index = this.settings.initalIndex;
                this.checkEntryConditions();
                this.updateTriggersState();
                // Implementor will be available as soon as the first image of the prpvided list loaded
                this.render(function(){
                    // Obtain an instance of implementor
                    _implementor = new $.tEffects[settings.effect](this);
                    _implementor.init();
                    this.syncUI();
                });
            },
            checkEntryConditions: function() {
                if (!this.node.images.length) {
                    throw "No images found";
                }
                if (typeof $.tEffects[settings.effect] === "undefined") {
                    settings.effect = "Default";
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
                       if (_implementor === null) {
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
                if (this.node.controls.length) {
                    $.each(this.node.controls, function(){$(this).removeClass('te-trigger-inactive');})
                    $(this.node.controls[this.index]).addClass('te-trigger-inactive');
                }
            },
            invoke: function(index) {
                var method = "update" + (Util.isPropertySupported('transition') ? '' : 'Fallback');
                if (typeof this[method] !== "undefined") {
                    $(document).trigger('start-transition.t-effect', [index]);
                    this[method](index, function(){
                        $(document).trigger('end-transition.t-effect', [index]);
                    });
                }
            },
            syncUI: function() {
                $(document).bind('keydown', this, _handler.pressKey);
                if (typeof settings.triggerNext !== "undefined") {
                    $(settings.triggerNext.node).bind(settings.triggerNext.event, this, _handler.goNext);
                }
                 if (typeof settings.triggerPrev !== "undefined") {
                    $(settings.triggerPrev.node).bind(settings.triggerPrev.event, this, _handler.goPrev);
                }
            },
            destroy: function() {
                $(document).unbind('keydown', this, _handler.pressKey);
                delete _manager;
            },
            getImage: function(key) {
                if (typeof key === "string") {
                    switch (key) {
                        case "next":
                            return $(this.node.images[this.index + 1]);
                        case "prev":
                            return $(this.node.images[this.index - 1]);
                            break;
                        default:
                            throw "Insufficient key";
                    }
                }
                return $(this.node.images[typeof key !== "undefined" ? key : this.index]);
            },
            getLinearGrid: function() {
                var html = '<div class="te-grid">';
                for (var i = 0, limit = (this.settings.direction === HORIZONTAL
                    ? this.settings.rows : this.settings.cols); i < limit; i++) {
                    html += '<div><!-- --></div>';
                }
                return html + '</div>';
            },
            getCrossedGrid: function() {
                var html = '<div class="te-grid">';
                for (var i = 0, limit = (this.settings.dimension * this.settings.dimension);
                    i < limit; i++) {
                    html += '<div><!-- --></div>';
                }
                return html + '</div>';
            },
            renderOverlay: function(injectionMethod) {
              var callback = typeof injectionMethod !== "string" 
                  ? '<!-- -->' : this['get' + injectionMethod],
              gridDir =  this.settings.direction === HORIZONTAL 
                  ? 'horizontal' : 'vertical', // Crossed grid requires vertical
              gridClass = (injectionMethod in ["LinearGrid", "CrossedGrid"] ?
                  ' te-' + gridDir + '-grid' : '');
            
              return $('<div class="te-overlay' + gridClass + '">' 
                  + callback + '</div>').appendTo(this.node.boundingBox);  
            },
            renderControls: function() {
                for(var i = 0, limit = this.node.images.length; i < limit; i++) {
                    this.node.controls[i] = $(this.settings.controls.template)
                        .appendTo(this.settings.controls.appendTo);
                    $(this.node.controls[this.index]).addClass('te-trigger-inactive');
                    this.node.controls[i].data("index", i).bind('click.t-effect', this, _handler.goChosen);
                }
            },
            attachImageTo: function(nodePointer, index) {
                var node = typeof nodePointer ===  "string" ? this.node[nodePointer] : nodePointer;
                node.css('backgroundImage', 'url(' + this.getImage(index).attr('src') + ')');
                return this;
            },
            removeImages: function() {
                this.node.boundingBox.html('');
                return this;
            }
        }
    }
    _manager.init();
    return _manager;
};

$.tEffects.Default = function(manager) {
    var _manager = manager;
    return {
        init: function() {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + _manager.getImage().attr('src') + ')')
                .html('');
        },
        update: function(index, callback) {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + _manager.getImage(index).attr('src') + ')');
            callback();
        },
        updateFallback: function(index, callback) {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + _manager.getImage(index).attr('src') + ')');
            callback();
        }
    }
};

$.tEffects.FadeInOut = function(manager) {
    var _manager = manager;
    return {
        init: function() {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + _manager.getImage().attr('src') + ')')
                .addClass('te-boundingBox')
                .html('');
            _manager.node.overlay = $('<div class="te-overlay te-transition te-opacity-min"><!-- --></div>')
                .appendTo(_manager.node.boundingBox);
            _manager.node.overlay
                .css3('transition-duration', manager.settings.transitionDuration + "s")
                .css3('transition-property', "opacity")
        },
        update: function(index, callback) {
            var isSolid = _manager.node.overlay.css('opacity'),
                img = manager.getImage(index);

            if (isSolid === "0") {
                _manager.node.overlay.css('backgroundImage', 'url(' + img.attr('src') + ')');
            } else {
                _manager.node.boundingBox.css('backgroundImage', 'url(' + img.attr('src') + ')');
            }
            _manager.node.overlay.css3('opacity', (isSolid === "0") ? '1.0' : '0');
            window.setTimeout(callback, manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
            var img = manager.getImage(index);
            _manager.node.overlay.hide();
            _manager.node.overlay.css('backgroundImage', 'url(' + img.attr('src') + ')');
            _manager.node.overlay.fadeIn('slow', function() {
                _manager.node.boundingBox.css('backgroundImage', 'url(' + img.attr('src')  + ')');
                callback();
            });
        }
    }
}

$.tEffects.Deck = function(manager) {
    var _manager = manager, _dir = _manager.settings.direction, _overlay, _odd = false;
    return {        
        init: function() {
            _manager
                .attachImageTo("boundingBox")
                .removeImages();

            _overlay = _manager.renderOverlay(); 
            _overlay
                .addClass('te-transition')
                .css3({'transition-duration': manager.settings.transitionDuration + "s"});

        },
        update: function(index, callback) {
            _manager
                .attachImageTo("boundingBox", (!_odd ? index : undefined))
                .attachImageTo(_overlay, (_odd ? index : undefined));
            
            _overlay.css3({"transform":  "translate" + (_dir === HORIZONTAL
                    ? "X" : "Y") + "(" + (_odd ? "0%" : "100%") + ")"});

            _odd = !_odd;
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var iterations = 10;
             $.aQueue.add({
                startedCallback: function(){
                    _overlay.css('visibility', 'visible');
                    _manager
                        .attachImageTo("boundingBox", (!_odd ? index : undefined))
                        .attachImageTo(_overlay, (_odd ? index : undefined));
                },
                iteratedCallback: function(i){
                    var fX = Math.ceil(_manager.canvas.width / iterations * i),
                        fY = Math.ceil(_manager.canvas.height / iterations * i), x, y;
                        switch (_dir) {
                            case HORIZONTAL: 
                                x = _odd ? _manager.canvas.width - fX : fX; 
                                y = 0; break;
                            default:
                                y = _odd ? _manager.canvas.height - fY : fY;
                                x = 0;  break;
                        }
                        _overlay.css({"backgroundPosition": x + "px " + y + "px"});
                        if (_overlay.css('visibility') !== 'visible') {
                            _overlay.css('visibility', 'visible');
                        }
                },
                completedCallback: function() { 
                    _odd = !_odd;
                    callback();
                },
                iterations: iterations,
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Scroll = function(manager) {
    var _manager = manager, _cell = [];
    return {
        init: function() {
            _cell = {
                'width' : _manager.settings.direction === HORIZONTAL
                    ? _manager.canvas.width  // Horizontal transition
                    : Math.ceil(_manager.canvas.width / _manager.settings.cols), // Vertical one
                'height' : _manager.settings.direction === HORIZONTAL
                    ? Math.ceil(_manager.canvas.height / _manager.settings.rows)
                    : _manager.canvas.height
            };
            this.isHorizontal = (_manager.settings.direction === HORIZONTAL);
            this.render();
        },
        render: function() {
            _manager.node.boundingBox
                .addClass('te-boundingBox')
                .css('overflow', "hidden")
                .css3('transition-duration', _manager.settings.transitionDuration + "s")
                .html('');
            _manager.node.slider = $('<div class="te-slider te-transition"><!-- --></div>')
                .appendTo(_manager.node.boundingBox);
            _manager.node.slider
                .append(_manager.node.images)
                .css("width", _manager.canvas.width * _manager.node.images.length)
                .find("img").css({
                    "display": (this.isHorizontal ? "inline" : "block"),
                    "visibility": "visible"
                });
        },
        update: function(index, callback) {
            _manager.node.slider.css3("transform", "translate" + (this.isHorizontal
                ? "X" : "Y") + "(-" + (index * (this.isHorizontal
                ? _manager.canvas.width : _manager.canvas.height)) + "px)");
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var initX = _manager.index * _manager.canvas.width,
                 offsetX = (index * _manager.canvas.width - initX),
                 initY = _manager.index * _manager.canvas.height,
                 offsetY = (index * _manager.canvas.height - initY),
                 isHorizontal = this.isHorizontal;

             $.aQueue.add({
                startedCallback: function(){},
                iteratedCallback: function(i){
                    if (isHorizontal) {
                        _manager.node.boundingBox.scrollLeft(initX + Math.ceil(offsetX / 10 * i));
                    } else {
                        _manager.node.boundingBox.scrollTop(initY + Math.ceil(offsetY / 10 * i));
                    }
                },
                completedCallback: callback,
                iterations: (isHorizontal ? _manager.settings.rows : _manager.settings.cols),
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Ladder = function(manager) {
    var _manager = manager, _cell = {};
    return {
        init: function() {
            _cell = {
                'width' : _manager.settings.direction === HORIZONTAL
                    ? _manager.canvas.width  // Horizontal transition
                    : Math.ceil(_manager.canvas.width / _manager.settings.cols), // Vertical one
                'height' : _manager.settings.direction === HORIZONTAL
                    ? Math.ceil(_manager.canvas.height / _manager.settings.rows)
                    : _manager.canvas.height
            };
            this.isHorizontal = (_manager.settings.direction === HORIZONTAL);
            this.render();
            var method = 'render' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method]();
        },
        render: function() {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + _manager.getImage().attr('src') + ')')
                .addClass('te-boundingBox')
                .html('');

            _manager.node.overlay = $('<div class="te-overlay te-'
                + (this.isHorizontal ? 'horizontal' : 'vertical')
                + '-grid te-odd">' + _manager.getLinearGrid() + '</div>')
                .appendTo(_manager.node.boundingBox);
            _manager.node.ceils = _manager.node.overlay.find('div.te-grid > div');

            // Ceils wrapper guarantees that when column width * columns number != overlay width
            // columns are still in line
            _manager.node.overlay.find('div.te-grid').css({
                "width": _cell.width * _manager.settings.cols,
                "display": "block"
            });
        },
        renderCss: function() {
            var offset = 0, delay = 0, isHorizontal = this.isHorizontal
            _manager.node.ceils.css({
                'width': isHorizontal ? 0 : _cell.width,
                'height' : isHorizontal ? _cell.height : 0
                })
                .addClass('te-transition')
                .css3('transition-duration', _manager.settings.transitionDuration + "s")
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundPosition': (isHorizontal
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'
                    }).css3('transition-delay', delay + 'ms')
                    delay += _manager.settings.transitionDelay;
                    offset -= (isHorizontal ? _cell.height : _cell.width);
            });
        },
        renderJs: function() {
            _manager.node.ceils.css({
                'width': _cell.width,
                'height' : _cell.height
            });
        },
        update: function(index, callback) {
            var isOdd = _manager.node.overlay.hasClass("te-odd"),
            origImg = _manager.getImage(), newImg = _manager.getImage(index);

            _manager.node.boundingBox.css('backgroundImage',
                'url(' + (isOdd ? origImg.attr('src') : newImg.attr('src')) + ')');
            _manager.node.ceils.css({
                  'backgroundImage': 'url(' +
                      (!isOdd ? origImg.attr('src') : newImg.attr('src'))  + ')'
            });
            // Make the transition
            if (this.isHorizontal) {
                _manager.node.ceils.css("width", (isOdd ? _manager.canvas.width : "1px"));
            } else {
                _manager.node.ceils.css("height", (isOdd ? _manager.canvas.height : "1px"));
            }
            _manager.node.overlay.toggleClass("te-odd");
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var origImg = _manager.getImage(), newImg = _manager.getImage(index),
             isHorizontal = this.isHorizontal;
             $.aQueue.add({
                startedCallback: function(){
                    var offset = 0;
                    _manager.node.boundingBox.css('backgroundImage', 'url(' + origImg.attr('src') + ')');
                    _manager.node.ceils.each(function(){
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
                            ? Math.ceil(_manager.canvas.width / _manager.settings.rows)
                            : Math.ceil(_manager.canvas.height / _manager.settings.cols);
                    _manager.node.ceils.each(function(){
                        if (isHorizontal) {
                            offsetX = (_manager.canvas.width - (i * factor) - offsetFading);
                            $(this).css('backgroundPosition', (offsetX < 0 ? 0 : offsetX) + 'px '
                                + offsetY + 'px');
                            offsetY -= _cell.height;
                            offsetFading += factor;
                        } else {
                            offsetY = (_manager.canvas.height - (i * factor) - offsetFading);
                            $(this).css('backgroundPosition', offsetX + 'px '
                                + (offsetY < 0 ? 0 : offsetY) + 'px');
                            offsetX -= _cell.width;
                            offsetFading += factor;
                        }
                    });
                },
                completedCallback: callback,
                iterations: (isHorizontal ? _manager.settings.rows : _manager.settings.cols),
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Jaw = function(manager) {
    var _manager = manager, _dir = _manager.settings.direction, _overlay, 
        _odd = false, _cell= {}, _cells;
    return {
        init: function() {
            _cell = {
                'width' : _dir === HORIZONTAL ? _manager.canvas.width  // Horizontal transition
                    : Math.ceil(_manager.canvas.width / _manager.settings.cols), // Vertical one
                'height' : _dir === HORIZONTAL
                    ? Math.ceil(_manager.canvas.height / _manager.settings.rows)
                    : _manager.canvas.height
            };
            _manager
                .attachImageTo("boundingBox")
                .removeImages();

            _overlay = _manager.renderOverlay("LinearGrid");
            _overlay.addClass('te-' 
                + (_dir === HORIZONTAL ? 'horizontal' : 'vertical')
                + '-grid');
            _cells = _overlay.find('div.te-grid > div');

            _overlay.find('div.te-grid').css({
                "width": (this.isHorizontal ? _manager.canvas.width : (_cell.width * _manager.settings.cols) + _cell.width),
                "height": (this.isHorizontal ? (_cell.height * _manager.settings.rows) + _cell.height: _manager.canvas.height),
                "display": "block"
            });
            var method = 'render' + (Util.isPropertySupported('transform') ? '' : 'Fallback');
            this[method]();
        },
        render: function() {
            var offset = 0, isHorizontal = this.isHorizontal

            _cells.css({
                'width': _cell.width,
                'height' : _cell.height
                })
                .addClass('te-transition')
                .css3('transition-duration', _manager.settings.transitionDuration + "s")
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundPosition': (isHorizontal
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'
                    });
                    offset -= (isHorizontal ? _cell.height : _cell.width);
            });

        },
        renderFallback: function() {
            _cells.css(this.isHorizontal
            ? {
                'margin-top': _cell.height + "px",
                'width': _manager.canvas.width,
                'height' : "0px"
            } : {
                'margin-left': _cell.width + "px",
                'width': "0px",
                'height' : _manager.canvas.height
            }
            );
        },
        update: function(index, callback) {
            var isOdd = _overlay.hasClass("te-odd"),
            origImg = _manager.getImage(), newImg = _manager.getImage(index);

            _manager.node.boundingBox.css('backgroundImage',
                'url(' + (isOdd ? newImg.attr('src') : origImg.attr('src')) + ')');
            _cells.css({
                  'backgroundImage': 'url(' +
                      (!isOdd ? newImg.attr('src') : origImg.attr('src'))  + ')'
            });

            // Make the transition
            if (this.isHorizontal) {
                _cells.css3("transform", "scaleY(" + (isOdd ? 0 : 1) + ")");
            } else {
                _cells.css3("transform", "scaleX(" + (isOdd ? 0 : 1) + ")");
            }

            _overlay.toggleClass("te-odd");
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var origImg = _manager.getImage(), newImg = _manager.getImage(index),
             isHorizontal = this.isHorizontal;
             $.aQueue.add({
                startedCallback: function(){
                    var offset = 0;
                    _manager.node.boundingBox.css('backgroundImage', 'url(' + origImg.attr('src') + ')');
                    _cells.each(function(){
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
                        ? Math.ceil(i * _cell.height / _manager.settings.rows)
                        : Math.ceil(i * _cell.width / _manager.settings.cols);

                    _cells.each(function(){
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
                iterations: (isHorizontal ? _manager.settings.rows : _manager.settings.cols),
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}

$.tEffects.Jalousie = function(manager) {
    var _manager = manager, _cell= {};
    return {
        init: function() {
            _cell = {
                'width' : _manager.settings.direction === HORIZONTAL
                    ? _manager.canvas.width  // Horizontal transition
                    : Math.ceil(_manager.canvas.width / _manager.settings.cols), // Vertical one
                'height' : _manager.settings.direction === HORIZONTAL
                    ? Math.ceil(_manager.canvas.height / _manager.settings.rows)
                    : _manager.canvas.height
            };
            this.isHorizontal = (_manager.settings.direction === HORIZONTAL);
            this.render();
            var method = 'render' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method]();
        },
        render: function() {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + _manager.getImage().attr('src') + ')')
                .addClass('te-boundingBox')
                .html('');

            _manager.node.overlay = $('<div class="te-overlay te-'
                + (this.isHorizontal ? 'horizontal' : 'vertical')
                + '-grid te-odd">' + _manager.getLinearGrid() + '</div>')
                .appendTo(_manager.node.boundingBox);
            _manager.node.ceils = _manager.node.overlay.find('div.te-grid > div');

            _manager.node.overlay.find('div.te-grid').css({
                "width": (this.isHorizontal ? _manager.canvas.width : (_cell.width * _manager.settings.cols) + _cell.width),
                "height": (this.isHorizontal ? (_cell.height * _manager.settings.rows) + _cell.height: _manager.canvas.height),
                "display": "block"
            });
        },
        renderCss: function() {
            var offset = 0, isHorizontal = this.isHorizontal

            _manager.node.ceils.css({
                'width': _cell.width,
                'height' : _cell.height
                })
                .addClass('te-transition')
                .css3('transition-duration', _manager.settings.transitionDuration + "s")
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundPosition': (isHorizontal
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'
                    });
                    offset -= (isHorizontal ? _cell.height : _cell.width);
            });

        },
        renderJs: function() {
            _manager.node.ceils.css(this.isHorizontal
            ? {
                'margin-top': _cell.height + "px",
                'width': _manager.canvas.width,
                'height' : "0px"
            } : {
                'margin-left': _cell.width + "px",
                'width': "0px",
                'height' : _manager.canvas.height
            }
            );
        },
        update: function(index, callback) {
            var isOdd = _manager.node.overlay.hasClass("te-odd"),
            origImg = _manager.getImage(), newImg = _manager.getImage(index);

            _manager.node.boundingBox.css('backgroundImage',
                'url(' + (isOdd ? newImg.attr('src') : origImg.attr('src')) + ')');
            _manager.node.ceils.css({
                  'backgroundImage': 'url(' +
                      (!isOdd ? newImg.attr('src') : origImg.attr('src'))  + ')'
            });

            // Make the transition
            if (this.isHorizontal) {
                _manager.node.ceils.css3("transform", "scaleY(" + (isOdd ? 0 : 1) + ")");
            } else {
                _manager.node.ceils.css3("transform", "scaleX(" + (isOdd ? 0 : 1) + ")");
            }

            _manager.node.overlay.toggleClass("te-odd");
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var origImg = _manager.getImage(), newImg = _manager.getImage(index),
             isHorizontal = this.isHorizontal;
             $.aQueue.add({
                startedCallback: function(){
                    var offset = 0;
                    _manager.node.boundingBox.css('backgroundImage', 'url(' + origImg.attr('src') + ')');
                    _manager.node.ceils.each(function(){
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
                        ? Math.ceil(i * _cell.height / _manager.settings.rows)
                        : Math.ceil(i * _cell.width / _manager.settings.cols);

                    _manager.node.ceils.each(function(){
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
                iterations: (isHorizontal ? _manager.settings.rows : _manager.settings.cols),
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Matrix = function(manager) {
    var _manager = manager, _cell = {}, _dimension = _manager.settings.dimension, _map = [];
    return {
        init: function() {
            _cell = {
                'width' : Math.ceil(_manager.canvas.width / _dimension),
                'height' : Math.ceil(_manager.canvas.height / _dimension)
            };
            this.render();
            var method = 'render' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method]();
        },
        render: function() {
            _manager.node.boundingBox.css('backgroundImage', 'url(' + _manager.getImage().attr('src') + ')')
                .addClass('te-boundingBox')
                .html('');

            _manager.node.overlay = $('<div class="te-overlay te-vertical-grid te-odd">'
                + _manager.getCrossedGrid() + '</div>')
                .appendTo(_manager.node.boundingBox);
            _manager.node.ceils = _manager.node.overlay.find('div.te-grid > div');
            _manager.node.ceils.css({
                "width": _cell.width,
                "height": _cell.height,
                "display": "inline-block"
            });
            // Maybe some common function
            _manager.node.overlay.find('div.te-grid').css({
                "width": _cell.width * _manager.settings.cols,
                "height": _cell.height * _manager.settings.rows,
                "display": "block"
            });
        },
        renderCss: function() {
            var delay, i = 0;
            _manager.node.ceils
                .addClass('te-transition')
                .addClass('te-opacity-min')
                .css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundRepeat': 'no-repeat'
                })
                .css3('transition-duration', _manager.settings.transitionDuration + "s")
                .css3('transition-property', "opacity");

                for (var r = 0; r < _dimension; r++) {
                    for (var c = 0; c < _dimension; c++) {
                        if (_manager.settings.method === DEFAULT) {
                            delay = Math.max(c, r)  * (_manager.settings.transitionDelay * 2);
                        } else {
                            delay = Math.floor(Math.random() * _dimension * _manager.settings.transitionDelay);
                        }
                        $(_manager.node.ceils[i++]).css('backgroundPosition', "-" + (c * _cell.width) + "px "
                            + "-" + (r * _cell.height) + "px")
                        .css3('transition-delay', delay + 'ms');
                    }
                }
        },
        renderJs: function() {
           var step, i = 0;
            _manager.node.ceils.css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundRepeat': 'no-repeat',
                        'visibility': 'hidden'
                });

                for (var r = 0; r < _dimension; r++) {
                    for (var c = 0; c < _dimension; c++) {
                        if (_manager.settings.method === DEFAULT) {
                            step = Math.max(c, r);
                        } else {
                            step = Math.floor(Math.random() * _dimension);
                        }
                        _map[i] = step;
                        $(_manager.node.ceils[i++]).css('backgroundPosition', "-" + (c * _cell.width) + "px "
                            + "-" + (r * _cell.height) + "px");
                    }
                }
        },
        update: function(index, callback) {
            var isOdd = _manager.node.overlay.hasClass("te-odd"),
            origImg = _manager.getImage(), newImg = _manager.getImage(index);

            _manager.node.boundingBox.css('backgroundImage',
                'url(' + (isOdd ? origImg.attr('src') : newImg.attr('src')) + ')');
            _manager.node.ceils.css({
                  'backgroundImage': 'url(' +
                      (!isOdd ? origImg.attr('src') : newImg.attr('src'))  + ')'
            });
            // Make the transition
            _manager.node.ceils.css3('opacity', isOdd ? '1.0' : '0');
            _manager.node.overlay.toggleClass("te-odd");
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var origImg = _manager.getImage(), newImg = _manager.getImage(index);
             $.aQueue.add({
                startedCallback: function(){
                    _manager.node.boundingBox.css('backgroundImage', 'url(' + origImg.attr('src') + ')');
                    _manager.node.ceils.each(function(){
                        $(this).css({
                            'backgroundImage': 'url(' + newImg.attr('src') + ')',
                            'visibility': 'hidden'
                        });
                    });
                },
                iteratedCallback: function(step){
                    _manager.node.ceils.each(function(inx){
                        if (_map[inx] == (step - 1)) {
                            $(this).css('visibility', 'visible');
                        }
                    });
                },
                completedCallback: callback,
                iterations: _manager.settings.dimension,
                delay: (_manager.settings.transitionDelay),
                scope: this}).run();
        }
    }
}

})( jQuery );