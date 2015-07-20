require.config({
  baseUrl: 'js',
  paths: {
    backbone: 'lib/backbone.v1.2.0.min',
    bootstrap: 'lib/bootstrap.min',
    colorpicker: 'lib/bootstrap-colorpicker.min',
    d3: 'lib/d3.v2.min',
    jquery: 'lib/jquery.v1.11.2.min',
    underscore: 'lib/underscore.v1.8.3.min',

    forceView: 'force-view',
    myView: 'my-backbone-view',
    myModel: 'my-backbone-model',
    io: 'https://dbas-with-socket-io.herokuapp.com/socket.io/socket.io'
  },
  shim: {
    bootstrap: {
      deps: ['jquery']
    },
    d3: {
      exports: 'd3'
    },
    colorpicker: ['jquery']
  }
});

require( [ 'bootstrap', 'myView' ], function( bootstrap, MyView ) {
  new MyView();
} );
