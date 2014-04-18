var blacklist = [
  'console.log',
  'alert',
  'confirm',
  'prompt'
];

function blacklistify(blacklist) {
  return '' + blacklist + ' = function() {} ';
}

function Sandbox(options) {
  options = options || {}
  var parentElement = options.parentElement || document.body;

  // Code will be run in an iframe
  this.iframe = document.createElement('iframe');
  this.iframe.style.display = 'none';
  parentElement.appendChild(this.iframe);

  // quiet stubs out all loud functions (log, alert, etc)
  options.quiet = options.quiet || false

  // blacklisted functions will be overridden
  options.blacklist = options.blacklist || (options.quiet ? blacklist : []);
  for(var i in options.blacklist) {
    this.iframe.contentWindow.eval(blacklistify(options.blacklist[i]));
  }

  // Copy over all variables to the iFrame
  var win = this.iframe.contentWindow;
  var variables = options.variables || {};
  var nestedKeys;
  Object.keys(variables).forEach(function (key) {
    nestedKeys = key.split('.');
    nameSpaceFor(win, nestedKeys)[nestedKeys[nestedKeys.length-1]] = variables[key];
  });

  // Load the HTML in
  if(options.html) {
    var iframeDocument = this.iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(options.html);
    iframeDocument.close();
  }
}


// Used for getting variables under a namespace for redefining
// ie, console.log
function nameSpaceFor(namespace, keys) {
  if(keys.length == 1) {
    return namespace;
  } else {
    return nameSpaceFor(namespace[keys[0]], keys.slice(1,keys.length));
  }
}

// When we evaluate, we'll need to take into account:
//   Setup the HTML?
//   Run the JavaScript
//   
Sandbox.prototype.evaluate = function (code) {
  return this.iframe.contentWindow.eval(code);
};

Sandbox.prototype.exec = function(/*...*/) {
  var context = this.iframe.contentWindow,
      args = [].slice.call(arguments),
      functionToExec = args.shift();

  // Pass in the context as the first argument.
  args.unshift(context);

  return functionToExec.apply(context, args);
};

Sandbox.prototype.get = function(property) {
  var context = this.iframe.contentWindow;
  return context[property];
};

Sandbox.prototype.set = function(property, value) {
  var context = this.iframe.contentWindow;
  context[property] = value;
};

Sandbox.prototype.destroy = function () {
  if (this.iframe) {
    this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
  }
};

module.exports = Sandbox;