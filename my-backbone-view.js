
define(['jquery', 'backbone', 'myModel', 'io', 'forceView', 'colorpicker'], function($, Backbone, MyModel, io, ForceView) {

  return Backbone.View.extend({
    el: 'body',
    events: {
      'click button.add-node': 'addNode',
      'click #editNodeModal button.btn.btn-primary': 'editNode'
    },

    initialize: function( options ) {
      var view = this;
      view.AppbaseSyncChannel = $.extend( {}, Backbone.Events );
      view.model = new MyModel();
      view.$el.find('#editNodeModal #textColorNode').colorpicker();

      ForceView.init( function() {
        ForceView.channel.trigger('clear', function() {
          view.sync();
        });
      });
    },

    openModal: function() {
      this.$el.find('#textColorNode').val( this.model.get('color') );
      this.$el.find('#textNode').val( this.model.get('label') );
      this.$el.find('#editNodeModal').modal('show');
    },

    hideModal: function() {
      this.$el.find('#editNodeModal').modal('hide');
    },

    editNode: function() {
      this.AppbaseSyncChannel.trigger('edit-node', {
        id: this.model.get('id'),
        color: this.$el.find('#textColorNode').val(),
        label: this.$el.find('#textNode').val()
      } );
      this.hideModal();
    },

    addNode: function() {
      this.AppbaseSyncChannel.trigger('add-node');
    },

    sync: function() {
      this.syncWithForceView();
      this.syncWithAppBase();
      console.log('ready!! backbone view loaded and sync');
    },

    syncWithAppBase: function() {
      var socket, AppbaseChannel;
      socket = io('https://dbas-with-socket-io.herokuapp.com/');
      AppbaseChannel = this.AppbaseSyncChannel;

      AppbaseChannel.on('remove-node', function(node) {
        socket.emit('remove-node', node);
      });

      AppbaseChannel.on('add-link', function(link) {
        if (link.target.id) {
          socket.emit( 'add-link', link );
        }
      });

      AppbaseChannel.on('remove-link', function(link) {
        socket.emit('remove-link', link);
      });

      AppbaseChannel.on('add-node', function(node, callback) {
        socket.emit( 'add-node', node || {}, callback );
      } );

      AppbaseChannel.on('edit-node', function(node) {
        socket.emit( 'edit-node', node );
      });

      socket.on( 'node-added', function(node) {
        ForceView.channel.trigger('add-node', node );
        ForceView.channel.trigger('remove-node', {});
      } );

      socket.on('node-removed', function(node) {
        ForceView.channel.trigger('remove-node', node);
      });

      socket.on( 'node-edited', function(node) {
        ForceView.channel.trigger('edit-node', node);
      } );

      socket.on( 'link-added', function(link) {
        ForceView.channel.trigger('add-link', link);
      } );

      socket.on( 'link-removed', function(link) {
        ForceView.channel.trigger('remove-link', link);
      } );

      socket.emit('retrieve-all-nodes');

    },

    syncWithForceView: function() {
      var view, AppbaseChannel;
      view = this;
      AppbaseChannel = view.AppbaseSyncChannel;

      ForceView.channel.on('node-removed', function(node) {
        AppbaseChannel.trigger( 'remove-node', node );
      });

      ForceView.channel.on('node-edited', function(node) {
        view.model.set({
          id: node.id,
          color: node.color,
          label: node.label
        });
        view.openModal();
      });

      ForceView.channel.on('link-added', function(link) {
        AppbaseChannel.trigger( 'add-link', link );
      });

      ForceView.channel.on('link-removed', function(link) {
        AppbaseChannel.trigger('remove-link', link);
      });

      ForceView.channel.on('node-and-link-added', function(data) {
        AppbaseChannel.trigger( 'add-node', data.node, function( node ) {
          data.node.id = node.id;
          ForceView.channel.trigger('link-added', data.link);
        } );
      });

      ForceView.channel.trigger('remove-node', {});
    }

  });

});
