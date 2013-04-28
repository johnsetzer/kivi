var kivi = {

  config: {}

, _store: {}

, _reportedMap: {}

, _startingIntervalSeries: []
  
, get: function (key) {
    return this._store[key];
  }

, set: function (key, value) {
    if (this.get(key)) {
      this.onError(new Error('kivi: You already set key[' + key + '] to [' + this.get(key) + '].'));
    } else if (typeof value !== 'number') { 
      this.onError(new Error('kivi: [' + key + '][' + value + '] is not a number.'));
    } else {
      this._store[key] = value;
    }
  }

, isReported: function (key) {
    return !!this._reportedMap[key];
  }

, _markReported: function (key) {
    this._reportedMap[key] = true;
  }

, clear: function () {
    this._store = {};
    this._reportedMap = {};
  }

, onError: function(error) {
    // IE-7 throws error if you use "console" instead of "window.console"
    if (window.console && window.console.log) {
      window.console.log(error.message);
    }
  }

, getConfig: function (key) {
    if (this.config[key]) {
      return this.config[key];
    } else {
      throw new Error('kivi: You need to set kivi.config.' + key);
    }
  }

, postKeys: function () {
    var keys = [];
    this._.each(this._store, function (v, k) {
      if (!this.isReported(k)) {
        keys.push(k);
      }
    }, this);
    return keys;
  }

, postList: function(keysToPost) {
    var keyPairs = [];
    keysToPost = keysToPost || this.postKeys();
    this._.each(keysToPost, function (k) {
      var pair = { 
        key: k
      , val: this.get(k)
      };
      keyPairs.push(pair);
    }, this);
    return keyPairs;
  }

/*
 * Default behavior is to return an array of key/value pairs.
 * postList() is a separate method in case a user wants reuse postList()
 * in the process of overriding postData().
 */
, postData: function(keysToPost) {
    var payload = this.postList(keysToPost);
    return payload;
  }

, post: function() {
    var that = this;
    var $ = this.getConfig('$');
    var url = this.getConfig('postUrl');
    var toJsonFunc = this.getToJSON();
    if ($ && url && toJsonFunc) {
      var postKeys = this.postKeys();
      
      if (postKeys.length > 0) {
        // Mark each key reported, so it won't get rereported if post is called
        // again before the first instance of post() is finished.
        this._.each(postKeys, function (k) {
          this._markReported(k)
        }, this);

        var data = this.postData(postKeys);

        $.ajax({
          url: url
        , type: 'POST'
        , data: toJsonFunc(data)
        , contentType:'application/json'
        , success: function () {}
        , error: function(jqXHR, textStatus, errorThrown){
            that.onError(new Error('kivi: Error posting stats: '+textStatus+' '+errorThrown));
          }
        });
      }
    }
  }

, getToJSON: function(object) {
    var toJsonFunc;

    if (window.JSON && window.JSON.stringify) {
      toJsonFunc = window.JSON.stringify;
    }

    // Fall back on $.toJSON for old browsers
    if (!toJsonFunc) {
      var $ = this.getConfig('$');
      if ($ && $.toJSON) {
        toJsonFunc = $.toJSON;
      }
    }
    return toJsonFunc;
  }

, _setTimer: function() {
    var that = this;
    var interval = this._startingIntervalSeries.shift();

    if (interval) {
      this._timer = setTimeout(function(){
        that.post();
        that._setTimer();
      }, interval);
    }
  }

, enablePost: function(startingIntervalSeries) {
    this._startingIntervalSeries = startingIntervalSeries || [];
    this._setTimer();
  }

, disablePost: function() {
    this._startingIntervalSeries = null;
    clearTimeout(this._timer);
  }
};

// Append a minimal Underscore implementation to kivi
(function () {
  var ArrayProto = Array.prototype;
  var nativeForEach = ArrayProto.forEach;
  var nativeEvery = ArrayProto.every;
  var breaker = {};

  var each = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (obj.hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  kivi._ = {};
  kivi._.each = each;
})();