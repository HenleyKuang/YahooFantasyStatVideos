console.log("testing something!");
var div = document.createElement('div');
var label = document.createElement('span');
label.textContent = "Hello, world";
div.appendChild(label);
document.body.appendChild(div);
console.log("I did something!");