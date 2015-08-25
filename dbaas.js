define(['jquery', 'underscore', 'backbone', 'elasticsearch'], function($, _, Backbone) {
  var Channel, config, retrieveEdges, retrieveVertex, removeEdgeIfNeeded, checkIfVertexExistAndRemoveEdgeIfNeeded;

  /**
    NOTE: Remeber you are using my application pubsub_with_backbone_events.
    Appbase is completely free up to 100 thousand API calls per month.
    Feel free to use it while you're learning.
    After that, create your own application's name,
    then new learners can use my API calls left. Thanks.
  **/
  config = {
    appname: 'pubsub_with_backbone_events',
    url: 'https://P1y6pnqz0:e45be770-94fa-4658-8ae5-d15cae96c936@scalr.api.appbase.io',
    type: {
      vertex: 'vertex',
      edge: 'edge'
    },
    client: null,
    streamingClient: null
  };

  config.streamingClient = appbase.newClient({
    url: config.url,
    appname: config.appname
  });

  config.client = new $.es.Client({
    hosts: config.url
  });

  window.configDBaaS = config; //exporting config var for easy debugging
  /* END */

  checkIfVertexExistAndRemoveEdgeIfNeeded = function(edge, vertex) {
    config.streamingClient.streamDocument({
      type: config.type.vertex,
      id: vertex.id
    }).once('data', function(res) {
      !res.found && config.client.delete({
        index: config.appname,
        type: config.type.edge,
        id: edge._id
      }).then(function(response){
        console.warn( 'edge was removed because it was needed: ' + edge._id );
      });
    });
  };

  removeEdgeIfNeeded = function(edge) {
    checkIfVertexExistAndRemoveEdgeIfNeeded(edge, edge._source.source);
    checkIfVertexExistAndRemoveEdgeIfNeeded(edge, edge._source.target);
  };

  retrieveEdges = function() {
    config.streamingClient.streamSearch({
      type: config.type.edge,
      body: {
        from: 0,
        size: 1000,
        query: {
          match_all: {}
        }
      }
    }).on('data', function(res, err) {
      if (res.hits && res.hits.hits) {
        _.each(res.hits && res.hits.hits, function(link) {
          Channel.trigger( 'link-added', {
            source: link._source.source,
            target: link._source.target,
            id: link._id
          });
          removeEdgeIfNeeded(link);
        });
      } else if (res._deleted) {
        Channel.trigger( 'link-removed' , {id: res._id});
      } else {
        Channel.trigger( 'link-added', {
          source: res._source.source,
          target: res._source.target,
          id: res._id
        });
      }
    }).on('error', function(err) {
      console.log("caught a stream error", err);
    });
  };

  retrieveVertex = function(callback) {
    config.streamingClient.streamSearch({
      type: config.type.vertex,
      body: {
        from: 0,
        size: 1000,
        query: {
          match_all: {}
        }
      }
    }).on('data', function(res, err) {

      if (res.hits && res.hits.hits) {
        _.each(res.hits && res.hits.hits, function(node) {
          Channel.trigger( 'node-added', $.extend( node._source || {}, {
            id: node._id
          } ) );
        });
        callback && callback();
      } else if (res._deleted) {
        Channel.trigger( 'node-removed', {id: res._id} );
      } else if (res._source && res._source.id) {
        Channel.trigger( 'node-edited', $.extend( res._source || {}, {
          id: res._id
        } ) );
      } else {
        Channel.trigger( 'node-added', {id: res._id} );
      }

    }).on('error', function(err) {
      console.log("caught a stream error", err);
    });
  };

  Channel = $.extend( {}, Backbone.Events );

  Channel.on('retrieve-all-nodes', function() {
    retrieveVertex( retrieveEdges );
  });

  Channel.on('add-node', function( node, cb ) {
    config.client.index({
      index: config.appname,
      type: config.type.vertex,
      body: node
    }).then(function(response) {
      node.id = response._id;
      if (cb) {
        cb(node);
      } else {
        Channel.trigger( 'node-added', node );
      }
    }, function(error) {
      console.error(error);
    });
  });

  Channel.on('edit-node', function(node) {
    if (!node || !node.id) {
      return;
    }

    config.client.index({
      index: config.appname,
      type: config.type.vertex,
      id: node.id,
      body: node
    }).then(function(response) {
      Channel.trigger( 'node-edited', node );
    }, function(error) {
      console.error(error);
    });

  } );

  Channel.on('remove-node', function(node) {
    if (!node || !node.id) {
      return;
    }

    config.client.delete({
      index: config.appname,
      type: config.type.vertex,
      id: node.id
    }).then(function(response){
      Channel.trigger( 'node-removed', node.id );
    }, function(error) {
      console.error(error);
    });
  });

  Channel.on('add-link', function(link) {
    var source, target, id;
    if (!link || !link.source || !link.target || !link.source.id || !link.target.id) return;

    config.client.index({
      index: config.appname,
      type: config.type.edge,
      body: link
    }).then(function(response) {
      link.id = response._id;
      Channel.trigger( 'link-added', link );
    }, function(error) {
      console.error(error);
    });

  });

  Channel.on('remove-link', function(link) {
    if (!link || !link.id) {
      return;
    }

    config.client.delete({
      index: config.appname,
      type: config.type.edge,
      id: link.id
    }).then(function(response) {
      Channel.trigger( 'link-removed', link );
    }, function(error) {
      console.error(error);
    });

  });

  return Channel;
});

