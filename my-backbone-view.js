
define(['jquery', 'backbone', 'myModel', 'dbaas', 'forceView', 'colorpicker'], function($, Backbone, MyModel, db, ForceView) {

  return Backbone.View.extend({
    el: 'body',
    events: {
      'click button.add-node': 'addNode',
      'click #editNodeModal button.btn.btn-primary': 'editNode',
      'change #textNode': 'textChanged',
      'changeColor #textColorNode': 'colorChanged'
    },

    initialize: function( options ) {
      var view = this;
      view.dbChannel = $.extend( {}, Backbone.Events );
      view.model = new MyModel();
      view.$el.find('#textColorNode').colorpicker();

      ForceView.init( function() {
        ForceView.channel.trigger('clear', function() {
          view.sync();
        });
      });
    },

    textChanged: function() {
      this.model.set( 'label', this.$el.find('#textNode').val(), { silent: true } );
    },

    colorChanged: function() {
      this.model.set( 'color', this.$el.find('#textColorNode').val(), { silent: true } );
    },

    openModal: function() {
      this.$el.find('#editNodeModal').modal('show');
    },

    hideModal: function() {
      this.$el.find('#editNodeModal').modal('hide');
    },

    editNode: function() {
      this.dbChannel.trigger('edit-node', {
        id: this.model.get('id'),
        color: this.model.get('color'),
        label: this.model.get('label')
      } );
      this.hideModal();
    },

    addNode: function() {
      this.dbChannel.trigger('add-node');
    },

    sync: function() {
      var view = this;

      view.model.on('change:color', function(model, color) {
        view.$el.find('#textColorNode').val( color );
      });
      view.model.on('change:label', function(model, label) {
        view.$el.find('#textNode').val( label );
      });

      view.syncWithForceView();
      view.syncWithDBaaS();
      console.log('ready!! backbone view loaded and sync');
    },

    syncWithDBaaS: function() {
      var dbChannel = this.dbChannel;

      dbChannel.on('remove-node', function(node) {
        db.trigger('remove-node', node);
      });

      dbChannel.on('add-link', function(link) {
        if (link.target.id) {
          db.trigger( 'add-link', link );
        }
      });

      dbChannel.on('remove-link', function(link) {
        db.trigger('remove-link', link);
      });

      dbChannel.on('add-node', function(node, callback) {
        db.trigger( 'add-node', node || {}, callback );
      } );

      dbChannel.on('edit-node', function(node) {
        db.trigger( 'edit-node', node );
      });

      db.on( 'node-added', function(node) {
        ForceView.channel.trigger('add-node', node );
        ForceView.channel.trigger('remove-node', {});
      } );

      db.on('node-removed', function(node) {
        ForceView.channel.trigger('remove-node', node);
      });

      db.on( 'node-edited', function(node) {
        ForceView.channel.trigger('edit-node', node);
      } );

      db.on( 'link-added', function(link) {
        ForceView.channel.trigger('add-link', link);
      } );

      db.on( 'link-removed', function(link) {
        ForceView.channel.trigger('remove-link', link);
      } );

      db.trigger('retrieve-all-nodes');

    },

    syncWithForceView: function() {
      var view = this;

      ForceView.channel.on('node-removed', function(node) {
        view.dbChannel.trigger( 'remove-node', node );
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
        view.dbChannel.trigger( 'add-link', link );
      });

      ForceView.channel.on('link-removed', function(link) {
        view.dbChannel.trigger('remove-link', link);
      });

      ForceView.channel.on('node-and-link-added', function(data) {
        view.dbChannel.trigger( 'add-node', data.node, function( node ) {
          data.node.id = node.id;
          ForceView.channel.trigger('link-added', data.link);
        } );
      });

      ForceView.channel.trigger('remove-node', {});
    }

  });

});
