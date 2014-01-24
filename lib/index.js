var blacklist = [
  'console.log',
  'alert',
  'confirm',
  'prompt'
]

function blacklistify(blacklist) {
  return '' + blacklist + ' = function() {} ';
}

function Sandbox(options) {
  options = options || {}
  parentElement = parentElement || document.body;

  // Code will be run in an iframe
  this.iframe = document.createElement('iframe');
  this.iframe.style.display = 'none';
  parentElement.appendChild(this.iframe);

  // quiet stubs out all loud functions (log, alert, etc)
  options.quiet = options.quiet || false

  // blacklisted functions will be overridden
  options.blacklist = options.blacklist || (options.quiet ? blacklist : []);
  for(i in options.blacklist) {
    this.iframe.contentWindow.eval(blacklistify(options.blacklist[i]));
  }

  // Copy over all variables to the iFrame
  var win = this.iframe.contentWindow;
  options.variables = variables || {};
  Object.keys(variables).forEach(function (key) {
    win[key] = variables[key];
  });
}


// When we evaluate, we'll need to take into account:
//   Setup the HTML?
//   Run the JavaScript
//   
Sandbox.prototype.evaluate = function (code) {
  return this.iframe.contentWindow.eval(code);
};

Sandbox.prototype.destroy = function () {
  if (this.iframe) {
    this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
  }
};

module.exports = Sandbox;

