var Sandbox = require('javascript-sandbox');
var assert = chai.assert;

// Needed to detect IE, since it reports line numbers & character positions differently.
function detectBrowser() {
  var ua = window.navigator.userAgent;

  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
    // IE 10 or older => return version number
    return "IE";
  }

  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
    return "IE";
  }

  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
    return "IE";
  }

  var phantomJS = ua.indexOf('PhantomJS/');
  if (phantomJS > 0) {
    return "PHANTOM";
  }

  // other browser
  return false;
}

describe("Sandbox", function() {
  var sandbox;

  describe("#new(options=null)", function() {
    
    it("inserted an iframe into the document", function() {
      sandbox = new Sandbox();

      assert.ok(sandbox.iframe)
      assert.ok(sandbox.iframe.parentNode)
      assert.equal(document.getElementsByTagName('iframe').length, 1, "More than one iframe was created!");

      sandbox.destroy();
    });

    it("set variables on the iframe", function() {
      var test1 = "test1";
      var test2 = 2;
      var options = {
        variables: {
          test1: test1,
          test2: test2,
          sandbox: sandbox
        }
      };

      sandbox = new Sandbox(options);

      for (var variable in options.variables) {
        assert.equal(options.variables[variable], sandbox.iframe.contentWindow.eval(variable));
      }

      sandbox.destroy();
    });

    it("sets nested variables on the iframe", function() {
      var logStub = sinon.stub;
      var options = {
        variables: {
          'console.log': logStub
        }
      };

      sandbox = new Sandbox(options);
      assert.equal(sandbox.get('console')['log'], logStub);
      sandbox.destroy();
    });

    it("executes optional javascript", function() {
      assert.throws(function() {
        new Sandbox({
          javascript: "throw {message: 'ha! ha!', toString:function() {return this.message}}"
        });
      }, 'ha! ha!');
    });
  })

  describe("#evaluate(code)", function() {
    beforeEach(function() {
      sandbox = new Sandbox();
    })

    afterEach(function() {
      sandbox.destroy();
    })

    it("executes user's code", function() {
      var code = "window.document.getElementsByTagName('body')";
      var iframeBody = sandbox.evaluate(code)[0];

      assert.ok(iframeBody, "iframe body was retrieved using user's code.");
      assert(iframeBody == sandbox.iframe.contentWindow.document.body, "user code returned the current window body, meaning the code was executed in the wrong context.");
    })

    it('throws uncaught exceptions', function() {
      assert.throws(function() {
        sandbox.evaluate("throw {message:'ha! ha!', toString:function() {return this.message}};");
      }, 'ha! ha!');
    });

    it('throws uncaught exceptions with line numbers', function() {
      var thrownError = null;

      try {
        sandbox.evaluate("throw new Error('ha! ha!');");
      }
      catch (error) {
        thrownError = error;
      }

      assert(thrownError);
      assert(thrownError.line);
      assert(thrownError.line === 1);

      var browser = detectBrowser();
      switch (browser) {
        case "IE":
          assert(thrownError.character === 1);
          break;
        case "PHANTOM":
          assert(!thrownError.character);
          break;
        default:
          assert(thrownError.character);
          assert(thrownError.character === 7);
      }
    });

    it('throws non-error exceptions with no line numbers', function() {
      var thrownError = null;

      try {
        sandbox.evaluate("throw {message:'ha! ha!'};");
      }
      catch (error) {
        thrownError = error;
      }

      assert(thrownError);
      var browser = detectBrowser();
      switch (browser) {
        case "PHANTOM":
          assert(thrownError.line === 1);
          break;
        default:
          assert(!thrownError.line);
      }
      assert(!thrownError.character);
    });
  });

  describe("#new(options={quiet:true})", function() {
    var alertStub;

    beforeEach(function() {
      sandbox = new Sandbox({
        quiet: true
      });
      alertStub = sinon.stub(sandbox.iframe.contentWindow, "alert");
    })

    afterEach(function() {
      sandbox.iframe.contentWindow.alert.restore();
      sandbox.destroy();
    })

    it("does not execute code that interrupts browser interaction", function() {
      sandbox.evaluate("alert('Pay attention to meee!!')");

      assert.equal(1, alertStub.callCount, "Alert should have been called, but not performed any actions.");
    })
  });

  describe("#exec(function, arguments, context)", function() {
    beforeEach(function() {
      sandbox = new Sandbox();
    })

    afterEach(function() {
      sandbox.destroy();
    })

    it("called a function in the iframe", function() {
      var iframeDocument = sandbox.exec(function(window) {
        return window.document;
      });

      assert.equal(iframeDocument, sandbox.iframe.contentWindow.document, "Was not able to retrieve the iframe document.");
    })

    it("called a function with args", function() {
      var localArg1 = "my arg";
      var iframeArg1 = sandbox.exec(function(window, arg1) {
        return arg1
      }, localArg1);

      assert.equal(localArg1, iframeArg1, "Argument wasn't passed to the function.");
    })

    it("called a function with multiple args", function() {
      var localArg1 = "my arg";
      var localArg2 = "my additional arg";
      var iframeArgs = sandbox.exec(function(window, arg1, arg2) {
        return [arg1, arg2];
      }, localArg1, localArg2);

      assert.equal(localArg1, iframeArgs[0], "Argument 1 wasn't passed to the function.");
      assert.equal(localArg2, iframeArgs[1], "Argument 2 wasn't passed to the function.");
    })

    it('throws uncaught exceptions', function() {
      assert.throws(function() {
        sandbox.exec(function() {
          throw {message: 'ha! ha!', toString:function() {return this.message}};
        });
      }, 'ha! ha!');
    });
  });

  describe("#get(propertyName)", function() {
    beforeEach(function() {
      sandbox = new Sandbox();
    })

    afterEach(function() {
      sandbox.destroy();
    })

    it("retrieved a property from the iframe", function() {
      var myVar = "A new variable that I just set.";
      sandbox.iframe.contentWindow.myVar = myVar;

      var sandboxMyVar = sandbox.get('myVar');
      assert.equal(myVar, sandboxMyVar, "The variable was not retrieved from the sandbox.");
    })
  })

  describe("#set(propertyName, value)", function() {
    beforeEach(function() {
      sandbox = new Sandbox();
    })

    afterEach(function() {
      sandbox.destroy();
    })

    it("retrieved a property from the iframe", function() {
      var myVar = "A new variable that I just set.";
      sandbox.set('myVar', myVar);
      
      var iframeMyVar = sandbox.iframe.contentWindow.myVar;
      assert.equal(myVar, iframeMyVar, "The variable was not set in the sandbox.");
    })
  })

  describe("polyfills", function() {
    beforeEach(function() {
      sandbox = new Sandbox();
    })

    afterEach(function() {
      sandbox.destroy();
    })

    it("has polyfilled methods", function() {
      var console = sandbox.get('console');
      assert(console.time);
      assert(console.timeEnd);
      assert(console.debug);
      assert(console.warn);
      assert(console.info);
      assert(console.group);
      assert(console.groupEnd);
      assert(console.count);
    })
  })
});
