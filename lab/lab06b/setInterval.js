
var rudyTimer = (function () {
    var timer = null; 

    function rudy() { 
        document.getElementById("out").innerHTML += " Rudy!";
    }


    return function delayMsg2() {
        if (timer === null) {
            timer = setInterval(rudy, 1000);
        } else {
            clearInterval(timer);
            timer = null;
        }
    };
})();
window.onload=function(){
    document.getElementById('buttonOutput').onclick=rudyTimer;
}