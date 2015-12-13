var pubnub = require("pubnub")({
    ssl           : true,  // <- enable TLS Tunneling over TCP
    publish_key   : "pub-c-94bb6d5e-1a8c-4360-9d78-58b1754625d6",
    subscribe_key : "sub-c-4b5c773a-9ea8-11e5-baf7-02ee2ddab7fe"
});

exports.publish = function(channel, data) {
  pubnub.publish({
      channel : channel,
      message : ''+data
  });
}

exports.subscribe = function(channel, callback) {
  pubnub.subscribe({
      channel  : channel,
      callback : callback
  });
}
