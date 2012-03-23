/*
* HTML5 Form Shim
*
* @package HTML5 Form Shim
* @author $Author: sheiko $
* @version $Id: jquery.html5form.js, v 0.9 $
* @license GNU
* @copyright (c) Dmitry Sheiko http://www.dsheiko.com
*/
(function( $ ) {

var NEXT = "next", PREV = "prev";

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
            || prop in document.body.style);
    }
}

$.tEffects = function(settings) {
    var _manager = new function() {
        return {
            node : {
                boundingBox : settings.boundingBox,
                overlay : null,
                slider : null,
                images: settings.boundingBox.find("img")
            },
            index: 0,
            canvas: {
                width: 0,
                height: 0
            },
            listLength: 0,
            driver: null,
            duration: 1, // sec
            init: function() {
                this.listLength = this.node.images.length;
                this.duration = settings.duration || 1;
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
                       e.data.canvas.width = $(this).width();
                       e.data.canvas.height = $(this).height();
                       e.data.node.boundingBox.css("width", e.data.canvas.width).css("height", e.data.canvas.height);
                       if (e.data.driver === null) {
                            callback.apply(e.data, arguments);
                       }
                   });
                   
            },
            isset : function(val) {
                return (typeof val !== "undefined");
            },
            updateTriggersState: function() {
                if (this.isset(settings.triggerNext)) {
                    $(settings.triggerNext.node)[(this.getImage(NEXT).length ? "removeClass" : "addClass")]("te-trigger-inactive");
                }
                if (this.isset(settings.triggerPrev)) {                    
                    $(settings.triggerPrev.node)[(this.getImage(PREV).length ? "removeClass" : "addClass")]("te-trigger-inactive");
                }
            },
            syncUI : function() {
                if (typeof settings.triggerNext !== "undefined") {
                    $(settings.triggerNext.node).bind(settings.triggerNext.event, this, function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("te-trigger-inactive")) { return false; }
                        var manager = e.data;                        
                        manager.driver.apply(manager.index + 1);
                        manager.index ++;
                        manager.updateTriggersState();
                    });
                }
                 if (typeof settings.triggerPrev !== "undefined") {
                    $(settings.triggerPrev.node).bind(settings.triggerPrev.event, this, function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("te-trigger-inactive")) { return false; }
                        var manager = e.data;
                        manager.driver.apply(manager.index - 1);
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
            _node.boundingBox.css('backgroundImage', 'url(' + this.manager.getImage().attr('src') + ')');
            _node.boundingBox.addClass('te-boundingBox');
            _node.overlay = $('<div class="te-overlay te-transition te-opacity-min"><!-- --></div>')
                .appendTo(_node.boundingBox);
        },
        apply: function(index) {
            var img = manager.getImage(index);
            var method = 'apply' + (Util.isPropertySupported('transition') ? 'Css' : 'Js');
            this[method](img, function(){
                $(document).trigger('apply.t-effect', [img]);
            });
        },
        applyCss: function(img2, callback) {            
            var isSolid = _node.overlay.css('opacity');
            if (isSolid === "0") {
                _node.overlay.css('backgroundImage', 'url(' + img2.attr('src') + ')');                 
            } else {
                _node.boundingBox.css('backgroundImage', 'url(' + img2.attr('src') + ')');           
            }
            _node.overlay.css('opacity', (isSolid === "0") ? '1.0' : '0');
            callback();
        },
        applyJs: function(img2, callback) {            
            _node.overlay.hide();
            _node.overlay.css('backgroundImage', 'url(' + img2.attr('src') + ')');
            _node.overlay.fadeIn('slow', function() {
                _node.boundingBox.css('backgroundImage', 'url(' + img2.attr('src')  + ')');
                callback(); 
            });
        }
    }
}

