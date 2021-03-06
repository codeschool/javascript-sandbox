var blacklist = [
  'console.log',
  'alert',
  'confirm',
  'prompt'
];

var polyfills = {
  console: {
    assert: function() {},
    count: function() {},
    dir: function() {},
    dirxml: function() {},
    debug: function() {},
    error: function() {},
    group: function() {},
    groupCollapsed: function() {},
    groupEnd: function() {},
    info: function() {},
    log: function() {},
    markTimeline: function() {},
    memory: function() {},
    profile: function() {},
    profileEnd: function() {},
    table: function() {},
    time: function() {},
    timeEnd: function() {},
    timeline: function() {},
    timelineEnd: function() {},
    timeStamp: function() {},
    trace: function() {},
    warn: function() {}
  }
};

function blacklistify(blacklist) {
  return '' + blacklist + ' = function() {} ';
}

function Sandbox(options) {
  options = options || {}
  var parentElement = options.parentElement || document.body;

  // Code will be run in an iframe
  if(options.iframe) {
    this.iframe = options.iframe;  
  } else {
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
  }
  parentElement.appendChild(this.iframe);

  // quiet stubs out all loud functions (log, alert, etc)
  options.quiet = options.quiet || false;

  // blacklisted functions will be overridden
  options.blacklist = options.blacklist || (options.quiet ? blacklist : []);
  for(var i = 0, len = options.blacklist.length; i < len; i++) {
    this.iframe.contentWindow.eval(blacklistify(options.blacklist[i]));
  }

  // Load the HTML in
  if(options.html) {
    var iframeDocument = this.iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(options.html);
    iframeDocument.close();
  }

  // Copy over all variables to the iFrame
  // This MUST happen after the document is written because IE11 seems to reinitialize the
  // contentWindow after a document.close();
  var win = this.iframe.contentWindow;
  var variables = options.variables || {};
  var nestedKeys;
  Object.keys(variables).forEach(function (key) {
    nestedKeys = key.split('.');
    nameSpaceFor(win, nestedKeys)[nestedKeys[nestedKeys.length-1]] = variables[key];
  });

  for (var polyfill in polyfills) {
    var object = this.get(polyfill) || {};
    if (!object) {
      this.set(polyfill, object);
    }

    for (var method in polyfills[polyfill]) {
      if (!object[method]) {
        object[method] = polyfills[polyfill][method];
      }
    }
  }

  // Evaluate the javascript.
  if(options.javascript) {
    this.evaluate(options.javascript);
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
  var result;
  try {
    result = this.iframe.contentWindow.eval(code);
  }
  catch (error) {
    var stack = error.stack;
    if (stack) {
      var stackLines = stack.split(/\n/);
      if (stackLines.length > 0) {
        // find first line with anonymous code and a line number
        for (var current = 0, len = stackLines.length; current < len; current++) {
          var currentLine = stackLines[current];

          // Detect Chrome and IE line numbers.
          var matches = currentLine.match(/(\<anonymous\>\:|eval code:)\s*(\d+):(\d+)/);
          if (matches && matches.length === 4) {
            error.line = parseInt(matches[2], 10);
            error.character = parseInt(matches[3], 10);
            break;
          }

          // Detect PhantomJS... why? cause unit tests.
          matches  = currentLine.match(/at\s+\:(\d+)/);
          if (matches && matches.length == 2) {
            error.line = parseInt(matches[1], 10);
            break;
          }
        }
      }
    }
    throw error;
  }
  return result;
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
