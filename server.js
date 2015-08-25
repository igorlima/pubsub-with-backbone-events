
var express       = require('express'),
    appbase       = require("appbase-js"),
    elasticsearch = require('elasticsearch'),
    CronJob       = require('cron').CronJob,
    _             = require('underscore');
 
var app = express()
  .use(express.static(__dirname + '/'))
  .listen(process.env.PORT || 5000, function() {
    console.log('listening on *:' + (process.env.PORT || 5000) );
  });


// app and authentication configurations
var config = {
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

config.client = new elasticsearch.Client({
  hosts: config.url
});

function checkIfVertexExistAndRemoveEdgeIfNeeded(edge, vertex) {
  config.streamingClient.streamDocument({
    type: config.type.vertex,
    id: vertex.id
  }).once('data', function(res) {
    !res.found && config.client.delete({
      index: config.appname,
      type: config.type.edge,
      id: edge._id
    }).then(function(response){
      console.warn( 'edge was removed because it was necessary: ' + edge._id );
    });
  });
}

function removeEdgeIfNeeded(edge) {
  checkIfVertexExistAndRemoveEdgeIfNeeded(edge, edge._source.source);
  checkIfVertexExistAndRemoveEdgeIfNeeded(edge, edge._source.target);
};

function removeEdgesIfNeeded() {
  config.streamingClient.streamSearch({
    type: config.type.edge,
    body: {
      from: 0,
      size: 50,
      query: {
        match_all: {}
      }
    }
  }).once('data', function(res, err) {
    _.each(res.hits && res.hits.hits, function(edge) {
      removeEdgeIfNeeded(edge);
    });
  });
};

// Runs every MINUTE to remove edges not used
new CronJob('59 * * * * *', function() {
  removeEdgesIfNeeded();
  console.log( 'Removed edges not necessary: ' + new Date() );
  }, function () {
    /* This function is executed when the job stops */
  },
  true, /* Start the job right now */
  'America/Los_Angeles' /* Time zone of this job. */
);

// Runs every HOUR to remove all nodes
new CronJob('* 59 * * * *', function() {
    config.streamingClient.streamSearch({
      type: config.type.vertex,
      body: {
        from: 0,
        size: 300,
        query: {
          match_all: {}
        }
      }
    }).once('data', function(res, err) {
      _.each(res.hits && res.hits.hits, function(vertex) {
        config.client.delete({
          index: config.appname,
          type: config.type.vertex,
          id: vertex._id
        }).then(function(response){
          console.warn( 'node was removed: ' + vertex._id );
        });
      });
    });

    console.log( 'Removed all nodes: ' + new Date() );

  }, function () {
    /* This function is executed when the job stops */
  },
  true, /* Start the job right now */
  'America/Los_Angeles' /* Time zone of this job. */
);