$.tEffects.HorizontalScroll = function(manager) {
    var _node = manager.node;
    return {
        init: function() {
            this.render();
        },
        render: function() {            
            _node.boundingBox.addClass('te-boundingBox');
            _node.boundingBox.css('overflow', "hidden");
            _node.boundingBox.html('');
            _node.slider = $('<div class="te-slider te-transition"><!-- --></div>').appendTo(_node.boundingBox);
            _node.slider.append(_node.images);
            _node.slider.css("width", manager.canvas.width * manager.listLength);
            _node.slider.find("img").css("display", "inline").css("visibility", "visible");
        },
        apply: function(index) {
            var method = 'apply' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method](index, function(){
                $(document).trigger('apply.t-effect', [index]);
            });
        },
        applyCss: function(index, callback) {
            var command = "translate(-" + (index * manager.canvas.width) + "px, 0)";
            _node.slider.css("transform", command)
                .css("-moz-transform", command)
                .css("-webkit-transform", command)
                .css("-o-transform", command);
        },
        applyJs: function(index, callback) {
             var initX = manager.index * manager.canvas.width, 
                 offset = (index * manager.canvas.width - initX);
             $.aQueue.add({
                startedCallback: function(){},
                iteratedCallback: function(i){                    
                    _node.boundingBox.scrollLeft(initX + Math.ceil(offset / 10 * i));
                },
                completedCallback: callback,
                iterations: 10,
                delay: 50,
                scope: this}).run();
        }
    }
}

$.tEffects.VerticalScroll = function(manager) {
    var _node = manager.node;
    return {
        init: function() {
            this.render();
        },
        render: function() {            
            _node.boundingBox.addClass('te-boundingBox');
            _node.boundingBox.css('overflow', "hidden");
            _node.boundingBox.html('');
            _node.slider = $('<div class="te-slider te-transition"><!-- --></div>').appendTo(_node.boundingBox);
            _node.slider.append(_node.images);
            _node.slider.css("height", manager.canvas.height * manager.listLength);
            _node.slider.find("img").css("display", "block").css("visibility", "visible");
        },
        apply: function(index) {
            var method = 'apply' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method](index, function(){
                $(document).trigger('apply.t-effect', [index]);
            });
        },
        applyCss: function(index, callback) {
            var command = "translateY(-" + (index * manager.canvas.height) + "px)";
            _node.slider.css("transform", command)
                .css("-moz-transform", command)
                .css("-webkit-transform", command)
                .css("-o-transform", command);
        },
        applyJs: function(index, callback) {
             var initY = manager.index * manager.canvas.height, 
                 offset = (index * manager.canvas.height - initY);
             $.aQueue.add({
                startedCallback: function(){},
                iteratedCallback: function(i){                    
                    _node.boundingBox.scrollTop(initY + Math.ceil(offset / 10 * i));
                },
                completedCallback: callback,
                iterations: 10,
                delay: 50,
                scope: this}).run();
        }
    }
}

$.tEffects.Jalousie = function(manager) {
    var _node = manager.node;
    return {
        init: function() {
            this.render();
        },
        render: function() {            
            _node.boundingBox.addClass('te-boundingBox');
            _node.boundingBox.css('overflow', "hidden");
            _node.boundingBox.html('');
            _node.slider = $('<div class="te-slider te-transition"><!-- --></div>').appendTo(_node.boundingBox);
            _node.slider.append(_node.images);
            _node.slider.css("width", manager.canvas.width * manager.listLength);
            _node.slider.find("img").css("visibility", "visible");
        },
        apply: function(index) {
            var method = 'apply' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method](index, function(){
                $(document).trigger('apply.t-effect', [index]);
            });
        },
        applyCss: function(index, callback) {
            var command = "translate(-" + (index * manager.canvas.width) + "px, 0)";
            _node.slider.css("transform", command)
                .css("-moz-transform", command)
                .css("-webkit-transform", command)
                .css("-o-transform", command);
        },
        applyJs: function(index, callback) {
             var initX = manager.index * manager.canvas.width, 
                 offset = (index * manager.canvas.width - initX);
             $.aQueue.add({
                startedCallback: function(){},
                iteratedCallback: function(i){                    
                    _node.boundingBox.scrollLeft(initX + Math.ceil(offset / 10 * i));
                },
                completedCallback: callback,
                iterations: 10,
                delay: 50,
                scope: this}).run();
        }
    }
}

})( jQuery );