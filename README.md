# tEffects jQuery plugin

The project site: https://github.com/dsheiko/Transition-Effects-JS-Library
The demo site: http://demo.dsheiko.com/blogslideshow/

The plugin allows you to convert simple markup into a slide-show with the set of fancy configurable transition effects. The plugin tries to render the effects with CSS3 transitions. However if the browser does not support CSS3 the efects willbe achieved by JS.

Every available effect is encopsulated into a single module. So you do not have to violate YAGNI principle. Just remove redundant effect modules and leave the only code responding to your requirements.

### How to use

Step 1

Including plugin scripts after jQuery (requires jQuery 1.4+):

    <link href="./assets/t-effects.css" rel="stylesheet" media="all" />
    <script src="./js/jquery.a-queue.js" type="text/javascript"></script>
    <script src="./js/jquery.t-effects.js" type="text/javascript"></script>

Step 2

To have slideshow running it is enough just to provide a placeholder within DOM with images to slide inside:

    <div id="slideshow">
        <img src="./slides/sample1.jpg" />
        <img src="./slides/sample2.jpg" />
        <img src="./slides/sample3.jpg" />
    </div>

Though if you want to keep images elsewhere, they can be passed into the plugin through images option.
Step 3

Now here how the plugin can be initialized and enabled.

    <script type="text/javascript">
        $(document).ready(function(){
            $('#slideshow').tEffects({
               effect: 'FadeInOut'
            }).enable();
        });
    </script>

Step 4 (optional)

The slide-show is running and can be navigated by arrows-keys, but you want to subscribe you own navigation controls. Well, you can do it like that:

    $('#slideshow').tEffects({
        effect: 'FadeInOut',
        triggerNext: {
               node: $('button.next'),
               event: 'click'
        },
        triggerPrev: {
               node: $('button.prev'),
               event: 'click'
        }
    }).enable();

