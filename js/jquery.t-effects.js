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
    var map = {}, css = typeof prop === "object" ? prop :
        (function(){var css = {}; css[prop] = val; return css;}());

    $.each(css, function(prop, val){
        map[prop] =
        map['-moz-' + prop] =
        map['-ms-' + prop] =
        map['-o-' + prop] =
        map['-webkit-' + prop] = val;
    });
    return $(this).css(map);
}
$.fn.tEffects = function(settings) {
    settings.boundingBox = $(this);
    return $.tEffects(settings);
};
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
                this.setup(settings);
                this.node.images = this.settings.images.length ? this.settings.images 
                    : this.node.boundingBox.find("img");
                this.node.boundingBox.addClass('te-boundingBox');                
                this.checkEntryConditions();
                this.updateTriggersState();
                // Implementor will be available as soon as the first image of the prpvided list loaded
                this.render(function(){
                    // Obtain an instance of implementor
                    _implementor = new $.tEffects[settings.effect](this);
                    _implementor.init();
                });
            },
            setup: function(settings) {
                // Settings
                $.extend(this.settings, settings);
                this.index = this.settings.initalIndex;
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
                    var run = function(e){
                       var manager = e.data;
                       $(this).data('state', 'loaded');
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
                       manager.node.images.css({'visibility' : 'visible'});
                       // Remove images
                       manager.node.boundingBox.html('');
                       if (_implementor === null) {
                            callback.apply(manager, arguments);
                       }
                   }
                   // We know image size only when have it fully loaded
                   if (this.node.images[this.index].data('state') === 'loaded') {
                        run();
                   } else {
                       // Workaround for image load event binding with IE bug
                       $(this.node.images[this.index]).attr('src', function(i, val) {
                          return val + "?v=" + (new Date()).getTime()
                        }).bind("load", this, run);
                   }

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
            enable: function() {
                $(document).bind('keydown', this, _handler.pressKey);
                if (typeof settings.triggerNext !== "undefined") {
                    $(settings.triggerNext.node).bind(settings.triggerNext.event, this, _handler.goNext);
                }
                if (typeof settings.triggerPrev !== "undefined") {
                    $(settings.triggerPrev.node).bind(settings.triggerPrev.event, this, _handler.goPrev);
                }
            },
            disable: function() {
                $(document).unbind('keydown', this, _handler.pressKey);
                if (typeof settings.triggerNext !== "undefined") {
                    $(settings.triggerNext.node).unbind(settings.triggerNext.event, _handler.goNext);
                }
                if (typeof settings.triggerPrev !== "undefined") {
                    $(settings.triggerPrev.node).unbind(settings.triggerPrev.event, _handler.goPrev);
                }
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
            getLinearGridCellSize : function() {
                var _dir = this.settings.direction;
                return  {
                    'width' : _dir === HORIZONTAL ? this.canvas.width  // Horizontal transition
                        : Math.ceil(this.canvas.width / this.settings.cols), // Vertical one
                    'height' : _dir === HORIZONTAL
                        ? Math.ceil(this.canvas.height / this.settings.rows)
                        : this.canvas.height
                };
            },
            getLinearGrid: function() {
                var html = '<div class="te-grid">';
                for (var i = 0, limit = (this.settings.direction === HORIZONTAL
                    ? this.settings.rows : this.settings.cols); i < limit; i++) {
                    html += '<div class="te-' + (i % 2 ? 'even' : 'odd') + '"><!-- --></div>';
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
              gridClass = (injectionMethod in {"LinearGrid": 1, "CrossedGrid": 1} ?
                  ' te-' + gridDir + '-grid' : '');
              return $('<div class="te-overlay' + gridClass + '">'
                  + (typeof callback === "string" ? callback : callback.call(this))
                  + '</div>').appendTo(this.node.boundingBox);
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
            _manager.attachImageTo("boundingBox");
        },
        update: function(index, callback) {
            _manager.attachImageTo("boundingBox", index);
            callback();
        },
        updateFallback: function(index, callback) {
            _manager.attachImageTo("boundingBox", index);
            callback();
        }
    }
};

$.tEffects.FadeInOut = function(manager) {
    var _manager = manager, _overlay;
    return {
        init: function() {
            _manager.attachImageTo("boundingBox");

            _overlay = _manager.renderOverlay();
            _overlay
                .addClass('te-transition')
                .css3({
                    'transition-duration': manager.settings.transitionDuration + "s",
                    'transition-property': "opacity",
                    'opacity' : "0"
                });
        },
        update: function(index, callback) {
            var isSolid = _overlay.css('opacity');
            if (isSolid === "0") {
                _manager.attachImageTo(_overlay, index);
            } else {
                _manager.attachImageTo("boundingBox", index);
            }
            _overlay.css3('opacity', (isSolid === "0") ? '1.0' : '0');
            window.setTimeout(callback, manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
            _overlay
                .hide()
                .css('backgroundImage', 'url(' + _manager.getImage(index).attr('src') + ')')
                .fadeIn('slow', function() {
                    _manager.attachImageTo(_overlay, index);
                callback();
            });
        }
    }
}

$.tEffects.Deck = function(manager) {
    var _manager = manager, _dir = _manager.settings.direction, _overlay, _reverse = false;
    return {
        init: function() {
            _manager.attachImageTo("boundingBox");

            _overlay = _manager.renderOverlay();
            _overlay
                .addClass('te-transition')
                .css3({'transition-duration': manager.settings.transitionDuration + "s"});

        },
        update: function(index, callback) {
            _manager
                .attachImageTo("boundingBox", (!_reverse ? index : undefined))
                .attachImageTo(_overlay, (_reverse ? index : undefined));

            _overlay.css3({"transform":  "translate" + (_dir === HORIZONTAL
                    ? "X" : "Y") + "(" + (_reverse ? "0%" : "100%") + ")"});

            _reverse = !_reverse;
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var iterations = 10;
             $.aQueue.add({
                startedCallback: function(){
                    _overlay.css('visibility', 'visible');
                    _manager
                        .attachImageTo("boundingBox", (!_reverse ? index : undefined))
                        .attachImageTo(_overlay, (_reverse ? index : undefined));
                },
                iteratedCallback: function(i){
                    var fX = Math.ceil(_manager.canvas.width / iterations * i),
                        fY = Math.ceil(_manager.canvas.height / iterations * i), x, y;
                        switch (_dir) {
                            case HORIZONTAL:
                                x = _reverse ? _manager.canvas.width - fX : fX;
                                y = 0;break;
                            default:
                                y = _reverse ? _manager.canvas.height - fY : fY;
                                x = 0;break;
                        }
                        _overlay.css({"backgroundPosition": x + "px " + y + "px"});
                        if (_overlay.css('visibility') !== 'visible') {
                            _overlay.css('visibility', 'visible');
                        }
                },
                completedCallback: function() {
                    _reverse = !_reverse;
                    callback();
                },
                iterations: iterations,
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Scroll = function(manager) {
    var _manager = manager, _cell = [], _dir = _manager.settings.direction, _slider;
    return {
        init: function() {
            _cell = _manager.getLinearGridCellSize();
            _manager.attachImageTo("boundingBox");

            _slider = $('<div class="te-slider te-transition"><!-- --></div>')
                .appendTo(_manager.node.boundingBox);
            _slider
                .append(_manager.node.images)
                .css("width", _manager.canvas.width * _manager.node.images.length)
                .find("img").css({
                    "display": (_dir === HORIZONTAL ? "inline" : "block"),
                    "visibility": "visible"
                });
        },
        update: function(index, callback) {
            _slider.css3("transform", "translate" + (_dir === HORIZONTAL
                ? "X" : "Y") + "(-" + (index * (_dir === HORIZONTAL
                ? _manager.canvas.width : _manager.canvas.height)) + "px)");
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             var initX = _manager.index * _manager.canvas.width,
                 offsetX = (index * _manager.canvas.width - initX),
                 initY = _manager.index * _manager.canvas.height,
                 offsetY = (index * _manager.canvas.height - initY);

             $.aQueue.add({
                startedCallback: function(){},
                iteratedCallback: function(i){
                    if (_dir === HORIZONTAL) {
                        _manager.node.boundingBox.scrollLeft(initX + Math.ceil(offsetX / 10 * i));
                    } else {
                        _manager.node.boundingBox.scrollTop(initY + Math.ceil(offsetY / 10 * i));
                    }
                },
                completedCallback: callback,
                iterations: (_dir === HORIZONTAL ? _manager.settings.rows : _manager.settings.cols),
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}


$.tEffects.Ladder = function(manager) {
    var _manager = manager, _cell, _cells, _dir = _manager.settings.direction, _overlay,
        _reverse = false;
    return {
        init: function() {
            _cell = _manager.getLinearGridCellSize();
            _manager.attachImageTo("boundingBox");
            _overlay = _manager.renderOverlay("LinearGrid");
            _cells = _overlay.find('div.te-grid > div');
            // Ceils wrapper guarantees that when column width * columns number != overlay width
            // columns are still in line
            _overlay.find('div.te-grid').css({
                "width": _cell.width * _manager.settings.cols,
                "display": "block"
            });
            var method = 'render' + (Util.isPropertySupported('transform') ? '' : 'Fallback');
            this[method]();
        },
        render: function() {
            var offset = 0, delay = 0;
            _cells.css({
                'width': _dir === HORIZONTAL ? 0 : _cell.width,
                'height' : _dir === HORIZONTAL ? _cell.height : 0
                })
                .addClass('te-transition')
                .css3('transition-duration', _manager.settings.transitionDuration + "s")
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundPosition': (_dir === HORIZONTAL
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'
                    }).css3('transition-delay', delay + 'ms')
                    delay += _manager.settings.transitionDelay;
                    offset -= (_dir === HORIZONTAL ? _cell.height : _cell.width);
            });
        },
        renderFallback: function() {
            _cells.css({
                'width': _cell.width,
                'height': _cell.height                        
            });
        },
        update: function(index, callback) {
            _manager
                .attachImageTo("boundingBox", (_reverse ? index : undefined))
                .attachImageTo(_cells, (!_reverse ? index : undefined));

            // Make the transition
            if (_dir === HORIZONTAL) {
                _cells.css("width", (_reverse ? "1px" :  _manager.canvas.width));
            } else {
                _cells.css("height", (_reverse ? "1px" : _manager.canvas.height));
            }
            _reverse = !_reverse;
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             $.aQueue.add({
                startedCallback: function(){
                    var offset = 0;
                    _manager
                        .attachImageTo("boundingBox", !_reverse ? undefined : index);
                    _cells.each(function(){
                        $(this).css({
                            'backgroundImage': 'url(' + _manager.getImage(_reverse ? undefined : index).attr('src') + ')',
                            'backgroundPosition': (_dir === HORIZONTAL
                                ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                            'backgroundRepeat': 'no-repeat'
                        });
                        offset -= (_dir === HORIZONTAL ? _cell.height : _cell.width);
                    });
                    _cells.css(_dir === HORIZONTAL 
                        ? {'width': _reverse ? _cell.width : 0}
                        : {'height': _reverse ? _cell.height : 0}                        
                    );
                },
                iteratedCallback: function(i){
                    var val, factor = _dir === HORIZONTAL
                            ? Math.ceil(_manager.canvas.width / _manager.settings.rows)
                            : Math.ceil(_manager.canvas.height / _manager.settings.cols);

                    _cells.each(function(inx){
                           val = (factor * i) - (inx * factor);
                           if (_dir === HORIZONTAL) {
                               $(this).css('width',
                               _reverse ?
                                    ((_manager.canvas.width - val > 0)  ? _manager.canvas.width - val : 0) :
                                    (val > _manager.canvas.width ? _manager.canvas.width : val)
                                );
                           } else {
                                $(this).css('height',
                                    _reverse ?
                                    ((_manager.canvas.height - val > 0)  ? _manager.canvas.height - val : 0) :
                                    (val > _manager.canvas.height ? _manager.canvas.height : val)
                                );
                           }
                    });
                },
                completedCallback: function() {
                    _reverse = !_reverse;
                    callback();
                },
                iterations: (_dir === HORIZONTAL ? _manager.settings.rows : _manager.settings.cols) *  2,
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}

$.tEffects.Jaw = function(manager) {
    var _manager = manager, _dir = _manager.settings.direction, _overlay,
        _reverse = false, _cell= {}, _cells, _oddCells, _evenCells;
    return {
        init: function() {
            var render = new $.tEffects.Jalousie(manager);
            render.init();
            _cell = _manager.getLinearGridCellSize();
            _overlay = _manager.node.boundingBox.find('div.te-overlay');
            _cells = _overlay.find('div.te-grid > div');
            _oddCells = _overlay.find('div.te-grid > div.te-odd');
            _evenCells = _overlay.find('div.te-grid > div.te-even');
            // Override renderFallback of $.tEffects.Jalousie
            if (!Util.isPropertySupported('transform')) {
                _cells.css({
                    'margin': "0px",
                    'width' : _cell.width,
                    'height': _cell.height
                });
            }
        },
        update: function(index, callback) {
            _manager
                .attachImageTo("boundingBox", (!_reverse ? index : undefined))
                .attachImageTo(_cells, (_reverse ? index : undefined));

            // Make the transition
            var Axis = _dir === HORIZONTAL ? "X" : "Y";
            _evenCells.css3("transform", "translate" + Axis
                + "(" + (_reverse ? 0 : "-100") + "%)");
            _oddCells.css3("transform", "translate" + Axis
                + "(" + (_reverse ? 0 : 100) + "%)");

            _reverse = !_reverse;
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             $.aQueue.add({
                startedCallback: function(){
                    var offset = 0;
                    _manager.attachImageTo("boundingBox");
                    _cells.each(function(){
                        var isOdd = $(this).hasClass("te-odd"),
                        x = isOdd ? _cell.width : 0 - _cell.width,
                        y = isOdd ? _cell.height : 0 - _cell.height;

                        $(this).css({
                            'backgroundImage': 'url('
                                + _manager.getImage(index).attr('src') + ')',
                            'backgroundPosition': (_dir === HORIZONTAL
                                ? x + 'px ' + offset + 'px' : offset + 'px ' + y + 'px'),
                            'backgroundRepeat': 'no-repeat'
                        });
                        offset -= (_dir === HORIZONTAL ? _cell.height : _cell.width);
                    });
                },
                iteratedCallback: function(i){
                    var progress = _dir !== HORIZONTAL
                        ? Math.ceil(i * _cell.height / _manager.settings.rows)
                        : Math.ceil(i * _cell.width / _manager.settings.cols),
                        offset = 0;


                    _cells.each(function(){
                        var isOdd = $(this).hasClass("te-odd"),
                        x = isOdd ? (_cell.width - progress) : (progress - _cell.width),
                        y = isOdd ? (_cell.height - progress) : (progress - _cell.height);

                        $(this).css({
                            'backgroundImage': 'url('
                                + _manager.getImage(index).attr('src') + ')',
                            'backgroundPosition': (_dir === HORIZONTAL
                                ?  x + 'px ' + offset + 'px' : offset + 'px ' + y + 'px'),
                            'backgroundRepeat': 'no-repeat'
                        });
                        offset -= (_dir === HORIZONTAL ? _cell.height : _cell.width);

                    });
                },
                completedCallback: callback,
                iterations: (_dir === HORIZONTAL ? _manager.settings.rows : _manager.settings.cols),
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }

};
$.tEffects.Jalousie = function(manager) {
    var _manager = manager, _dir = _manager.settings.direction, _overlay,
        _reverse = false, _cell= {}, _cells;
    return {
        init: function() {
            _cell = _manager.getLinearGridCellSize();
            _manager.attachImageTo("boundingBox");

            _overlay = _manager.renderOverlay("LinearGrid");
            _cells = _overlay.find('div.te-grid > div');
            // When through the rounding of float numbers we lose pixels,
            // let's make sure cell's parent box enough wide and high
            _overlay.find('div.te-grid').css({
                "width": (_dir === HORIZONTAL ? _manager.canvas.width
                    : (_cell.width * _manager.settings.cols) + _cell.width),
                "height": (_dir === HORIZONTAL ? (_cell.height
                    * _manager.settings.rows) + _cell.height: _manager.canvas.height),
                "display": "block"
            });
            var method = 'render' + (Util.isPropertySupported('transform') ? '' : 'Fallback');
            this[method]();
        },
        render: function() {
            var offset = 0;

            _cells.css({
                'width': _cell.width,
                'height' : _cell.height
                })
                .addClass('te-transition')
                .css3('transition-duration', _manager.settings.transitionDuration + "s")
                .each(function(){
                    $(this).css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundPosition': (_dir === HORIZONTAL
                            ? ('0px ' + offset + 'px') : (offset + 'px 0px')),
                        'backgroundRepeat': 'no-repeat'
                    });
                    offset -= (_dir === HORIZONTAL ? _cell.height : _cell.width);
            });

        },
        renderFallback: function() {
            _cells.css(_dir === HORIZONTAL
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
            _manager
                .attachImageTo("boundingBox", (!_reverse ? index : undefined))
                .attachImageTo(_cells, (_reverse ? index : undefined));

            // Make the transition
            if (_dir === HORIZONTAL) {
                _cells.css3("transform", "scaleY(" + (_reverse ? 1 : 0) + ")");
            } else {
                _cells.css3("transform", "scaleX(" + (_reverse ? 1 : 0) + ")");
            }

            _reverse = !_reverse;
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             $.aQueue.add({
                startedCallback: function(){
                    var offset = 0;
                    _manager.attachImageTo("boundingBox");
                    _cells.each(function(){
                        $(this).css({
                            'backgroundImage': 'url('
                                + _manager.getImage(index).attr('src') + ')',
                            'backgroundPosition': (_dir === HORIZONTAL
                                ? '0px ' + offset + 'px' : offset + 'px 0px'),
                            'backgroundRepeat': 'no-repeat'
                        });
                        offset -= (_dir === HORIZONTAL ? _cell.height : _cell.width);
                    });
                },
                iteratedCallback: function(i){
                    var progress = _dir === HORIZONTAL
                        ? Math.ceil(i * _cell.height / _manager.settings.rows)
                        : Math.ceil(i * _cell.width / _manager.settings.cols);

                    _cells.each(function(){
                        $(this).css(
                        _dir === HORIZONTAL
                        ? {
                            "height": (progress) + "px",
                            "margin": (_cell.height - progress)  + "px 0px 0px 0px"
                        } : {
                            "width": (progress) + "px",
                            "margin": "0px 0px 0px " + (_cell.width - progress)  + "px"
                        });
                    });
                },
                completedCallback: callback,
                iterations: (_dir === HORIZONTAL ? _manager.settings.rows : _manager.settings.cols),
                delay: _manager.settings.transitionDelay,
                scope: this}).run();
        }
    }
}

$.tEffects.RandomCells = function(manager) {
    manager.settings.method = 'random';
    return $.tEffects.DiagonalCells(manager);
};

$.tEffects.DiagonalCells = function(manager) {
    var _manager = manager, _cell, _cells, _dimension = _manager.settings.dimension, _map = [], 
        _overlay, _reverse = false;
    return {
        init: function() {
            _cell = {
                'width' : Math.ceil(_manager.canvas.width / _dimension),
                'height' : Math.ceil(_manager.canvas.height / _dimension)
            };
            _manager.settings.direction = null;
            _manager.attachImageTo("boundingBox");
            _overlay = _manager.renderOverlay("CrossedGrid");            
            _cells = _overlay.find('div.te-grid > div');
            _cells.css({
                "width": _cell.width,
                "height": _cell.height,
                "display": "inline-block"
            });
            _overlay.find('div.te-grid').css({
                "width": _cell.width * _dimension,
                "height": _cell.height * _dimension,
                "display": "block"
            });
            var method = 'render' + (Util.isPropertySupported('transform') ? '' : 'Fallback');
            this[method]();
        },
        render: function() {
            var delay, i = 0;
            _cells
                .addClass('te-transition')                
                .css3({
                    'transition-duration': _manager.settings.transitionDuration + "s", 
                    'transition-property': "opacity",
                    'opacity': "1.0"
                }).css({
                        'backgroundImage': 'url(' + _manager.getImage().attr('src') + ')',
                        'backgroundRepeat': 'no-repeat'
                });

                for (var r = 0; r < _dimension; r++) {
                    for (var c = 0; c < _dimension; c++) {
                        if (_manager.settings.method === DEFAULT) {
                            delay = Math.max(c, r)  * (_manager.settings.transitionDelay * 2);
                        } else {
                            delay = Math.floor(Math.random() * _dimension 
                                * _manager.settings.transitionDelay);
                        }
                        $(_cells[i++])
                            .css('backgroundPosition', "-" + (c * _cell.width) + "px "
                                + "-" + (r * _cell.height) + "px")
                        .css3('transition-delay', delay + 'ms');
                    }
                }
        },
        renderFallback: function() {
           var step, i = 0;
            _cells.css({
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
                        $(_cells[i++]).css('backgroundPosition', "-" + (c * _cell.width) + "px "
                            + "-" + (r * _cell.height) + "px");
                    }
                }
        },
        update: function(index, callback) {
            _manager
                .attachImageTo("boundingBox", (!_reverse ? index : undefined))
                .attachImageTo(_cells, (_reverse ? index : undefined));

            // Make the transition
            _cells.css3('opacity', _reverse ? '1.0' : '0');
            _reverse = !_reverse;
            window.setTimeout(callback, _manager.settings.transitionDuration * 1000);
        },
        updateFallback: function(index, callback) {
             $.aQueue.add({
                startedCallback: function(){
                    _manager.attachImageTo("boundingBox");
                    _cells.each(function(){
                        $(this).css({
                            'backgroundImage': 'url(' + _manager.getImage(index).attr('src') + ')',
                            'visibility': 'hidden'
                        });
                    });
                },
                iteratedCallback: function(step){
                    _cells.each(function(inx){
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