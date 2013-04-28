describe('kivi', function () {

  var expectOnError = function (expectedErrorMsg) {
    var sampleOnError = spyOn(kivi, 'onError').andCallFake(function (error) {
      expect(error.message).toBe(expectedErrorMsg);
    });
    return sampleOnError;
  }

  jasmine.Spy.prototype.restore = function() {
    this.baseObj[this.methodName] = this.originalValue;
  };

  beforeEach(function () {
    kivi.clear(); 
  });

  describe('get and set', function () {
    it('allows you to get a value after you set it', function () {
      kivi.set('key', 1);
      kivi.set('parent.child', 2);

      expect(kivi.get('key')).toBe(1);
      expect(kivi.get('parent.child')).toBe(2);
    });

    it('call onError if you try to set a value twice', function () {
      var errorSpy = expectOnError('kivi: You already set key[key] to [1].');
      kivi.set('key', 1);
      kivi.set('key', 1);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('call onError if you try to set a value that is not a number', function () {
      var errorSpy = expectOnError('kivi: [key][string] is not a number.');
      kivi.set('key', 'string');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('isReported', function () {
    it('returns true if the key has been reported to the server', function () {
      kivi.set('key', 1);
      expect(kivi.isReported('key')).toBe(false);

      kivi._markReported('key');
      expect(kivi.isReported('key')).toBe(true);
    });
  });

  describe('clear', function () {
    beforeEach(function () {
      kivi.set('unreported', 1);
      kivi.set('reported', 2);
      kivi._markReported('reported');

      expect(kivi.isReported('unreported')).toBe(false);
      expect(kivi.isReported('reported')).toBe(true);
    });

    it('destroys unreported and reported keys', function () {
      kivi.clear();

      expect(kivi.get('unreported')).toBe(undefined);
      expect(kivi.get('reported')).toBe(undefined);

      expect(kivi.isReported('unreported')).toBe(false);
      expect(kivi.isReported('reported')).toBe(false);
    });
  });

  describe('onError', function () {
    it('calls console.log', function () {
      spyOn(console, 'log');
      kivi.onError(new Error('test'));
      expect(console.log).toHaveBeenCalledWith('test');
    });
  });

  describe('underscore', function () {
    it('has an each function', function () {
      expect(typeof kivi._.each).toBe('function');
    });
  });

  describe('postKeys', function () {
    beforeEach(function () {
      kivi.set('unreported1', 1);
      kivi.set('unreported2', 2);
      kivi.set('reported1', 3);
      kivi.set('reported2', 4);
      kivi._markReported('reported1');
      kivi._markReported('reported2');
    });

    it('returns the keys that have not been successfully reported', function () {
      expect(kivi.postKeys()).toEqual(['unreported1', 'unreported2']);
      kivi._markReported('unreported1');
      kivi._markReported('unreported2');
      expect(kivi.postKeys()).toEqual([]);
    });
  });

  describe('postList', function () {
    beforeEach(function () {
      kivi.set('unreported1', 1);
      kivi.set('unreported2', 2);
    });

    it('creates and array of key/val pairs to jsonify', function () {
      var postKeys = kivi.postKeys();

      var expected = [
        { key: 'unreported1', val: 1 }
      , { key: 'unreported2', val: 2 }
      ];
      expect(kivi.postList(postKeys)).toEqual(expected);
    });

    it('calls postKeys itself if the postKeys argument is omitted', function () {
      var expected = [
        { key: 'unreported1', val: 1 }
      , { key: 'unreported2', val: 2 }
      ];
      expect(kivi.postList()).toEqual(expected);
    });

    it('prefers the postKeys argument over postKeys()', function () {
      kivi.set('changed1', 3);
      kivi.set('changed2', 4);

      var expected = [
        { key: 'changed1', val: 3 }
      , { key: 'changed2', val: 4 }
      ];
      expect(kivi.postList(['changed1', 'changed2'])).toEqual(expected);
    });
  });

  describe('postData', function () {
    beforeEach(function () {
      kivi.set('unreported1', 1);
      kivi.set('unreported2', 2);
    });

    it('returns the post payload, an array of key/value pairs', function () {
      var postKeys = kivi.postKeys();

      var expected = [
        { key: 'unreported1', val: 1 }
      , { key: 'unreported2', val: 2 }
      ];
      expect(kivi.postData(postKeys)).toEqual(expected);
    });
  });

  describe('post()', function () {

    var postSuccessSpy, jquery, ajaxSpy;

    beforeEach(function () {
      kivi.set('unreported1', 1);
      kivi.set('unreported2', 2);
      jquery = {ajax: function (params) {
        params.success({});
      }};
      ajaxSpy = spyOn(jquery, 'ajax').andCallThrough();
      kivi.config.$ = jquery;
      kivi.config.postUrl = 'http://localhost'

    });
    
    describe('when JQuery and post URL are set and there are key/value pairs to report', function () {
      it('reports the key/value pairs and marks them reported', function () {
        var data = kivi.postData(kivi.postKeys());
        kivi.post();
        
        expect(ajaxSpy).toHaveBeenCalled();
        
        var params = ajaxSpy.mostRecentCall.args[0];
        expect(params.url).toBe('http://localhost');
        expect(params.data).toEqual(JSON.stringify(data));
        
        expect(kivi.postKeys()).toEqual([]);

        // Does not call $.ajax again if there is no data to report
        kivi.post();
        expect(ajaxSpy.calls.length).toBe(1);
      });
    });

    describe('when the request fails', function () {
      beforeEach(function () {
        jquery = {ajax: function (params) {
          params.error({}, 'textStatus', 'errorThrown');
        }};

        ajaxSpy = spyOn(jquery, 'ajax').andCallThrough();
        kivi.config.$ = jquery;
      });

      it('calls onError', function () {
        var errorSpy = expectOnError('kivi: Error posting stats: textStatus errorThrown');
        var data = kivi.postData(kivi.postKeys());
        
        kivi.post();
        
        expect(ajaxSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
      });
    });

    describe('when JQuery and post URL are set and there are not key/value pairs to report', function () {
      it('does not report the key/value pairs', function () {
        kivi._markReported('unreported1');
        kivi._markReported('unreported2');
        kivi.post();
        
        expect(ajaxSpy).not.toHaveBeenCalled();
      });
    });

    describe('when JQuery is not set and post URL is set and there are key/value pairs to report', function () {
      it('does not report the key/value pairs', function () {
        kivi.config.$ = undefined;
        expect(function () { kivi.post(); }).toThrow('kivi: You need to set kivi.config.$');
        
        expect(ajaxSpy).not.toHaveBeenCalled();
        
        expect(kivi.postKeys()).toEqual(['unreported1', 'unreported2']);
      });
    });

    describe('when JQuery is set and post URL is not set and there are key/value pairs to report', function () {
      it('does not report the key/value pairs', function () {
        kivi.config.postUrl = undefined;
        expect(function () { kivi.post(); }).toThrow('kivi: You need to set kivi.config.postUrl');
        
        expect(ajaxSpy).not.toHaveBeenCalled();
        
        expect(kivi.postKeys()).toEqual(['unreported1', 'unreported2']);
      });
    });

    describe('when JQuery is set and post URL is set and there are key/value pairs to report and there is no toJSON', function () {
      it('does not report the key/value pairs', function () {
        spyOn(kivi, 'getToJSON').andReturn(undefined);
        // Just silently fails.
        // Don't want to force developers to support JSON on old browsers
        expect(ajaxSpy).not.toHaveBeenCalled();
        
        expect(kivi.postKeys()).toEqual(['unreported1', 'unreported2']);
      });
    });
  });

  describe('enablePost()', function () {
    beforeEach(function () {
      jasmine.Clock.useMock();
    });

    afterEach(function () {
      kivi.disablePost();
    });

    it('calls post() at each member of the startingIntervalSeries and then stops', function () {
      var spy = spyOn(kivi, 'post');
      kivi.enablePost([100, 200]);
      expect(spy.callCount).toBe(0);
      jasmine.Clock.tick(105);
      expect(spy.callCount).toBe(1);
      jasmine.Clock.tick(100);
      expect(spy.callCount).toBe(1);
      jasmine.Clock.tick(105);
      expect(spy.callCount).toBe(2);
      jasmine.Clock.tick(300);
      expect(spy.callCount).toBe(2);
      jasmine.Clock.tick(300);
      expect(spy.callCount).toBe(2);
    });
  });

  describe('disablePost()', function () {
    beforeEach(function () {
      jasmine.Clock.useMock();
    });

    it('stops series calls to post', function () {
      var spy = spyOn(kivi, 'post');
      kivi.enablePost([300, 300, 300, 300]);
      expect(spy.callCount).toBe(0);
      jasmine.Clock.tick(305);
      expect(spy.callCount).toBe(1);
      kivi.disablePost();
      jasmine.Clock.tick(305);
      expect(spy.callCount).toBe(1);
    });
  });   
});