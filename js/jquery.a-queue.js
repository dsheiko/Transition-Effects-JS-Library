/*
* Asynchronous queue
*
* @package aqueue
* @author Dmitry Sheiko
* @version $Revision$
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
* 
* Usage examples:
* aQueue.add({
*        startedCallback: function(){ console.log(this, "started"); },
*        iteratedCallback: function(counter, number){ console.log(this, counter, number); },
*        completedCallback: function(){ console.log(this, "completed"); },
*        iterations: 10,
*        delay: 150,
*        reverse: true,
*        scope:window}).run();
*
*/
(function( $ ) {

/**
 * Variation of asynchronous queue, which iterates given callback specified number of times
 */
$.aQueue = function() {
    var _iterator = 0,
        _timer = null,
        _options = {},
        _chain = [];

    // Helper to pass context of use
    var proxy = function (method, context) {
        if (typeof method == 'string') method = context[method];
        var cb = function () { method.apply(context, arguments); }
        return cb;
     };

    return {
    /**
     * Add an asynchronous iterator into the queue, which will call 'iteratedCallback' of
     * 'iterations' times and then call 'completedCallback'
     * The method is chainable
     * @param object options {
     *      function options.startedCallback
     *      function options.iteratedCallback
     *      function options.completedCallback
     *      int options.iterations - number of iterations
     *      int options.delay - delay in msec
     *      boolean options.reverse - when reverse is true, decrementing, otherwise incrementing
     *      object options.scope - context of use
     * }
     * @return object aQueue
     */
    add : function(options) {
        _chain.push(options);
        return this;
    },
    /**
     * Run the queue
     * @return void
     */
    run : function() {
        if (_chain.length) {
            var options = _chain.shift();
            _options = options;
            if (undefined !== options.startedCallback) {
                options.startedCallback.apply(options.scope, []);                
            }                                                  
            if (undefined === options.iterations) {
                return;
            }
            _iterator = 0;
            if (undefined !== options.reverse && true === options.reverse) {
                _iterator = options.iterations + 1;
                this.deiterate();
            } else {
                this.iterate();
            }
        }
    },
    /**
     * Iterates iteratedCallback till the number of iterations approaches iterations
     * @return void
     */
    iterate : function() {
        if (++_iterator <= _options.iterations) {
            _options.iteratedCallback.apply(_options.scope, [_iterator, _options.iterations]);
            _timer = setTimeout(proxy(this.iterate, this), _options.delay);
        } else {
            _options.completedCallback.apply(_options.scope, []);
            _timer = null;
            this.run();
        }
    },
    /**
     * Deiterates iteratedCallback
     * @return void
     */
    deiterate : function() {
        if (--_iterator >= 1) {
            _options.iteratedCallback.apply(_options.scope, [_iterator, _options.iterations]);
            _timer = setTimeout(proxy(this.deiterate, this), _options.delay);
        } else {
            _options.completedCallback.apply(_options.scope, []);
            _timer = null;
            this.run();
        }
    },
    /**
     * Cancel the queue
     */
    stop : function() {
        _timer = null;
        _iterator = _options.reverse ? 0 : _options.iterations + 1;
        _chain = [];
    }
    };
}();

})( jQuery );