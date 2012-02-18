/**
 * User: altryne
 * Date: 17/2/12
 * Time: 20:31
 * inspired by bret victor's talk - http://vimeo.com/36579366
 */

var sv = scrubbingValues = {
    token : false,
    allowedTokens : ['abslength'],
    init : function(){

        this.bindEvents();
    },
    bindEvents : function(){

        document.addEventListener('keydown',function(e){
            if(e.metaKey || e.ctrlKey){
                sv.setCtrlMode(true);
            }
        },false);

        document.addEventListener('keyup',function(e){
            if(!e.metaKey || !e.ctrlKey){
                sv.setCtrlMode(false);
            }
        },false);

        window.addEventListener('mousedown',this.handleMouseDown,false);
        window.addEventListener('mouseup',this.handleMouseUp,false);
        window.addEventListener('mousemove',this.handleMouseMove,false);
    },
    setCtrlMode : function(mode){
        sv.ctrlMode = mode;
        $('body').dataset.ctrlmode = mode;

    },
    handleMouseDown : function(e){
        if(!sv.ctrlMode ) {return}
        //check if token is allowed to resize
        if(sv.allowedTokens.indexOf(Previewer.get(e.target)) > -1){
            //set currently resizable token
            sv.token = e.target;
            //update previwer
            sv.updatePreviewer();

            //handle abslength tokens
            var initialValue = parseInt(e.target.textContent);
            console.log(e.target.textContent);
            sv.token.dataset.value = initialValue;
            $('body').dataset.scrubbing = 1;
            /* add previewer to this token */

            sv.screenX = e.screenX;
            sv.screenY = e.screenY;
        }
    },
    handleMouseUp : function(e){

        if(!sv.ctrlMode) {return}
        //clear previewer if mouseup outside element
        if(e.target !== sv.token && sv.token){
            $('body').removeAttribute('data-scrubbing');
            sv.removePreviewer();
        }
        sv.token = false;
    },
    handleMouseMove : function(e){
        if(!sv.ctrlMode) {return}
        if(!sv.token) {return}
        //increment by distance from element - apple scrobbler style
        var increment = 1;


        if(sv.screenY - e.screenY > 15){
            //15px above  = 10px increment
            increment = 10;
        }
        if(sv.screenY - e.screenY > 30){
            //50px above  = 50px increment
            increment = 50;
        }
        if(sv.screenY - e.screenY > 150){
            //150px above  = 50px increment
            increment = 100;
        }
        if(sv.screenY - e.screenY < -15){
            //15px below = .1px increment
            increment = 0.1;
        }
        $('body').dataset.scrubbing = increment;
        //handle stupid js math
        //x100 to prevent 0.00000018 values
        var val = parseFloat(sv.token.dataset.value);

        if(sv.screenX > e.screenX){
            sv.token.dataset.value = Math.round((val * 100 - increment * 100)) / 100;
        }
        if(sv.screenX < e.screenX){
            sv.token.dataset.value = Math.round((val * 100 + increment * 100)) / 100;
        }

        sv.updateTokenValue();
        //save the last mouse position
        sv.screenX = e.screenX;
    },
    updateTokenValue : function(){
        if(!sv.ctrlMode && !sv.token) {return}

        var that = sv.token;

        var val = parseFloat(that.dataset.value);
        var unit = (that.textContent.match(/[a-z]+$/i) || [])[0];
        var html =  val + unit;
        that.textContent = html;
        //update previewer
        sv.updatePreviewer();
        //update css
        cssCode = css.textContent;
        Dabblet.update.CSS(cssCode);
    },
    updatePreviewer : function(token){
        var token = token || sv.token;
        var type = Previewer.get(token);
        Previewer.s[type].token = token;
    },
    removePreviewer : function(){
        this.updatePreviewer(null);
    }
}

scrubbingValues.init();
