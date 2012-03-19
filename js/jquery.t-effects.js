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
            driver: 0,
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
                   this.node.boundingBox.css('backgroundImage', 'url(' + this.getImage().attr('src') + ')');
                   this.updateTriggersState();

                   // Workaround for image load event binding with IE bug
                   $(this.node.images[0]).attr('src', function(i, val) {
                      return val + "?v=" + (new Date()).getTime()
                    }).bind("load", this, function(e){
                       e.data.canvas.width = $(this).width();
                       e.data.canvas.height = $(this).height();
                       e.data.node.boundingBox.css("width", e.data.canvas.width).css("height", e.data.canvas.height);
                       callback.apply(e.data, arguments);
                   });
                   
            },
            isset : function(val) {
                return (typeof val !== "undefined");
            },
            updateTriggersState: function() {
                if (this.isset(settings.triggerNext)) {
                    $(settings.triggerNext.node)[(this.getImage(1).length ? "removeClass" : "addClass")]("te-trigger-inactive");
                }
                if (this.isset(settings.triggerPrev)) {                    
                    $(settings.triggerPrev.node)[(this.getImage(-1).length ? "removeClass" : "addClass")]("te-trigger-inactive");
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
                switch (key) {
                    case 1:
                        return $(this.node.images[this.index + 1]);
                    case -1:
                        return $(this.node.images[this.index - 1]);
                    default:
                        return $(this.node.images[this.index]);
                }
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
            _node.boundingBox.addClass('te-boundingBox');
            _node.overlay = $('<div class="te-overlay te-transition te-opacity-min"><!-- --></div>')
                .appendTo(_node.boundingBox);
        },
        apply: function(index) {
            var img1 = manager.getImage(),
            img2 = _node.images[index];
            if (!_node.overlay.hasClass('te-initialized')) {
                _node.overlay.addClass('te-initialized te-transition te-opacity-min');
            }
            var method = 'apply' + (Util.isPropertySupported('transition') ? 'Css' : 'Js');
            this[method](img1, img2, function(){
                $(document).trigger('apply.t-effect', [img2]);
            });
        },
        applyCss: function(img1, img2, callback) {
            var isDirect = _node.overlay.hasClass('te-opacity-min');
            _node.boundingBox.css('backgroundImage', 'url(' + (isDirect ? img1.attr('src') : img2.attr('src')) + ')');
            _node.overlay.css('backgroundImage', 'url(' + (isDirect ? img2.attr('src') : img1.attr('src')) + ')');
            _node.overlay.toggleClass('te-opacity-max te-opacity-min');
            callback();
        },
        applyJs: function(img1, img2) {
            _node.boundingBox.css('backgroundImage', 'url(' + img1.attr('src')  + ')');
            _node.overlay.css('backgroundImage', 'url(' + img2.attr('src') + ')');
            _node.overlay.hide();
            _node.overlay.fadeIn('slow', callback);
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
            _node.slider.find("img").css("visibility", "visible");

            // Delay from _node.slider.css('mozTransition')
        },
        apply: function(index) {
            var method = 'apply' + (Util.isPropertySupported('transform') ? 'Css' : 'Js');
            this[method](index, function(){
                $(document).trigger('apply.t-effect', [index]);
            });
        },
        applyCss: function(index, callback) {
            var command = "translate(0, -" + (index * manager.canvas.height) + "px)";
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