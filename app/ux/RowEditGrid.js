/**
 * Grid for editing multiple records.
 */

Ext.define('DMPlanner.ux.RowEditGrid', {
  extend : 'Ext.grid.Panel',
  alias : 'widget.dmpgrid',
  requires : ['Ext.grid.plugin.RowEditing' //
  ],

  title : 'Records',
  selType : 'rowmodel',

  dmpSerialize : function(records) {
    var obj = [];

    Ext.each(records, function(record) {
      var s = Ext.data.writer.Json.prototype.getRecordData(record);
      obj.push(s);
    });

    return obj;
  },

  printTemplate : Ext.create('Ext.XTemplate', '<ul>', '<tpl for=".">', '<li>{[this.format(values.fullname, values.text)]}</li>', '</tpl>', '</ul>', {
    format : function(full, text) {
      return full.replace(new RegExp(text + '$'), '<b>' + text + '</b>');
    }
  }),

  dmpPrint : function(data) {
    return this.printTemplate.apply(data);
  },

  initComponent : function() {
    var me = this,
        store,
        rowEdit;

    rowEdit = Ext.create('Ext.grid.plugin.RowEditing', {
      clicksToEdit : 1
    });

    store = Ext.create('Ext.data.Store', {
      fields : Ext.Array.pluck(me.columns, 'dataIndex'),
      autoDestroy : true,
      data : me.data,
      proxy : {
        type : 'memory',
        reader : {
          type : 'json',
          root : 'data'
        }
      },

      listeners : {
        update : function(store) {
          var me = this,
              recs = store.getRange(),
              data = me.dmpSerialize(recs);

          me.fireEvent('plugindatachanged', me, data);
        },
        scope : me
      }
    });
    //}

    Ext.applyIf(me, {
      dmpPlugin : true,
      columns : me.columns,
      store : store,
      plugins : [rowEdit],
      listeners : {
        'edit' : function(editor, e) {
          // commit the changes right after editing finished
          e.record.commit();
        }
      },
      dockedItems : [{
        xtype : 'toolbar',
        dock : 'top',
        items : [{
          text : 'Add',
          glyph : 'xf067@FontAwesome',
          scope : this,
          handler : function() {
            //rowEdit.cancelEdit();

            // Create a model instance
            var r = Ext.create(store.model, {
            });

            store.insert(0, r);
            //rowEdit.startEdit(0, 0);
          }
        }, {
          text : 'Remove',
          glyph : 'xf00d@FontAwesome',
          scope : this
        }]
      }]
    });

    me.callParent(arguments);
  }
});
