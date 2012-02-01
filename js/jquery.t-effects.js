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
                images: settings.boundingBox.find("img")
            },
            index: 0,
            listLength: 0,
            driver: 0,
            init: function() {
                this.listLength = this.node.images.length;
                this.checkEntryConditions();
                this.render();
                this.driver = new $.tEffects[settings.effect](this);
                this.driver.init();
                this.syncUI();
            },
            checkEntryConditions: function() {
                if (!this.listLength) {
                    throw "No images found";
                }
                if (typeof $.tEffects[settings.effect] === "undefined") {
                    throw "Given effect function not found";
                }
            },
            render : function() {                
                   this.node.boundingBox.css('backgroundImage', 'url(' + this.getImage().attr('src') + ')');
            },
            syncUI : function(driver) {
                if (typeof settings.triggerNext !== "undefined") {
                    $(settings.triggerNext.node).bind(settings.triggerNext.event, this, function(e) {
                        var manager = e.data, img = manager.getImage(1);
                        if (typeof img !== "undefined") {
                            manager.driver.apply( manager.getImage(), img);
                            manager.index ++;
                            $(this).addClass("te-visible");
                        } else {
                            $(this).addClass("te-hidden");
                        }
                    });
                }
                if (typeof settings.triggerPrev !== "undefined") {
                    $(settings.triggerPrev.node).bind(settings.triggerPrev.event, driver, function(e) {
                        var manager = e.data, img = manager.getImage(-1);
                        if (typeof img !== "undefined") {
                            manager.driver.apply( manager.getImage(), img);
                            this.index --;
                            $(this).addClass("te-visible");
                        } else {
                            $(this).addClass("te-hidden");
                        }
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
    varstateHander = {
        started : function() {
            _node.overlay.toggleClass('te-opacity-max te-opacity-min');
        }

    }
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
        apply: function(img1, img2) {
            console.log(img1, img2);
            _node.overlay.removeClass('te-transition');
            _node.boundingBox.css('backgroundImage', 'url(' + img1.attr('src') + ')');
            _node.overlay.css('backgroundImage', 'url(' + img2.attr('src') + ')');
            _node.overlay.removeClass('te-opacity-max');
            _node.overlay.addClass('te-opacity-min');
            
            var method = 'apply' + (Util.isPropertySupported('transition') ? 'Css' : 'Js');
            this[method](img1, img2);
        },
        applyCss: function(img1, img2) {
            _node.overlay.addClass('te-transition');
            _node.overlay.toggleClass('te-opacity-max te-opacity-min');
        },
        applyJs: function(img1, img2) {
            $.aQueue.add({
                startedCallback: tEffect._fadeStarted,
                iteratedCallback: tEffect._fadeIterated,
                completedCallback: tEffect._fadeCompleted,
                iterations: 3,
                delay: 100,
                scope: this}).run();
        }
    }
}

})( jQuery );