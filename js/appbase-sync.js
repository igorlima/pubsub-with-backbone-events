define(['pubsub', 'jquery', 'io', 'colorpicker'], function(PubSub, $, io) {
  var socket = io('https://dbas-with-socket-io.herokuapp.com/');

  $('#editNodeModal #textColorNode').colorpicker();
  $('button.add-node').on('click', function() {
    socket.emit( 'add-node', {} );
  });

  $('button.remove-all-node').on('click', function() {
    socket.emit( 'remove-all-nodes' );
  });

  PubSub.subscribe('forceView:node-edited', function(msg, node) {
    $('#textColorNode').val(node.color);
    $('#textNode').val(node.label);
    $('#editNodeModal').modal('show');
    $('#editNodeModal button.btn.btn-primary')
      .off('click')
      .on('click', function(e) {
        socket.emit( 'edit-node', {
          id: node.id,
          color: $('#textColorNode').val(),
          label: $('#textNode').val()
        } );
        $('#editNodeModal').modal('hide');
      } );
  });

  PubSub.subscribe('forceView:link-added', function(msg, link) {
    if (link.target.id) {
      socket.emit( 'add-link', link );
    }
  });

  PubSub.subscribe('forceView:node-and-link-added', function(msg, data) {
    socket.emit( 'add-node', data.node, function( node ) {
      data.node.id = node.id;
      PubSub.publish('forceView:link-added', data.link);
    } );
  });

  PubSub.subscribe('forceView:node-removed', function(msg, node) {
    socket.emit('remove-node', node);
  });
  PubSub.subscribe('forceView:link-removed', function(msg, link) {
    socket.emit('remove-link', link);
  });
 
  PubSub.publish('forceView:remove-node', {});

  return {
    init: function () {
      PubSub.publish('forceView:clear', function() {
        socket.on( 'node-added', function(node) {
          PubSub.publish('forceView:add-node', node );
          PubSub.publish('forceView:remove-node', {});
        } );

        socket.on('node-removed', function(node) {
          PubSub.publish('forceView:remove-node', node);
        });

        socket.on( 'node-edited', function(node) {
          PubSub.publish('forceView:edit-node', node);
        } );

        socket.on( 'link-added', function(link) {
          PubSub.publish('forceView:add-link', link);
        } );

        socket.on( 'link-removed', function(link) {
          PubSub.publish('forceView:remove-link', link);
        } );

        socket.emit('retrieve-all-nodes');
        console.log('appbaseSync loaded');
      });
    }
  };
});
