
define(['jquery', 'backbone', 'myModel', 'forceView'], function($, Backbone, MyModel, ForceView) {

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
      view.mediatorChannel = $.extend( {}, Backbone.Events );
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
      this.mediatorChannel.trigger('edit-node', {
        id: this.model.get('id'),
        color: this.model.get('color'),
        label: this.model.get('label')
      } );
      this.hideModal();
    },

    addNode: function() {
      this.mediatorChannel.trigger('add-node');
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
      var mediatorChannel = this.mediatorChannel;
      require(['dbaas'], function(dbaas) {

        mediatorChannel.on('remove-node', function(node) {
          dbaas.trigger('remove-node', node);
        });

        mediatorChannel.on('add-link', function(link) {
          if (link.target.id) {
            dbaas.trigger( 'add-link', link );
          }
        });

        mediatorChannel.on('remove-link', function(link) {
          dbaas.trigger('remove-link', link);
        });

        mediatorChannel.on('add-node', function(node, callback) {
          dbaas.trigger( 'add-node', node || {}, callback );
        } );

        mediatorChannel.on('edit-node', function(node) {
          dbaas.trigger( 'edit-node', node );
        });

        dbaas.on( 'node-added', function(node) {
          ForceView.channel.trigger('add-node', node );
          ForceView.channel.trigger('remove-node', {});
        } );

        dbaas.on('node-removed', function(node) {
          ForceView.channel.trigger('remove-node', node);
        });

        dbaas.on( 'node-edited', function(node) {
          ForceView.channel.trigger('edit-node', node);
        } );

        dbaas.on( 'link-added', function(link) {
          ForceView.channel.trigger('add-link', link);
        } );

        dbaas.on( 'link-removed', function(link) {
          ForceView.channel.trigger('remove-link', link);
        } );

        dbaas.trigger('retrieve-all-nodes');

      });
    },

    syncWithForceView: function() {
      var view = this;

      ForceView.channel.on('node-removed', function(node) {
        view.mediatorChannel.trigger( 'remove-node', node );
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
        view.mediatorChannel.trigger( 'add-link', link );
      });

      ForceView.channel.on('link-removed', function(link) {
        view.mediatorChannel.trigger('remove-link', link);
      });

      ForceView.channel.on('node-and-link-added', function(data) {
        view.mediatorChannel.trigger( 'add-node', data.node, function( node ) {
          data.node.id = node.id;
          ForceView.channel.trigger('link-added', data.link);
        } );
      });

      ForceView.channel.trigger('remove-node', {});
    }

  });

});
