require.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery.v1.11.2.min',
    bootstrap: 'lib/bootstrap.min',
    d3: 'lib/d3.v2.min',
    colorpicker: 'lib/bootstrap-colorpicker.min',
    pubsub: 'lib/PubSubJS',

    forceView: 'force-view',
    enter: 'enter',
    appbaseSync: 'appbase-sync',
    io: 'https://dbas-with-socket-io.herokuapp.com/socket.io/socket.io'
  },
  shim: {
    bootstrap: {
      deps: ['jquery']
    },
    login: {
      //deps: ['appbase']
    },
    d3: {
      exports: 'd3'
    },
    colorpicker: ['jquery']
  }
});

require( [ 'bootstrap', 'forceView' ], function( bootstrap, forceView ) {
  forceView.init();
  console.log( 'loaded' );
} );
